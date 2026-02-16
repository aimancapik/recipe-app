-- ============================================================
-- ADD AI USAGE COUNT
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add column to track usage and last usage timestamp
alter table profiles 
add column if not exists ai_usage_count int default 0,
add column if not exists last_ai_usage_at timestamp with time zone default now();

-- Function to check and increment usage safely with DAILY reset
-- Returns true if allowed (count < 10) and incremented
-- Returns false if limit reached
create or replace function increment_ai_usage(p_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  current_count int;
  last_usage timestamp with time zone;
begin
  -- Get current count and last usage time
  select ai_usage_count, last_ai_usage_at into current_count, last_usage
  from profiles 
  where id = p_id;
  
  -- If it's a new day, reset the count
  if (last_usage::date < now()::date) then
    current_count := 0;
  end if;

  -- Check limit
  if current_count >= 10 then
    return false;
  end if;
  
  -- Increment and update timestamp
  update profiles 
  set 
    ai_usage_count = current_count + 1,
    last_ai_usage_at = now()
  where id = p_id;
  
  return true;
end;
$$;
