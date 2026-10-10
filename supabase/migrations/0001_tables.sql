-- Fig Mail: tables, indexes, RLS (no anon/authenticated access), and the private token-hash table.

create extension if not exists pgcrypto;

-- Private schema: never exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Holds the sha256 hash (hex) of the app's DB token. No plaintext token is ever stored.
create table if not exists private.app_config (
  k text primary key,
  v text not null
);
revoke all on private.app_config from public, anon, authenticated;

create table if not exists public.messages (
  id              text primary key,            -- provider message id
  thread_id       text,
  "from"          text,
  "to"            text,
  cc              text,
  subject         text,
  snippet         text,
  body_text       text,
  body_html       text,
  received_at     timestamptz,
  read            boolean not null default false,
  starred         boolean not null default false,
  archived        boolean not null default false,
  labels          text[]  not null default '{}'::text[],
  category        text,
  category_manual boolean not null default false,
  deleted_at      timestamptz,
  otp             text,
  attachments     jsonb   not null default '[]'::jsonb,
  fts tsvector generated always as (
    to_tsvector('simple'::regconfig,
      coalesce(subject,'') || ' ' || coalesce("from",'') || ' ' || coalesce("to",'') || ' ' || coalesce(body_text,''))
  ) stored
);
create index if not exists messages_received_at_idx on public.messages (received_at desc);
create index if not exists messages_thread_id_idx   on public.messages (thread_id);
create index if not exists messages_fts_idx         on public.messages using gin (fts);
create index if not exists messages_deleted_idx     on public.messages (deleted_at);
create index if not exists messages_category_idx    on public.messages (category);

create table if not exists public.outbox (
  id                 uuid primary key default gen_random_uuid(),
  "to"               text not null,
  cc                 text,
  subject            text,
  body               text,
  in_reply_to_thread text,
  status             text not null default 'pending' check (status in ('pending','sent','failed')),
  created_at         timestamptz not null default now(),
  sent_at            timestamptz,
  error              text
);

-- RLS on, no policies: anon/authenticated can read or write nothing directly.
alter table public.messages enable row level security;
alter table public.outbox   enable row level security;
revoke all on public.messages from anon, authenticated;
revoke all on public.outbox   from anon, authenticated;
