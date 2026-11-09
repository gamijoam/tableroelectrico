-- =====================================================================
-- Métricas: visitas (también de quien no tiene cuenta), de dónde vienen,
-- qué usan, y cuándo entró por última vez cada usuario.
-- Solo el administrador puede leerlas. Se puede ejecutar más de una vez.
-- =====================================================================
alter table public.profiles add column if not exists last_seen_at timestamptz;
-- quien ya tenía cuenta: su último inicio de sesión cuenta como última conexión
update public.profiles p set last_seen_at = u.last_sign_in_at from auth.users u where u.id = p.id and p.last_seen_at is null and u.last_sign_in_at is not null;

create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  visitor text not null check (length(visitor) between 8 and 40),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  kind text not null check (kind in ('visita','simular','pdf','whatsapp','imagen','registro','instalar','comprar')),
  source text check (length(source) <= 30),
  device text check (device in ('movil','tablet','pc')),
  installed boolean not null default false,
  first_visit boolean not null default false
);
create index if not exists app_events_at_idx on public.app_events (at);
alter table public.app_events enable row level security;
drop policy if exists "métricas: cualquiera registra" on public.app_events;
create policy "métricas: cualquiera registra" on public.app_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
drop policy if exists "métricas: el admin lee" on public.app_events;
create policy "métricas: el admin lee" on public.app_events for select using (public.is_admin());
grant insert on public.app_events to anon, authenticated;

-- "estoy aquí": guarda cuándo entró el usuario por última vez
create or replace function public.touch_seen() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = auth.uid()
$$;
grant execute on function public.touch_seen() to authenticated;

-- usuarios para el panel, ahora con su última conexión
drop function if exists public.admin_users();
create function public.admin_users() returns table (
  id uuid, email text, nombre text, telefono text, pro boolean, trial_ends_at timestamptz, created_at timestamptz, proyectos bigint, last_seen_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.nombre, p.telefono, p.pro, p.trial_ends_at, p.created_at,
         (select count(*) from public.projects x where x.user_id = p.id), p.last_seen_at
  from public.profiles p where public.is_admin() order by coalesce(p.last_seen_at, p.created_at) desc
$$;
grant execute on function public.admin_users() to authenticated;

-- resumen para la pestaña Estadísticas
create or replace function public.admin_stats(days int default 30) returns json
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := date_trunc('day', now() at time zone 'America/Caracas') at time zone 'America/Caracas' - make_interval(days => days - 1);
begin
  if not public.is_admin() then raise exception 'solo el administrador'; end if;
  return json_build_object(
    'visitantes', (select count(distinct visitor) from app_events where kind = 'visita' and at >= since),
    'visitas', (select count(*) from app_events where kind = 'visita' and at >= since),
    'nuevos', (select count(distinct visitor) from app_events where kind = 'visita' and first_visit and at >= since),
    'registros', (select count(*) from profiles where created_at >= since),
    'ventas', (select count(*) from payments where status = 'approved' and coalesce(reviewed_at, created_at) >= since),
    'activos7', (select count(*) from profiles where last_seen_at >= now() - interval '7 days'),
    'usuarios', (select count(*) from profiles),
    'pro', (select count(*) from profiles where pro),
    'instalada', (select count(distinct visitor) from app_events where kind = 'visita' and installed and at >= since),
    'por_dia', (select coalesce(json_agg(d order by d.dia), '[]') from (
        select to_char(g.dia, 'YYYY-MM-DD') dia,
          (select count(distinct visitor) from app_events e where e.kind = 'visita' and (e.at at time zone 'America/Caracas')::date = g.dia) visitantes,
          (select count(*) from profiles p where (p.created_at at time zone 'America/Caracas')::date = g.dia) registros
        from generate_series((since at time zone 'America/Caracas')::date, (now() at time zone 'America/Caracas')::date, interval '1 day') as g(dia)) d),
    'fuentes', (select coalesce(json_agg(x order by x.n desc), '[]') from (
        select coalesce(nullif(source, ''), 'directo') k, count(distinct visitor) n from app_events where kind = 'visita' and at >= since group by 1) x),
    'equipos', (select coalesce(json_agg(x order by x.n desc), '[]') from (
        select coalesce(device, 'pc') k, count(distinct visitor) n from app_events where kind = 'visita' and at >= since group by 1) x),
    'acciones', (select coalesce(json_agg(x order by x.n desc), '[]') from (
        select kind k, count(*) n from app_events where kind <> 'visita' and at >= since group by 1) x)
  );
end $$;
grant execute on function public.admin_stats(int) to authenticated;
