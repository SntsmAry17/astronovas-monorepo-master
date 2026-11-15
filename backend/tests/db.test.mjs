// Valida migraciones, seed y políticas RLS en un Postgres en memoria (PGlite), sin Docker ni cuenta de Supabase.
//
//   npm run test:db        (desde la raíz del repo)
//
// PGlite no trae PostGIS, auth ni storage: se simulan con lo mínimo (ver `shim`). Por eso los índices
// espaciales y la columna `location` no se prueban de verdad; todo lo demás (tablas, triggers, RLS, funciones) sí.

import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supabaseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase");
const db = new PGlite();

const shim = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
create schema extensions;
create domain extensions.geography as text;
create function extensions.st_makepoint(double precision, double precision) returns text language sql immutable as $$ select $1::text || ',' || $2::text $$;
create function extensions.st_setsrid(text, integer) returns text language sql immutable as $$ select $1 $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to authenticated, anon;
grant all on storage.objects to authenticated;
`;
await db.exec(shim);

for (const f of (await readdir(path.join(supabaseDir, "migrations"))).sort()) {
  const sql = (await readFile(path.join(supabaseDir, "migrations", f), "utf8"))
    .replace(/create extension if not exists postgis[^;]*;/g, "")
    .replaceAll("extensions.geography(Point, 4326)", "extensions.geography")
    .replace(/create index [^;]*using gist \(location\);/g, "");
  await db.exec(sql);
  console.log("OK  migración", f);
}

const seed = await readFile(path.join(supabaseDir, "seed.sql"), "utf8");
await db.exec(seed);
await db.exec(seed); // debe ser idempotente
console.log("OK  seed (aplicado dos veces)");

const one = async (sql, params) => (await db.query(sql, params)).rows;
const count = async (t) => (await one(`select count(*)::int as n from public.${t}`))[0].n;
const as = async (role, uid) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false); set role ${role};`);
};

let passed = 0;
let failed = 0;
const ok = async (name, fn) => {
  try {
    await fn();
    console.log("  ✔", name);
    passed++;
  } catch (e) {
    console.log("  ✘", name, "→", e.message);
    failed++;
  }
};
const blocked = async (name, fn) => {
  try {
    await fn();
    console.log("  ✘", name, "(debía fallar)");
    failed++;
  } catch {
    console.log("  ✔", name);
    passed++;
  }
};
const equal = (actual, expected) => {
  if (actual !== expected) throw new Error(`esperaba ${expected}, obtuvo ${actual}`);
};

console.log("Datos:");
await ok("18 sitios, 108 valores y 2 fuentes", async () => {
  equal(await count("sites"), 18);
  equal(await count("site_features"), 108);
  equal(await count("datasets"), 2);
});

const atacama = (await one(`select id from public.sites where slug='atacama'`))[0].id;
await ok("match_sites devuelve un ranking ordenado por puntaje", async () => {
  const moon = await one(`select name, score from public.match_sites($1, 'moon')`, [atacama]);
  const mars = await one(`select name, score from public.match_sites($1, 'mars')`, [atacama]);
  equal(moon.length, 6);
  equal(mars.length, 7);
  for (const list of [moon, mars]) for (let i = 1; i < list.length; i++) equal(list[i - 1].score >= list[i].score, true);
});
await ok("match_sites respeta los pesos (solo frío)", async () => {
  const cold = await one(
    `select score from public.match_sites($1, 'mars', '{"aridity":0,"radiation":0,"roughness":0,"basalt":0,"ice":0}')`,
    [atacama],
  );
  equal(cold[0].score < 40, true); // Atacama no es fría: poco parecida a Marte en esa sola variable
});

const u1 = (await one(`insert into auth.users (email) values ('u1@x.com') returning id`))[0].id;
const u2 = (await one(`insert into auth.users (email) values ('u2@x.com') returning id`))[0].id;

console.log("Seguridad (RLS):");
await ok("un perfil se crea al registrarse", async () => equal(await count("profiles"), 2));

await as("anon", null);
await ok("anon ve los 18 sitios publicados", async () => equal(await count("sites"), 18));
await blocked("anon no puede insertar sitios", () =>
  db.exec(`insert into public.sites (slug, body_id, analog_of, name, lat, lng) values ('x','earth','moon','X',0,0)`),
);

await as("authenticated", u1);
await ok("un usuario propone un sitio: queda community, pending y suyo", async () => {
  await db.exec(
    `insert into public.sites (slug, body_id, analog_of, name, lat, lng, source, created_by)
     values ('mi-sitio','earth','moon','Mi sitio',13.7,-89.2,'curated','${u2}')`,
  );
  const r = (await one(`select source, status, created_by = '${u1}' as mine from public.sites where slug='mi-sitio'`))[0];
  equal(`${r.source}/${r.status}/${r.mine}`, "community/pending/true");
});
await blocked("no puede publicar su propuesta", () => db.exec(`update public.sites set status='published' where slug='mi-sitio'`));
await blocked("no puede insertar un sitio ya publicado", () =>
  db.exec(`insert into public.sites (slug, body_id, analog_of, name, lat, lng, status) values ('otro','earth','mars','O',1,1,'published')`),
);
await ok("puede editar su propuesta", () => db.exec(`update public.sites set name='Mi sitio v2' where slug='mi-sitio'`));
await blocked("no puede escalar su rol", () => db.exec(`update public.profiles set role='admin' where id='${u1}'`));
await blocked("no puede escribir variables", () =>
  db.exec(`insert into public.site_features (site_id, feature_key, value) select id,'cold',0.5 from public.sites where slug='mi-sitio'`),
);
await blocked("un sitio terrestre exige analog_of", () =>
  db.exec(`insert into public.sites (slug, body_id, name, lat, lng) values ('mal','earth','M',1,1)`),
);
await blocked("no puede votar su propio sitio no publicado", () =>
  db.exec(`insert into public.site_votes (site_id, value) select id, 1 from public.sites where slug='mi-sitio'`),
);

await as("authenticated", u2);
await ok("otro usuario no ve la propuesta pendiente", async () => {
  equal((await one(`select count(*)::int n from public.sites where slug='mi-sitio'`))[0].n, 0);
});
await ok("vota un sitio publicado", () =>
  db.exec(`insert into public.site_votes (site_id, value) select id, 1 from public.sites where slug='atacama'`),
);
await blocked("no vota dos veces el mismo sitio", () =>
  db.exec(`insert into public.site_votes (site_id, value) select id, 1 from public.sites where slug='atacama'`),
);
await ok("los totales de votos son visibles", async () => {
  const r = (await one(`select upvotes::int as up, score from public.site_vote_totals`))[0];
  equal(`${r.up}/${r.score}`, "1/1");
});

await db.exec(`reset role; update public.profiles set role='reviewer' where id='${u2}'`);
await as("authenticated", u2);
await ok("un revisor publica la propuesta", () =>
  db.exec(`update public.sites set status='published', reviewed_by='${u2}', reviewed_at=now() where slug='mi-sitio'`),
);
await ok("un revisor escribe variables", () =>
  db.exec(`insert into public.site_features (site_id, feature_key, value) select id,'cold',0.5 from public.sites where slug='mi-sitio'`),
);

await as("anon", null);
await ok("anon ve ahora 19 sitios", async () => equal(await count("sites"), 19));
await ok("earth_grid() responde (vacía sin ingesta)", async () => {
  equal(JSON.stringify((await one(`select public.earth_grid() as g`))[0].g), "[]");
});

await db.exec("reset role");
console.log(`\nResultado: ${passed} correctas, ${failed} fallidas`);
process.exit(failed ? 1 : 0);
