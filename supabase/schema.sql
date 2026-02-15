-- ============================================================
-- Let-Em-Cook Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. RECIPES TABLE
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
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. INGREDIENTS TABLE
-- Each recipe has multiple ingredients
create table if not exists ingredients (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes(id) on delete cascade not null,
    name text not null,
    sort_order integer not null default 0
);

-- 3. DIRECTIONS TABLE
-- Step-by-step cooking instructions
create table if not exists directions (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes(id) on delete cascade not null,
    step integer not null,
    title text not null,
    description text not null,
    image text,
    media_type text default 'image' check (media_type in ('image', 'video')),
    timer integer, -- duration in seconds
    sort_order integer not null default 0
);

-- 4. FAVORITES TABLE
-- Links users to their favorite recipes (many-to-many)
create table if not exists favorites (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    recipe_id uuid references recipes(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(user_id, recipe_id)
);

-- 5. GROCERY ITEMS TABLE
-- Shopping list items per user
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
-- INDEXES for performance
-- ============================================================
create index if not exists idx_recipes_category on recipes(category);
create index if not exists idx_recipes_user on recipes(user_id);
create index if not exists idx_ingredients_recipe on ingredients(recipe_id);
create index if not exists idx_directions_recipe on directions(recipe_id);
create index if not exists idx_favorites_user on favorites(user_id);
create index if not exists idx_favorites_recipe on favorites(recipe_id);
create index if not exists idx_grocery_user on grocery_items(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table recipes enable row level security;
alter table ingredients enable row level security;
alter table directions enable row level security;
alter table favorites enable row level security;
alter table grocery_items enable row level security;

-- RECIPES: Anyone can read, only the creator can insert/update/delete
create policy "Recipes are viewable by everyone"
    on recipes for select using (true);

create policy "Users can create recipes"
    on recipes for insert with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
    on recipes for update using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
    on recipes for delete using (auth.uid() = user_id);

-- INGREDIENTS: Anyone can read (via recipe), creator can modify
create policy "Ingredients are viewable by everyone"
    on ingredients for select using (true);

create policy "Users can manage ingredients for their recipes"
    on ingredients for insert with check (
        exists (select 1 from recipes where recipes.id = recipe_id and recipes.user_id = auth.uid())
    );

create policy "Users can update ingredients for their recipes"
    on ingredients for update using (
        exists (select 1 from recipes where recipes.id = recipe_id and recipes.user_id = auth.uid())
    );

create policy "Users can delete ingredients for their recipes"
    on ingredients for delete using (
        exists (select 1 from recipes where recipes.id = recipe_id and recipes.user_id = auth.uid())
    );

-- DIRECTIONS: Same as ingredients
create policy "Directions are viewable by everyone"
    on directions for select using (true);

create policy "Users can manage directions for their recipes"
    on directions for insert with check (
        exists (select 1 from recipes where recipes.id = recipe_id and recipes.user_id = auth.uid())
    );

create policy "Users can update directions for their recipes"
    on directions for update using (
        exists (select 1 from recipes where recipes.id = recipe_id and recipes.user_id = auth.uid())
    );

create policy "Users can delete directions for their recipes"
    on directions for delete using (
        exists (select 1 from recipes where recipes.id = recipe_id and recipes.user_id = auth.uid())
    );

-- FAVORITES: Users can only see/manage their own
create policy "Users can view their own favorites"
    on favorites for select using (auth.uid() = user_id);

create policy "Users can add favorites"
    on favorites for insert with check (auth.uid() = user_id);

create policy "Users can remove favorites"
    on favorites for delete using (auth.uid() = user_id);

-- GROCERY ITEMS: Users can only see/manage their own
create policy "Users can view their own grocery items"
    on grocery_items for select using (auth.uid() = user_id);

create policy "Users can add grocery items"
    on grocery_items for insert with check (auth.uid() = user_id);

create policy "Users can update their own grocery items"
    on grocery_items for update using (auth.uid() = user_id);

create policy "Users can delete their own grocery items"
    on grocery_items for delete using (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
    before update on recipes
    for each row execute function update_updated_at();
