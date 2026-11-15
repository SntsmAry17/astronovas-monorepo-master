-- Seguridad a nivel de fila (RLS) y permisos.
--
-- Modelo:
--   * Catálogos (bodies, features, datasets, earth_cells): lectura pública; solo service role escribe.
--   * Sitios: el público ve los publicados; cada usuario ve y edita sus propuestas mientras estén
--     en draft/pending; revisores y admins ven y moderan todo.
--   * Variables (site_features): solo revisores/service role (las calcula el equipo, no el público).
--   * Medios y votos: cada usuario gestiona lo suyo.
-- Con "anonymous sign-ins" activado en Supabase Auth, cualquier visitante puede proponer sin registrarse.

alter table public.bodies        enable row level security;
alter table public.features      enable row level security;
alter table public.datasets      enable row level security;
alter table public.earth_cells   enable row level security;
alter table public.profiles      enable row level security;
alter table public.sites         enable row level security;
alter table public.site_features enable row level security;
alter table public.site_media    enable row level security;
alter table public.site_votes    enable row level security;

-- --------------------------------------------------------------- permisos
grant select on
  public.bodies, public.features, public.datasets, public.earth_cells, public.profiles,
  public.sites, public.site_features, public.site_media, public.site_votes, public.site_vote_totals
to anon, authenticated;

grant insert, update, delete on
  public.sites, public.site_features, public.site_media, public.site_votes
to authenticated;

-- El rol del perfil no se puede cambiar desde la API.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- --------------------------------------------------------------- catálogos
create policy "bodies_read"      on public.bodies      for select using (true);
create policy "features_read"    on public.features    for select using (true);
create policy "datasets_read"    on public.datasets    for select using (true);
create policy "earth_cells_read" on public.earth_cells for select using (true);

-- ---------------------------------------------------------------- perfiles
create policy "profiles_read" on public.profiles for select using (true);

create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ------------------------------------------------------------------ sitios
create policy "sites_read" on public.sites for select using (
  status = 'published'
  or created_by = (select auth.uid())
  or public.is_reviewer()
);

create policy "sites_insert_own" on public.sites for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and source = 'community'
    and status in ('draft', 'pending')
  );

create policy "sites_insert_reviewer" on public.sites for insert to authenticated
  with check (public.is_reviewer());

create policy "sites_update_own" on public.sites for update to authenticated
  using (created_by = (select auth.uid()) and status in ('draft', 'pending'))
  with check (created_by = (select auth.uid()) and status in ('draft', 'pending'));

create policy "sites_update_reviewer" on public.sites for update to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer());

create policy "sites_delete_own" on public.sites for delete to authenticated
  using (created_by = (select auth.uid()) and status in ('draft', 'pending'));

create policy "sites_delete_reviewer" on public.sites for delete to authenticated
  using (public.is_reviewer());

-- ------------------------------------------------------------- site_features
-- Visibles cuando el sitio es visible para quien consulta (la subconsulta ya aplica RLS de sites).
create policy "site_features_read" on public.site_features for select using (
  exists (select 1 from public.sites s where s.id = site_id)
);

create policy "site_features_write_reviewer" on public.site_features for all to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer());

-- --------------------------------------------------------------- site_media
create policy "site_media_read" on public.site_media for select using (
  exists (select 1 from public.sites s where s.id = site_id)
);

create policy "site_media_insert_own" on public.site_media for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.sites s where s.id = site_id and s.created_by = (select auth.uid()))
  );

create policy "site_media_insert_reviewer" on public.site_media for insert to authenticated
  with check (public.is_reviewer());

create policy "site_media_update_own" on public.site_media for update to authenticated
  using (created_by = (select auth.uid()) or public.is_reviewer())
  with check (created_by = (select auth.uid()) or public.is_reviewer());

create policy "site_media_delete_own" on public.site_media for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_reviewer());

-- --------------------------------------------------------------- site_votes
create policy "site_votes_read" on public.site_votes for select using (true);

-- Solo se vota en sitios publicados y no en los propios.
create policy "site_votes_insert_own" on public.site_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.sites s
      where s.id = site_id and s.status = 'published' and s.created_by is distinct from (select auth.uid())
    )
  );

create policy "site_votes_update_own" on public.site_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "site_votes_delete_own" on public.site_votes for delete to authenticated
  using (user_id = (select auth.uid()));
