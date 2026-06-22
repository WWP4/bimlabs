create extension if not exists pgcrypto;

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'requested',

  project_type text not null,
  budget_range text not null,

  start_at_utc timestamptz not null,
  end_at_utc timestamptz not null,
  client_timezone text not null,
  studio_timezone text not null default 'America/Chicago',
  client_display_time text not null,
  studio_display_time text not null,

  name text not null,
  email text not null,
  phone text,
  business_name text,
  project_context text not null,
  source text not null default 'bim-labs-booking-page'
);

alter table public.booking_requests enable row level security;

-- Keep booking requests private. The frontend writes through the Edge Function,
-- which uses the Supabase service role key server-side and bypasses RLS.
drop policy if exists "No public booking request reads" on public.booking_requests;

create unique index if not exists booking_requests_active_start_at_utc_idx
  on public.booking_requests (start_at_utc)
  where status <> 'cancelled';
