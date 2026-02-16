-- ==========================================
-- FIX AI LIMITS & AUTO-PROFILES
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Backfill missing profiles for existing users
-- This ensures that your current account has a profile so the limit works
insert into public.profiles (id, full_name, avatar_url)
select 
    id, 
    coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 2. Create a function to automatically create a profile on signup
-- This ensures the AI limit works for every future user immediately
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 3. Setup the trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
