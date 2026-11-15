# Base de datos (Supabase)

```
backend/
├─ package.json     scripts: db:seed, test:db
├─ scripts/         generate-seed.mjs → crea supabase/seed.sql
├─ tests/           db.test.mjs: valida migraciones, seed y RLS sin Docker (PGlite)
└─ supabase/
   ├─ migrations/   esquema, uno por tema (se aplican en orden por nombre)
   └─ seed.sql      datos iniciales (generado; se puede regenerar)
```

Los comandos de la CLI de Supabase se ejecutan **desde `backend/`**, que es la raíz del proyecto Supabase.

## Modelo

| Tabla | Qué guarda |
|---|---|
| `bodies` | Tierra, Luna y Marte |
| `features` | Variables comparables (aridez, frío, radiación, rugosidad, basalto, hielo). Una variable nueva = una fila, sin migración |
| `datasets` | Fuentes con proveedor, licencia, resolución y si son ilustrativas |
| `sites` | Análogos terrestres **y** sitios de la Luna y Marte. `analog_of` dice de qué cuerpo es análogo un sitio terrestre. `status` (`draft`, `pending`, `published`, `rejected`) y `source` (`curated`, `community`) |
| `site_features` | Valor 0-1 por sitio y variable, con la medición original, su unidad y su fuente |
| `site_media` | Fotos (Storage) o URLs externas, con crédito y licencia |
| `site_votes` | Un voto (+1 / −1) por usuario y sitio publicado |
| `earth_cells` | Malla global para el mapa de calor (variables en `jsonb`) |
| `profiles` | Perfil del usuario y su rol (`user`, `reviewer`, `admin`) |

Funciones: `match_sites(site_id, body, weights)` calcula el ranking de similitud en SQL con el mismo
cálculo que `frontend/src/lib/similarity.ts`; `earth_grid()` devuelve toda la malla en un solo `jsonb`.

## Seguridad

- Catálogos y malla: lectura pública. Solo la clave **secret** (rol `service_role`) escribe, desde los scripts de ingesta.
- Sitios: el público ve los `published`. Cada usuario ve y edita sus propuestas mientras estén en
  `draft`/`pending`, y **no puede publicar**; solo un revisor/admin cambia el estado.
- Variables (`site_features`): solo revisores y la clave secret.
- Fotos: bucket público `site-media`; cada usuario sube solo a su carpeta `<user_id>/...`.
- Para que cualquiera proponga sin registrarse, activa **Authentication → Sign In / Providers →
  Allow anonymous sign-ins**.

## Puesta en marcha

1. Crea el proyecto en [supabase.com](https://supabase.com). Copia las claves a
   `frontend/.env.local` y `backend/.env.local` (ver los `.env.example` de cada carpeta).
2. Desde `backend/`:

   ```bash
   cd backend
   npx supabase init                       # crea supabase/config.toml (no toca las migraciones)
   npx supabase login
   npx supabase link --project-ref TU_REF  # el ref está en la URL del proyecto
   npx supabase db push                    # aplica las migraciones
   ```

3. Carga los datos iniciales: abre `backend/supabase/seed.sql` en el **SQL Editor** del panel y
   ejecútalo (es idempotente). Con Docker y `npx supabase start`, `npx supabase db reset` lo aplica solo.
4. Hazte revisor para poder aprobar propuestas (reemplaza el correo):

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'tu@correo.com');
   ```

### Sin la CLI (más rápido)

```bash
npm run db:bundle   # desde la raíz: crea backend/supabase/bundle.sql (migraciones + seed)
```

Abre ese archivo, cópialo completo en el **SQL Editor** del panel y ejecútalo **una sola vez** en un
proyecto vacío (las migraciones no son idempotentes; para cambios posteriores usa `db push`).

## Pruebas

```bash
npm run test:db     # desde la raíz
```

Aplica las migraciones y el seed en un Postgres en memoria y comprueba el ranking y la seguridad.
PostGIS, `auth` y `storage` se simulan, así que los índices espaciales y `location` solo se
validan de verdad al hacer `db push`.

## Regenerar el seed

```bash
npm run db:seed     # desde la raíz
```

Lee `frontend/src/data/analogs.json` y `sites.json`, consulta NASA POWER (sin clave) y reescribe
`seed.sql`. Los valores de Luna y Marte y los rasgos de terreno están marcados como **ilustrativos**
(`is_illustrative`) hasta que lleguen los datos reales.

## Tipos de TypeScript

```bash
npx supabase gen types typescript --project-id TU_REF > ../frontend/src/lib/database.types.ts
```

## Para el 14 de noviembre

Los datos nuevos no necesitan migración: inserta un `datasets` con su procedencia y filas en
`site_features` (o `earth_cells.features`) apuntando a ese `dataset_id`. Si aparece una variable
nueva, agrégala a `features`. Los scripts de ingesta usan `SUPABASE_SECRET_KEY` (solo en
`backend/`) y nunca van al navegador.
