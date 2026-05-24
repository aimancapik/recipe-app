create or replace function public.search_recipes_by_ingredients(
  p_ingredients text[],
  p_offset int default 0,
  p_page_size int default 20
)
returns table (
  id uuid,
  title text,
  description text,
  image text,
  prep_time text,
  rating numeric,
  reviews int,
  serves text,
  kcal text,
  level text,
  category text,
  user_id uuid,
  status text,
  images text[],
  matched_ingredients_count int,
  total_ingredients_count int,
  missing_ingredients text[]
)
language sql
stable
as $$
  with recipe_ingredients as (
    select
      r.id as recipe_id,
      array_agg(i.name order by i.sort_order) as ingredient_names
    from public.recipes r
    left join public.ingredients i on i.recipe_id = r.id
    where coalesce(r.status, 'published') = 'published'
    group by r.id
  ),
  scored as (
    select
      r.*,
      coalesce(ri.ingredient_names, '{}') as ingredient_names,
      (
        select count(*)
        from unnest(coalesce(ri.ingredient_names, '{}')) recipe_ing
        where exists (
          select 1
          from unnest(p_ingredients) user_ing
          where lower(recipe_ing) like '%' || lower(user_ing) || '%'
             or lower(user_ing) like '%' || lower(recipe_ing) || '%'
        )
      )::int as matched_count
    from public.recipes r
    left join recipe_ingredients ri on ri.recipe_id = r.id
    where coalesce(r.status, 'published') = 'published'
  )
  select
    s.id,
    s.title,
    s.description,
    s.image,
    s.prep_time,
    s.rating,
    s.reviews,
    s.serves,
    s.kcal,
    s.level,
    s.category,
    s.user_id,
    s.status,
    s.images,
    s.matched_count,
    cardinality(s.ingredient_names)::int,
    coalesce((
      select array_agg(recipe_ing)
      from unnest(s.ingredient_names) recipe_ing
      where not exists (
        select 1
        from unnest(p_ingredients) user_ing
        where lower(recipe_ing) like '%' || lower(user_ing) || '%'
           or lower(user_ing) like '%' || lower(recipe_ing) || '%'
      )
    ), '{}') as missing_ingredients
  from scored s
  where s.matched_count > 0
  order by s.matched_count desc, s.rating desc nulls last, s.created_at desc
  offset p_offset
  limit p_page_size;
$$;
