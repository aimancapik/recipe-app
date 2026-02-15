-- ============================================================
-- ADD PROFILES TABLE
-- Run this in your Supabase SQL Editor if you already have the initial schema
-- ============================================================

create table if not exists profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text unique,
    avatar_url text,
    bio text,
    socials jsonb,
    updated_at timestamptz default now()
);

-- Index for unique name lookups
create index if not exists idx_profiles_name on profiles(full_name);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Profiles are viewable by everyone"
    on profiles for select using (true);

create policy "Users can insert their own profile"
    on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
    on profiles for update using (auth.uid() = id);

-- Trigger for updated_at (reuses existing update_updated_at function)
create trigger profiles_updated_at
    before update on profiles
    for each row execute function update_updated_at();
