-- Malla global de la Tierra para el mapa de calor de similitud.
-- Cada celda guarda sus variables normalizadas (0-1) en un jsonb: {"aridity": 0.9, "cold": 0.1, ...}.
-- Los scripts de ingesta (con service role) la llenan; la web la descarga entera con earth_grid().

create table public.earth_cells (
  id             text primary key,
  lat            double precision not null check (lat between -90 and 90),
  lng            double precision not null check (lng between -180 and 180),
  location       extensions.geography(Point, 4326) generated always as (
                   extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
                 ) stored,
  resolution_deg numeric not null check (resolution_deg > 0),
  features       jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  dataset_ids    uuid[] not null default '{}',
  updated_at     timestamptz not null default now()
);

create index earth_cells_location_idx on public.earth_cells using gist (location);

create trigger earth_cells_set_updated_at
  before update on public.earth_cells
  for each row execute function public.set_updated_at();

-- Devuelve toda la malla como un solo jsonb: evita el límite de filas de PostgREST
-- y permite calcular la similitud en el navegador con los sliders.
create function public.earth_grid() returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('id', id, 'lat', lat, 'lng', lng, 'f', features)),
    '[]'::jsonb
  )
  from public.earth_cells;
$$;
