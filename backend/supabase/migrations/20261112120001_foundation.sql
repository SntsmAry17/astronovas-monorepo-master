-- Base: extensiones, tipos y catálogos de referencia (cuerpos, variables, fuentes de datos).

create extension if not exists postgis with schema extensions;

create type public.site_status as enum ('draft', 'pending', 'published', 'rejected');
create type public.site_source as enum ('curated', 'community');
create type public.media_kind  as enum ('photo', 'satellite', 'map', 'diagram');
create type public.user_role   as enum ('user', 'reviewer', 'admin');

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Cuerpos celestes comparables.
create table public.bodies (
  id          text primary key check (id ~ '^[a-z]+$'),
  name        text not null,
  radius_km   numeric not null check (radius_km > 0),
  description text,
  texture_url text
);

-- Variables comparables entre cuerpos (todas normalizadas a 0-1 en site_features).
-- Agregar una variable nueva es insertar una fila aquí: no requiere migración.
create table public.features (
  key         text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  label       text not null,
  description text,
  raw_unit    text,
  sort_order  smallint not null default 0
);

-- Procedencia de los datos: cada valor del sitio apunta a su fuente.
create table public.datasets (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  provider          text not null,
  body_id           text references public.bodies (id),
  url               text,
  license           text,
  resolution        text,
  temporal_coverage text,
  is_illustrative   boolean not null default false,
  retrieved_at      timestamptz,
  notes             text,
  created_at        timestamptz not null default now()
);

comment on table public.features is 'Variables comparables; el valor normalizado 0-1 vive en site_features.value.';
comment on table public.datasets is 'Fuentes de datos con procedencia, licencia y resolución.';
