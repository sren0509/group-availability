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

-- Whiteboard notes
create table notes (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  author text not null default 'Anonymous',
  created_at timestamptz default now()
);

alter table notes enable row level security;

create policy "Allow all notes" on notes for all using (true) with check (true);
