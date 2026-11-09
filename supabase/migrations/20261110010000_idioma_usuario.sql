-- Idioma de la app (es / en): va con la cuenta, como el país. Se puede ejecutar más de una vez.
alter table public.profiles add column if not exists idioma text not null default ''
  check (idioma in ('', 'es', 'en'));
grant update (idioma) on public.profiles to authenticated;
create or replace function public.my_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'pro', p.pro, 'pro_since', p.pro_since, 'trial_ends_at', p.trial_ends_at,
    'is_admin', p.is_admin, 'nombre', p.nombre, 'telefono', p.telefono, 'email', p.email, 'pais', p.pais, 'idioma', p.idioma,
    'now', now(), 'access', p.pro or p.trial_ends_at > now())
  from public.profiles p where p.id = auth.uid()
$$;
grant execute on function public.my_status() to authenticated;
