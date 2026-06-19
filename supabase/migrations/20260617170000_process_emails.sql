create extension if not exists pgcrypto;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  correo_solicitante text,
  nombre_solicitante text,
  fuente text not null default 'outlook_graph',
  estado text not null default 'nuevo',
  conversation_id text,
  graph_message_id text,
  internet_message_id text,
  storage_folder text,
  nombre_resolutor text,
  correo_resolutor text,
  id_resolutor_sharepoint text,
  created_at timestamptz not null default now()
);

alter table public.tickets
  add column if not exists nombre_resolutor text,
  add column if not exists correo_resolutor text,
  add column if not exists id_resolutor_sharepoint text;

create table if not exists public.mail_ticket_map (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  graph_message_id text not null,
  internet_message_id text,
  conversation_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_files (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  path text not null,
  url text not null,
  filename text not null,
  content_type text not null,
  is_inline boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists tickets_graph_message_id_uidx
  on public.tickets (graph_message_id)
  where graph_message_id is not null;

create unique index if not exists tickets_internet_message_id_uidx
  on public.tickets (internet_message_id)
  where internet_message_id is not null;

create unique index if not exists mail_ticket_map_graph_message_id_uidx
  on public.mail_ticket_map (graph_message_id);

create unique index if not exists mail_ticket_map_internet_message_id_uidx
  on public.mail_ticket_map (internet_message_id)
  where internet_message_id is not null;

create unique index if not exists ticket_files_ticket_id_path_uidx
  on public.ticket_files (ticket_id, path);

create index if not exists tickets_conversation_id_idx
  on public.tickets (conversation_id);

create index if not exists tickets_resolver_sharepoint_idx
  on public.tickets (id_resolutor_sharepoint);

create index if not exists mail_ticket_map_ticket_id_idx
  on public.mail_ticket_map (ticket_id);

create index if not exists ticket_files_ticket_id_idx
  on public.ticket_files (ticket_id);

insert into storage.buckets (id, name, public)
values ('ticket-files', 'ticket-files', true)
on conflict (id) do update
set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('ticket-inline-files', 'ticket-inline-files', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read ticket-files'
  ) then
    create policy "Public read ticket-files"
      on storage.objects
      for select
      to public
      using (bucket_id = 'ticket-files');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read ticket-inline-files'
  ) then
    create policy "Public read ticket-inline-files"
      on storage.objects
      for select
      to public
      using (bucket_id = 'ticket-inline-files');
  end if;
end $$;
