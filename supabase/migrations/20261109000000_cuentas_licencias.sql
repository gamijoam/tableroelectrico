-- =====================================================================
-- Taller de Tableros · cuentas, prueba gratis, licencia de pago único,
-- proyectos en la nube, pagos por aprobar y sugerencias.
-- Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- ---------- Ajustes de la app (los edita el administrador) ----------
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  price_usd numeric(10,2) not null default 5,
  trial_hours int not null default 24,
  whatsapp text not null default '',
  pay_instructions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ---------- Perfiles: uno por usuario ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text not null default '',
  telefono text not null default '',
  trial_ends_at timestamptz not null default now() + interval '24 hours',
  pro boolean not null default false,
  pro_since timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ¿Es administrador quien hace la consulta?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ¿Tiene acceso completo? (licencia pagada o prueba vigente)
create or replace function public.has_access() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select pro or trial_ends_at > now() from public.profiles where id = auth.uid()), false)
$$;

-- Estado de la cuenta con la hora del servidor (el reloj del teléfono no cuenta)
create or replace function public.my_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'pro', p.pro, 'pro_since', p.pro_since, 'trial_ends_at', p.trial_ends_at,
    'is_admin', p.is_admin, 'nombre', p.nombre, 'telefono', p.telefono, 'email', p.email,
    'now', now(), 'access', p.pro or p.trial_ends_at > now())
  from public.profiles p where p.id = auth.uid()
$$;

-- Al registrarse: perfil con la prueba de las horas configuradas
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare h int;
begin
  select trial_hours into h from public.app_settings where id = 1;
  insert into public.profiles (id, email, nombre, telefono, trial_ends_at)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'nombre', ''),
          coalesce(new.raw_user_meta_data->>'telefono', ''),
          now() + make_interval(hours => coalesce(h, 24)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Proyectos y plantillas en la nube ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Tablero',
  client text not null default '',
  kind text not null default 'project' check (kind in ('project','template')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------- Pagos (el usuario reporta, el administrador aprueba) ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  method text not null,
  reference text not null,
  amount numeric(12,2),
  currency text not null default 'USD',
  note text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

-- Al aprobar un pago, la cuenta queda con licencia de por vida
create or replace function public.on_payment_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status then new.reviewed_at = now(); end if;
  if new.status = 'approved' and old.status <> 'approved' then
    update public.profiles set pro = true, pro_since = coalesce(pro_since, now()) where id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists payments_review on public.payments;
create trigger payments_review before update on public.payments
  for each row execute function public.on_payment_review();

-- ---------- Sugerencias y reportes de error ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'sugerencia' check (kind in ('sugerencia','error','otro')),
  message text not null check (length(message) between 3 and 5000),
  project jsonb,
  status text not null default 'nuevo' check (status in ('nuevo','visto','resuelto')),
  reply text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Seguridad por filas: cada quien ve lo suyo; el admin ve todo ----------
alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "ajustes: todos leen" on public.app_settings;
create policy "ajustes: todos leen" on public.app_settings for select using (true);
drop policy if exists "ajustes: admin edita" on public.app_settings;
create policy "ajustes: admin edita" on public.app_settings for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "perfil: el dueño o admin lee" on public.profiles;
create policy "perfil: el dueño o admin lee" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "perfil: el dueño edita sus datos" on public.profiles;
create policy "perfil: el dueño edita sus datos" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
-- el usuario solo puede cambiar su nombre y teléfono, nunca su licencia ni su prueba
revoke update on public.profiles from authenticated, anon;
grant update (nombre, telefono) on public.profiles to authenticated;

drop policy if exists "proyectos: el dueño lee" on public.projects;
create policy "proyectos: el dueño lee" on public.projects for select using (user_id = auth.uid());
drop policy if exists "proyectos: guardar con acceso" on public.projects;
create policy "proyectos: guardar con acceso" on public.projects for insert with check (user_id = auth.uid() and public.has_access());
drop policy if exists "proyectos: actualizar con acceso" on public.projects;
create policy "proyectos: actualizar con acceso" on public.projects for update using (user_id = auth.uid() and public.has_access()) with check (user_id = auth.uid());
drop policy if exists "proyectos: el dueño borra" on public.projects;
create policy "proyectos: el dueño borra" on public.projects for delete using (user_id = auth.uid());

drop policy if exists "pagos: el dueño o admin lee" on public.payments;
create policy "pagos: el dueño o admin lee" on public.payments for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "pagos: el dueño reporta" on public.payments;
create policy "pagos: el dueño reporta" on public.payments for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "pagos: admin revisa" on public.payments;
create policy "pagos: admin revisa" on public.payments for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mensajes: el dueño o admin lee" on public.feedback;
create policy "mensajes: el dueño o admin lee" on public.feedback for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "mensajes: el dueño escribe" on public.feedback;
create policy "mensajes: el dueño escribe" on public.feedback for insert with check (user_id = auth.uid() and status = 'nuevo' and reply = '');
drop policy if exists "mensajes: admin responde" on public.feedback;
create policy "mensajes: admin responde" on public.feedback for update using (public.is_admin()) with check (public.is_admin());

-- Lista de usuarios para el panel del administrador
create or replace function public.admin_users() returns table (
  id uuid, email text, nombre text, telefono text, pro boolean, trial_ends_at timestamptz, created_at timestamptz, proyectos bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.nombre, p.telefono, p.pro, p.trial_ends_at, p.created_at,
         (select count(*) from public.projects x where x.user_id = p.id)
  from public.profiles p where public.is_admin() order by p.created_at desc
$$;

grant execute on function public.is_admin(), public.has_access(), public.my_status(), public.admin_users() to authenticated;

-- Acciones del administrador: activar o quitar la licencia y extender la prueba
create or replace function public.admin_set_pro(uid uuid, value boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'solo el administrador'; end if;
  update public.profiles set pro = value, pro_since = case when value then coalesce(pro_since, now()) else null end where id = uid;
end $$;
create or replace function public.admin_extend_trial(uid uuid, hours int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'solo el administrador'; end if;
  update public.profiles set trial_ends_at = greatest(trial_ends_at, now()) + make_interval(hours => hours) where id = uid;
end $$;
grant execute on function public.admin_set_pro(uuid, boolean), public.admin_extend_trial(uuid, int) to authenticated;
