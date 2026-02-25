-- Update RPCs to accept an array of ingredients

drop function if exists get_paginated_recipes(int, int, text, text);
drop function if exists get_paginated_recipes(int, int, text, text, text[]);

create or replace function get_paginated_recipes(
    p_offset int, 
    p_page_size int,
    p_search text default '',
    p_category text default '',
    p_ingredients text[] default '{}'
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
    images text[],
    matched_ingredients_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with filtered_recipes as (
      select r.*
      from recipes r
      where r.status = 'published'
      and (p_search = '' or (
          r.title ilike '%' || p_search || '%' or 
          r.description ilike '%' || p_search || '%' or
          r.category ilike '%' || p_search || '%'
      ))
      and (p_category = '' or r.category = p_category)
  )
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
    (
      select count(*) 
      from ingredients i 
      where i.recipe_id = r.id 
      and exists (
        select 1 
        from unnest(p_ingredients) as pi 
        where i.name ilike '%' || pi || '%'
      )
    ) as matched_ingredients_count
  from filtered_recipes r
  where array_length(p_ingredients, 1) is null 
     or (
       select count(*) 
       from ingredients i 
       where i.recipe_id = r.id 
       and exists (
         select 1 
         from unnest(p_ingredients) as pi 
         where i.name ilike '%' || pi || '%'
       )
     ) > 0
  order by 
    case when array_length(p_ingredients, 1) > 0 then 
      (
        select count(*) 
        from ingredients i 
        where i.recipe_id = r.id 
        and exists (
          select 1 
          from unnest(p_ingredients) as pi 
          where i.name ilike '%' || pi || '%'
        )
      )
    else 0 end desc,
    r.created_at desc
  limit p_page_size
  offset p_offset;
end;
$$;

drop function if exists get_following_recipes(uuid, int, int, text, text);
drop function if exists get_following_recipes(uuid, int, int, text, text, text[]);

create or replace function get_following_recipes(
    p_follower_id uuid,
    p_offset int, 
    p_page_size int,
    p_search text default '',
    p_category text default '',
    p_ingredients text[] default '{}'
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
    images text[],
    matched_ingredients_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with filtered_recipes as (
      select r.*
      from recipes r
      join follows f on r.user_id = f.following_id
      where f.follower_id = p_follower_id
      and r.status = 'published'
      and (p_search = '' or (
          r.title ilike '%' || p_search || '%' or 
          r.description ilike '%' || p_search || '%' or
          r.category ilike '%' || p_search || '%'
      ))
      and (p_category = '' or r.category = p_category)
  )
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
    (
      select count(*) 
      from ingredients i 
      where i.recipe_id = r.id 
      and exists (
        select 1 
        from unnest(p_ingredients) as pi 
        where i.name ilike '%' || pi || '%'
      )
    ) as matched_ingredients_count
  from filtered_recipes r
  where array_length(p_ingredients, 1) is null 
     or (
       select count(*) 
       from ingredients i 
       where i.recipe_id = r.id 
       and exists (
         select 1 
         from unnest(p_ingredients) as pi 
         where i.name ilike '%' || pi || '%'
       )
     ) > 0
  order by 
    case when array_length(p_ingredients, 1) > 0 then 
      (
        select count(*) 
        from ingredients i 
        where i.recipe_id = r.id 
        and exists (
          select 1 
          from unnest(p_ingredients) as pi 
          where i.name ilike '%' || pi || '%'
        )
      )
    else 0 end desc,
    r.created_at desc
  limit p_page_size
  offset p_offset;
end;
$$;

grant execute on function get_paginated_recipes(int, int, text, text, text[]) to anon, authenticated;
grant execute on function get_following_recipes(uuid, int, int, text, text, text[]) to anon, authenticated;
