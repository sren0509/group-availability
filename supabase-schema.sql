-- Run this in your Supabase SQL Editor

create table responses (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  unavailable_dates text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS but allow all operations (no login required)
alter table responses enable row level security;

create policy "Allow all" on responses for all using (true) with check (true);
