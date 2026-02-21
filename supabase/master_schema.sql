-- ============================================================
-- Let-Em-Cook MASTER DATABASE SCHEMA
-- This file combines all tables, indexes, RLS, and functions.
-- Last Updated: 2026-02-22
-- ============================================================

-- 0. GLOBAL UTILITIES
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. PROFILES TABLE
-- Extends Supabase Auth users with custom data
create table if not exists profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text unique,
    avatar_url text,
    bio text,
    location text,
    socials jsonb,
    ai_usage_count integer default 0,
    last_ai_usage_at timestamptz,
    updated_at timestamptz default now()
);

-- 2. RECIPES TABLE
-- Stores all recipe metadata
create table if not exists recipes (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    image text not null,
    prep_time text not null default '30m',
    rating numeric(2,1) not null default 0,
    reviews integer not null default 0,
    serves text not null default '01',
    kcal text not null default '0',
    level text not null default 'Easy' check (level in ('Easy', 'Medium', 'Hard')),
    category text not null default 'popular',
    user_id uuid references auth.users(id) on delete set null,
    status text not null default 'published' check (status in ('published', 'draft')),
    description text,
    images text[] default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. INGREDIENTS TABLE
create table if not exists ingredients (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes(id) on delete cascade not null,
    name text not null,
    sort_order integer not null default 0
);

-- 4. DIRECTIONS TABLE
create table if not exists directions (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes(id) on delete cascade not null,
    step integer not null,
    title text not null,
    description text not null,
    image text,
    media_type text default 'image' check (media_type in ('image', 'video')),
    timer integer,
    sort_order integer not null default 0
);

-- 5. FAVORITES TABLE (Many-to-Many)
create table if not exists favorites (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    recipe_id uuid references recipes(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(user_id, recipe_id)
);

-- 6. FOLLOWS TABLE (Social)
create table if not exists follows (
    follower_id uuid references auth.users(id) on delete cascade,
    following_id uuid references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    primary key (follower_id, following_id)
);

-- 7. GROCERY ITEMS TABLE
create table if not exists grocery_items (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    checked boolean default false,
    recipe_title text not null,
    recipe_image text not null,
    created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_recipes_user on recipes(user_id);
create index if not exists idx_recipes_status on recipes(status);
create index if not exists idx_ingredients_recipe on ingredients(recipe_id);
create index if not exists idx_directions_recipe on directions(recipe_id);
create index if not exists idx_favorites_user on favorites(user_id);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_grocery_user on grocery_items(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table profiles enable row level security;
alter table recipes enable row level security;
alter table ingredients enable row level security;
alter table directions enable row level security;
alter table favorites enable row level security;
alter table follows enable row level security;
alter table grocery_items enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Recipes Policies
create policy "Recipes viewable by everyone" on recipes for select 
    using (status = 'published' or auth.uid() = user_id);
create policy "Users can create recipes" on recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on recipes for delete using (auth.uid() = user_id);

-- Ingredients/Directions Policies
create policy "Viewable by everyone" on ingredients for select using (true);
create policy "Manage via recipe" on ingredients for all using (
    exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
);
create policy "Directions viewable by everyone" on directions for select using (true);
create policy "Directions manage via recipe" on directions for all using (
    exists (select 1 from recipes where id = recipe_id and user_id = auth.uid())
);

-- Favorites Policies
create policy "Users can view own favorites" on favorites for select using (auth.uid() = user_id);
create policy "Users can add favorites" on favorites for insert with check (auth.uid() = user_id);
create policy "Users can remove favorites" on favorites for delete using (auth.uid() = user_id);

-- Follows Policies
create policy "Anyone can see follow relationships" on follows for select using (true);
create policy "Users can follow/unfollow" on follows for all using (auth.uid() = follower_id);

-- Grocery Policies
create policy "Users managed own grocery" on grocery_items for all using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- 1. Auto-update updated_at for recipes/profiles
create trigger recipes_updated_at before update on recipes for each row execute function update_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();

-- 2. Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- 3. Follow Toggle Logic
create or replace function toggle_follow(target_user_id uuid)
returns boolean language plpgsql security definer as $$
declare
    is_following boolean;
begin
    select exists (select 1 from follows where follower_id = auth.uid() and following_id = target_user_id) into is_following;
    if is_following then
        delete from follows where follower_id = auth.uid() and following_id = target_user_id; return false;
    else
        insert into follows (follower_id, following_id) values (auth.uid(), target_user_id); return true;
    end if;
end;
$$;

-- 4. AI Usage Limiter
create or replace function increment_ai_usage(p_id uuid, p_current_date text)
returns jsonb language plpgsql security definer as $$
declare
  current_count int; last_usage timestamptz; v_date date;
begin
  v_date := p_current_date::date;
  select ai_usage_count, last_ai_usage_at into current_count, last_usage from profiles where id = p_id;
  if (last_usage::date < v_date) then current_count := 0; end if;
  if current_count >= 10 then return jsonb_build_object('allowed', false, 'count', current_count); end if;
  update profiles set ai_usage_count = current_count + 1, last_ai_usage_at = now() where id = p_id;
  return jsonb_build_object('allowed', true, 'count', current_count + 1);
end;
$$;

-- 5. Paginated Recipes with embedded data
create or replace function get_paginated_recipes(p_offset int, p_page_size int)
returns table (id uuid, title text, image text, prep_time text, rating numeric, reviews integer, serves text, kcal text, level text, category text, user_id uuid, status text, images text[], ingredients jsonb, directions jsonb)
language plpgsql security definer as $$
begin
  return query
  select r.id, r.title, r.image, r.prep_time, r.rating, r.reviews, r.serves, r.kcal, r.level, r.category, r.user_id, r.status, r.images,
    coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'sort_order', i.sort_order)) from ingredients i where i.recipe_id = r.id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('step', d.step, 'title', d.title, 'description', d.description, 'image', d.image, 'media_type', d.media_type, 'timer', d.timer, 'sort_order', d.sort_order)) from directions d where d.recipe_id = r.id), '[]'::jsonb)
  from recipes r where r.status = 'published' order by r.created_at desc limit p_page_size offset p_offset;
end;
$$;

-- Grant permissions
grant execute on function toggle_follow(uuid) to authenticated;
grant execute on function increment_ai_usage(uuid, text) to authenticated;
grant execute on function get_paginated_recipes(int, int) to anon, authenticated;
