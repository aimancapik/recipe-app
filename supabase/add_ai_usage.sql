-- ============================================================
-- ADD AI USAGE COUNT (CLEAN FIX)
-- ============================================================

-- 1. Drop the old version first to avoid signature conflicts
drop function if exists increment_ai_usage(uuid, date);
drop function if exists increment_ai_usage(uuid);

-- 2. Create the new version
create or replace function increment_ai_usage(p_id uuid, p_current_date text)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_count int;
  last_usage timestamp with time zone;
  v_date date;
begin
  -- Convert input text to date
  v_date := p_current_date::date;

  -- Get current count and last usage time
  select ai_usage_count, last_ai_usage_at into current_count, last_usage
  from profiles 
  where id = p_id;
  
  -- If last usage was on a date strictly before the provided user date, reset
  if (last_usage::date < v_date) then
    current_count := 0;
  end if;

  -- Check limit
  if current_count >= 10 then
    return jsonb_build_object('allowed', false, 'count', current_count);
  end if;
  
  -- Increment and update timestamp
  update profiles 
  set 
    ai_usage_count = current_count + 1,
    last_ai_usage_at = now()
  where id = p_id;
  
  return jsonb_build_object('allowed', true, 'count', current_count + 1);
end;
$$;

-- 3. Explicitly grant permissions just in case
grant execute on function increment_ai_usage(uuid, text) to anon, authenticated, service_role;
