-- =====================================================================
-- País del usuario: se elige al registrarse (o después en Mi cuenta)
-- y la app se configura con la norma de ese país en cualquier equipo.
-- Se puede ejecutar más de una vez.
-- =====================================================================
alter table public.profiles add column if not exists pais text not null default ''
  check (pais = '' or pais ~ '^[A-Z]{2}$');
grant update (pais) on public.profiles to authenticated;

-- al registrarse: nombre, teléfono y país vienen del formulario (o de Google)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare h int; p text;
begin
  select trial_hours into h from public.app_settings where id = 1;
  p := upper(coalesce(new.raw_user_meta_data->>'pais', ''));
  if p !~ '^[A-Z]{2}$' then p := ''; end if;
  insert into public.profiles (id, email, nombre, telefono, pais, trial_ends_at)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
          coalesce(new.raw_user_meta_data->>'telefono', ''), p,
          now() + make_interval(hours => coalesce(h, 24)))
  on conflict (id) do nothing;
  return new;
end $$;

-- el estado de la cuenta incluye el país
create or replace function public.my_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'pro', p.pro, 'pro_since', p.pro_since, 'trial_ends_at', p.trial_ends_at,
    'is_admin', p.is_admin, 'nombre', p.nombre, 'telefono', p.telefono, 'email', p.email, 'pais', p.pais,
    'now', now(), 'access', p.pro or p.trial_ends_at > now())
  from public.profiles p where p.id = auth.uid()
$$;

-- el panel de usuarios muestra el país
drop function if exists public.admin_users();
create function public.admin_users() returns table (
  id uuid, email text, nombre text, telefono text, pro boolean, trial_ends_at timestamptz, created_at timestamptz, proyectos bigint, last_seen_at timestamptz, pais text)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.nombre, p.telefono, p.pro, p.trial_ends_at, p.created_at,
         (select count(*) from public.projects x where x.user_id = p.id), p.last_seen_at, p.pais
  from public.profiles p where public.is_admin() order by coalesce(p.last_seen_at, p.created_at) desc
$$;
grant execute on function public.admin_users(), public.my_status() to authenticated;
