-- ============================================================
-- ADD AI USAGE COUNT
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add column to track usage
alter table profiles 
add column if not exists ai_usage_count int default 0;

-- Function to check and increment usage safely
-- Returns true if allowed (count < 10) and incremented
-- Returns false if limit reached
create or replace function increment_ai_usage(p_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  current_count int;
begin
  -- Get current count
  select ai_usage_count into current_count 
  from profiles 
  where id = p_id;
  
  -- Check limit
  if current_count >= 10 then
    return false;
  end if;
  
  -- Increment
  update profiles 
  set ai_usage_count = ai_usage_count + 1 
  where id = p_id;
  
  return true;
end;
$$;
