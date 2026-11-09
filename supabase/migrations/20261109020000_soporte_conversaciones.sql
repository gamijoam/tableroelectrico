-- =====================================================================
-- Soporte: cada sugerencia o reporte es una conversación (ticket) con
-- mensajes del cliente y del administrador, y avisos de no leídos.
-- Se puede ejecutar más de una vez.
-- =====================================================================
alter table public.feedback add column if not exists updated_at timestamptz not null default now();
alter table public.feedback add column if not exists user_seen_at timestamptz not null default now();
alter table public.feedback add column if not exists admin_seen_at timestamptz;

-- estados: nuevo (espera al admin), respondido (espera al cliente), resuelto
alter table public.feedback drop constraint if exists feedback_status_check;
update public.feedback set status = 'respondido' where status = 'visto';
alter table public.feedback add constraint feedback_status_check check (status in ('nuevo','respondido','resuelto'));

create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.feedback(id) on delete cascade,
  author uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_admin boolean not null default false,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists feedback_messages_ticket_idx on public.feedback_messages (ticket_id, created_at);

-- las respuestas que ya existían pasan a ser mensajes del administrador
insert into public.feedback_messages (ticket_id, author, from_admin, body, created_at)
select f.id, f.user_id, true, f.reply, f.created_at + interval '1 second'
from public.feedback f
where f.reply <> '' and not exists (select 1 from public.feedback_messages m where m.ticket_id = f.id);

-- cada mensaje nuevo actualiza la conversación: estado y fecha
create or replace function public.on_feedback_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.feedback set
    updated_at = now(),
    status = case when new.from_admin then 'respondido' else 'nuevo' end,
    admin_seen_at = case when new.from_admin then now() else admin_seen_at end,
    user_seen_at = case when new.from_admin then user_seen_at else now() end
  where id = new.ticket_id;
  return new;
end $$;
drop trigger if exists feedback_message_ins on public.feedback_messages;
create trigger feedback_message_ins after insert on public.feedback_messages
  for each row execute function public.on_feedback_message();

alter table public.feedback_messages enable row level security;
drop policy if exists "conversación: el dueño o admin lee" on public.feedback_messages;
create policy "conversación: el dueño o admin lee" on public.feedback_messages for select
  using (public.is_admin() or exists (select 1 from public.feedback f where f.id = ticket_id and f.user_id = auth.uid()));
drop policy if exists "conversación: el cliente escribe" on public.feedback_messages;
create policy "conversación: el cliente escribe" on public.feedback_messages for insert
  with check (author = auth.uid() and not from_admin and exists (select 1 from public.feedback f where f.id = ticket_id and f.user_id = auth.uid()));
drop policy if exists "conversación: el admin responde" on public.feedback_messages;
create policy "conversación: el admin responde" on public.feedback_messages for insert
  with check (author = auth.uid() and from_admin and public.is_admin());

-- marcar como leída (cliente o admin) y cerrar o reabrir
create or replace function public.ticket_seen(tid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then update public.feedback set admin_seen_at = now() where id = tid;
  else update public.feedback set user_seen_at = now() where id = tid and user_id = auth.uid(); end if;
end $$;
create or replace function public.ticket_set_status(tid uuid, st text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if st not in ('nuevo','respondido','resuelto') then raise exception 'estado inválido'; end if;
  if public.is_admin() then update public.feedback set status = st, updated_at = now() where id = tid;
  elsif st = 'resuelto' then update public.feedback set status = st, updated_at = now() where id = tid and user_id = auth.uid();
  else raise exception 'no permitido'; end if;
end $$;

-- avisos: respuestas sin leer para el cliente; conversaciones pendientes para el admin
create or replace function public.support_unread() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'mine', (select count(*) from public.feedback f where f.user_id = auth.uid()
               and exists (select 1 from public.feedback_messages m where m.ticket_id = f.id and m.from_admin and m.created_at > f.user_seen_at)),
    'admin', case when public.is_admin() then (select count(*) from public.feedback f where f.status = 'nuevo'
               and (f.admin_seen_at is null or exists (select 1 from public.feedback_messages m where m.ticket_id = f.id and not m.from_admin and m.created_at > f.admin_seen_at))) else 0 end,
    'pending', case when public.is_admin() then (select count(*) from public.feedback where status = 'nuevo') else 0 end)
$$;
grant execute on function public.ticket_seen(uuid), public.ticket_set_status(uuid, text), public.support_unread() to authenticated;
