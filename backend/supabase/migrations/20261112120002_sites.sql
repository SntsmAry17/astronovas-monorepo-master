-- Perfiles, sitios (análogos terrestres y sitios de referencia de la Luna/Marte), variables, medios y votos.

-- ---------------------------------------------------------------- perfiles
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  role         public.user_role not null default 'user',
  created_at   timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', nullif(split_part(new.email, '@', 1), ''), 'Anónimo'))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Revisores y admins pueden publicar y moderar propuestas.
create function public.is_reviewer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('reviewer', 'admin')
  );
$$;

-- ------------------------------------------------------------------ sitios
create table public.sites (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  body_id      text not null references public.bodies (id),
  -- Solo para sitios terrestres: de qué cuerpo es análogo (moon o mars).
  analog_of    text references public.bodies (id),
  name         text not null,
  region       text,
  terrain_type text,
  description  text,
  soil         text,
  lat          double precision not null check (lat between -90 and 90),
  lng          double precision not null check (lng between -180 and 180),
  location     extensions.geography(Point, 4326) generated always as (
                 extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
               ) stored,
  -- Tres colores del degradado de respaldo cuando aún no hay imagen.
  palette      text[] check (palette is null or cardinality(palette) = 3),
  status       public.site_status not null default 'pending',
  source       public.site_source not null default 'community',
  created_by   uuid references auth.users (id) on delete set null,
  reviewed_by  uuid references auth.users (id) on delete set null,
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint sites_analog_of_only_on_earth
    check ((body_id = 'earth') = (analog_of is not null) and analog_of is distinct from 'earth')
);

create index sites_location_idx   on public.sites using gist (location);
create index sites_body_status_idx on public.sites (body_id, status);
create index sites_created_by_idx on public.sites (created_by);

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- Los usuarios normales solo proponen: no pueden publicar ni tocar campos de revisión.
-- auth.uid() nulo = service role / migraciones / seed, que pasan sin restricción.
create function public.guard_site_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.is_reviewer() then
    return new;
  end if;

  if new.status not in ('draft', 'pending') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    raise exception 'Solo un revisor puede cambiar el estado a %', new.status using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.source      := 'community';
    new.created_by  := (select auth.uid());
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
  else
    new.source      := old.source;
    new.created_by  := old.created_by;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;
  end if;
  return new;
end $$;

create trigger sites_guard_write
  before insert or update on public.sites
  for each row execute function public.guard_site_write();

-- ----------------------------------------------------- variables por sitio
create table public.site_features (
  site_id         uuid not null references public.sites (id) on delete cascade,
  feature_key     text not null references public.features (key),
  -- Valor normalizado 0-1 que usa el motor de similitud.
  value           numeric not null check (value between 0 and 1),
  -- Medición original y su unidad (ej. 14.5 °C), para mostrar y auditar.
  raw_value       numeric,
  raw_unit        text,
  dataset_id      uuid references public.datasets (id),
  is_illustrative boolean not null default false,
  note            text,
  updated_at      timestamptz not null default now(),
  primary key (site_id, feature_key)
);

create index site_features_feature_idx on public.site_features (feature_key);

create trigger site_features_set_updated_at
  before update on public.site_features
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ medios
create table public.site_media (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites (id) on delete cascade,
  kind         public.media_kind not null default 'photo',
  -- Ruta en el bucket de Storage "site-media", o una URL externa (ej. NASA GIBS).
  storage_path text,
  external_url text,
  caption      text,
  credit       text,
  license      text,
  is_cover     boolean not null default false,
  sort_order   integer not null default 0,
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  constraint site_media_one_source check (num_nonnulls(storage_path, external_url) = 1)
);

create index site_media_site_idx on public.site_media (site_id, sort_order);
create unique index site_media_one_cover_idx on public.site_media (site_id) where is_cover;

-- ------------------------------------------------------------------- votos
create table public.site_votes (
  site_id    uuid not null references public.sites (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create view public.site_vote_totals with (security_invoker = true) as
select
  site_id,
  count(*) filter (where value = 1)  as upvotes,
  count(*) filter (where value = -1) as downvotes,
  coalesce(sum(value), 0)::int       as score
from public.site_votes
group by site_id;
