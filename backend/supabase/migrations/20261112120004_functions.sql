-- Ranking de similitud en SQL (mismo cálculo que src/lib/similarity.ts):
-- score = 100 * (1 - distancia euclidiana ponderada y normalizada), sobre las variables que ambos sitios tienen.
--
--   select * from match_sites('<uuid del sitio>', 'moon', '{"cold": 2, "ice": 0.5}');
--
-- p_body filtra el cuerpo de los resultados ('earth', 'moon', 'mars'); nulo = todos.
-- p_weights: peso por variable (por defecto 1). security invoker: respeta RLS, solo ve sitios publicados.

create function public.match_sites(
  p_site_id      uuid,
  p_body         text default null,
  p_weights      jsonb default '{}'::jsonb,
  p_limit        integer default 10,
  p_min_features integer default 3
)
returns table (site_id uuid, slug text, name text, body_id text, score integer)
language sql stable security invoker set search_path = '' as $$
  with w as (
    select f.key, coalesce((p_weights ->> f.key)::numeric, 1) as weight
    from public.features f
  ),
  pairs as (
    select t.site_id, w.weight, power(t.value - q.value, 2) as d2
    from public.site_features q
    join public.site_features t on t.feature_key = q.feature_key and t.site_id <> q.site_id
    join w on w.key = q.feature_key
    where q.site_id = p_site_id
  ),
  scored as (
    select p.site_id, sum(p.weight * p.d2) / nullif(sum(p.weight), 0) as msd
    from pairs p
    group by p.site_id
    having count(*) >= p_min_features
  )
  select s.id, s.slug, s.name, s.body_id, round(100 * (1 - sqrt(sc.msd)))::integer as score
  from scored sc
  join public.sites s on s.id = sc.site_id
  where s.status = 'published'
    and sc.msd is not null
    and (p_body is null or s.body_id = p_body)
  order by score desc, s.name
  limit greatest(p_limit, 1);
$$;
