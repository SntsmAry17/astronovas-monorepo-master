// Junta las migraciones y el seed en un solo archivo para pegarlo en el SQL Editor de Supabase.
//
//   npm run db:bundle        (desde la raíz del repo)
//
// Resultado: backend/supabase/bundle.sql (ignorado por git). Pégalo y ejecútalo UNA sola vez en un proyecto vacío:
// las migraciones no son idempotentes. Para cambios posteriores usa `supabase db push` o un archivo nuevo en migrations/.

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supabaseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase");
const migrationsDir = path.join(supabaseDir, "migrations");

const parts = ["-- BUNDLE generado por backend/scripts/bundle-sql.mjs. Ejecutar una sola vez en un proyecto vacío.\n"];
for (const file of (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort()) {
  parts.push(`-- ============================================================ ${file}\n`);
  parts.push((await readFile(path.join(migrationsDir, file), "utf8")).trimEnd() + "\n");
}
parts.push("-- ============================================================ seed.sql\n");
parts.push((await readFile(path.join(supabaseDir, "seed.sql"), "utf8")).trimEnd() + "\n");

const out = path.join(supabaseDir, "bundle.sql");
await writeFile(out, parts.join("\n"), "utf8");
console.log(`Listo: ${path.relative(process.cwd(), out)} (${(Buffer.byteLength(parts.join("\n")) / 1024).toFixed(1)} KB)`);
