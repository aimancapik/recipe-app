-- ============================================================
-- Supabase RPC Functions (FIXED VERSION)
-- Using RETURNS TABLE for better PostgREST integration
-- ============================================================

-- Drop existing ones first to avoid conflicts
drop function if exists get_paginated_recipes(int, int, text, text);
drop function if exists get_paginated_recipes(int, int);

drop function if exists get_recipes_by_ids(uuid[]);
drop function if exists get_user_recipes(uuid);

-- 1. Fetch paginated recipes (LIGHTWEIGHT — no ingredients/directions)
-- Full recipe data should be fetched on-demand via get_recipes_by_ids
create or replace function get_paginated_recipes(
    p_offset int, 
    p_page_size int,
    p_search text default '',
    p_category text default ''
)
returns table (
    id uuid,
    title text,
    image text,
    prep_time text,
    rating numeric,
    reviews integer,
    serves text,
    kcal text,
    level text,
    category text,
    user_id uuid,
    status text,
    description text,
    images text[]
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.id,
    r.title,
    r.image,
    r.prep_time,
    r.rating,
    r.reviews,
    r.serves,
    r.kcal,
    r.level,
    r.category,
    r.user_id,
    r.status,
    r.description,
    r.images
  from recipes r
  where r.status = 'published'
  and (p_search = '' or (
      r.title ilike '%' || p_search || '%' or 
      r.description ilike '%' || p_search || '%' or
      r.category ilike '%' || p_search || '%'
  ))
  and (p_category = '' or r.category = p_category)
  order by r.created_at desc
  limit p_page_size
  offset p_offset;
end;
$$;

-- 2. Fetch full recipe data for specific IDs
create or replace function get_recipes_by_ids(p_ids uuid[])
returns table (
    id uuid,
    title text,
    image text,
    prep_time text,
    rating numeric,
    reviews integer,
    serves text,
    kcal text,
    level text,
    category text,
    user_id uuid,
    status text,
    description text,
    images text[],
    ingredients jsonb,
    directions jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.id,
    r.title,
    r.image,
    r.prep_time,
    r.rating,
    r.reviews,
    r.serves,
    r.kcal,
    r.level,
    r.category,
    r.user_id,
    r.status,
    r.description,
    r.images,
    coalesce((
        select jsonb_agg(jsonb_build_object('name', i.name, 'sort_order', i.sort_order))
        from ingredients i
        where i.recipe_id = r.id
    ), '[]'::jsonb),
    coalesce((
        select jsonb_agg(jsonb_build_object(
          'step', d.step, 
          'title', d.title, 
          'description', d.description, 
          'image', d.image, 
          'media_type', d.media_type, 
          'timer', d.timer, 
          'sort_order', d.sort_order
        ))
        from directions d
        where d.recipe_id = r.id
    ), '[]'::jsonb)
  from recipes r
  where r.id = any(p_ids)
  order by r.created_at desc;
end;
$$;

-- 3. Fetch all recipes for a specific user
create or replace function get_user_recipes(p_user_id uuid)
returns table (
    id uuid,
    title text,
    image text,
    prep_time text,
    rating numeric,
    reviews integer,
    serves text,
    kcal text,
    level text,
    category text,
    user_id uuid,
    status text,
    description text,
    images text[],
    ingredients jsonb,
    directions jsonb
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.id,
    r.title,
    r.image,
    r.prep_time,
    r.rating,
    r.reviews,
    r.serves,
    r.kcal,
    r.level,
    r.category,
    r.user_id,
    r.status,
    r.description,
    r.images,
    coalesce((
        select jsonb_agg(jsonb_build_object('name', i.name, 'sort_order', i.sort_order))
        from ingredients i
        where i.recipe_id = r.id
    ), '[]'::jsonb),
    coalesce((
        select jsonb_agg(jsonb_build_object(
          'step', d.step, 
          'title', d.title, 
          'description', d.description, 
          'image', d.image, 
          'media_type', d.media_type, 
          'timer', d.timer, 
          'sort_order', d.sort_order
        ))
        from directions d
        where d.recipe_id = r.id
    ), '[]'::jsonb)
  from recipes r
  where r.user_id = p_user_id
  order by r.created_at desc;
end;
$$;

-- Grant access to the API roles
grant execute on function get_paginated_recipes(int, int, text, text) to anon, authenticated;
grant execute on function get_recipes_by_ids(uuid[]) to anon, authenticated;
grant execute on function get_user_recipes(uuid) to anon, authenticated;
