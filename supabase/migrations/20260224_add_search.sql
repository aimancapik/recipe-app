-- Add full-text search column to recipes table
alter table recipes
add column if not exists search_vector tsvector;

-- Create function to update search vector
create or replace function recipes_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'C');
  return new;
end;
$$;

-- Create trigger to keep search vector updated
drop trigger if exists recipes_search_vector_trigger on recipes;
create trigger recipes_search_vector_trigger
  before insert or update on recipes
  for each row
  execute function recipes_search_vector_update();

-- Update existing recipes to populate search_vector
update recipes set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'C')
where search_vector is null;

-- Create GIN index for fast full-text search
create index if not exists idx_recipes_search on recipes using gin(search_vector);

-- Create search function
create or replace function search_recipes(
  search_query text,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  title text,
  description text,
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
  images text[],
  rank real
)
language plpgsql
security definer
as $$
begin
  return query
  select
    r.id,
    r.title,
    r.description,
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
    r.images,
    ts_rank(r.search_vector, websearch_to_tsquery('english', search_query)) as rank
  from recipes r
  where r.search_vector @@ websearch_to_tsquery('english', search_query)
    and r.status = 'published'
  order by rank desc, r.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- Create function to search with filters
create or replace function search_recipes_filtered(
  search_query text default '',
  category_filter text default null,
  difficulty_filter text default null,
  max_prep_time int default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  title text,
  description text,
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
  images text[],
  rank real
)
language plpgsql
security definer
as $$
begin
  return query
  select
    r.id,
    r.title,
    r.description,
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
    r.images,
    case
      when search_query = '' then 0::real
      else ts_rank(r.search_vector, websearch_to_tsquery('english', search_query))
    end as rank
  from recipes r
  where r.status = 'published'
    and (search_query = '' or r.search_vector @@ websearch_to_tsquery('english', search_query))
    and (category_filter is null or r.category = category_filter)
    and (difficulty_filter is null or r.level = difficulty_filter)
  order by
    case when search_query = '' then 0 else rank end desc,
    r.rating desc,
    r.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

-- Add helpful comments
comment on column recipes.search_vector is 'Full-text search vector for title, description, and category';
comment on function search_recipes is 'Search recipes using full-text search with ranking';
comment on function search_recipes_filtered is 'Search recipes with category and difficulty filters';
