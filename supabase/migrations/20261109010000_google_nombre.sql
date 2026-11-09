-- Registro con Google: el nombre viene en full_name o name
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare h int;
begin
  select trial_hours into h from public.app_settings where id = 1;
  insert into public.profiles (id, email, nombre, telefono, trial_ends_at)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
          coalesce(new.raw_user_meta_data->>'telefono', ''),
          now() + make_interval(hours => coalesce(h, 24)))
  on conflict (id) do nothing;
  return new;
end $$;
