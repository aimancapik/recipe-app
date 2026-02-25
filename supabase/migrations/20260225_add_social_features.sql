-- Create notifications table
create table if not exists notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    type text not null, -- 'like', 'comment', 'follow'
    message text not null,
    source_user_id uuid,
    recipe_id uuid references recipes(id) on delete cascade,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists notifications_user_id_idx on notifications(user_id);

-- Create collections table (Cookbooks)
create table if not exists collections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists collections_user_id_idx on collections(user_id);

-- Create collection_recipes junction table
create table if not exists collection_recipes (
    collection_id uuid references collections(id) on delete cascade,
    recipe_id uuid references recipes(id) on delete cascade,
    added_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (collection_id, recipe_id)
);

-- Create comments table
create table if not exists comments (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid not null references recipes(id) on delete cascade,
    user_id uuid not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists comments_recipe_id_idx on comments(recipe_id);

-- Create meal_plans table
create table if not exists meal_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null,
    date date not null,
    meal_type text not null, -- 'breakfast', 'lunch', 'dinner', 'snack'
    recipe_id uuid references recipes(id) on delete cascade,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists meal_plans_user_date_idx on meal_plans(user_id, date);

-- Enable RLS (Row Level Security)
alter table notifications enable row level security;
alter table collections enable row level security;
alter table collection_recipes enable row level security;
alter table comments enable row level security;
alter table meal_plans enable row level security;

-- RLS Policies

-- Notifications
drop policy if exists "Users can view their own notifications" on notifications;
create policy "Users can view their own notifications" on notifications 
    for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on notifications;
create policy "Users can update their own notifications" on notifications 
    for update using (auth.uid() = user_id);

drop policy if exists "System can insert notifications" on notifications;
create policy "System can insert notifications" on notifications 
    for insert with check (true); -- In a real app, this might be restricted to authenticated users or triggers

-- Collections
drop policy if exists "Users can view their own collections" on collections;
create policy "Users can view their own collections" on collections 
    for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own collections" on collections;
create policy "Users can insert their own collections" on collections 
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own collections" on collections;
create policy "Users can update their own collections" on collections 
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own collections" on collections;
create policy "Users can delete their own collections" on collections 
    for delete using (auth.uid() = user_id);

-- Collection Recipes
drop policy if exists "Users can view recipes in their collections" on collection_recipes;
create policy "Users can view recipes in their collections" on collection_recipes 
    for select using (
        exists (select 1 from collections where id = collection_id and user_id = auth.uid())
    );

drop policy if exists "Users can add recipes to their collections" on collection_recipes;
create policy "Users can add recipes to their collections" on collection_recipes 
    for insert with check (
        exists (select 1 from collections where id = collection_id and user_id = auth.uid())
    );

drop policy if exists "Users can remove recipes from their collections" on collection_recipes;
create policy "Users can remove recipes from their collections" on collection_recipes 
    for delete using (
        exists (select 1 from collections where id = collection_id and user_id = auth.uid())
    );

-- Comments
drop policy if exists "Anyone can view comments" on comments;
create policy "Anyone can view comments" on comments 
    for select using (true);

drop policy if exists "Authenticated users can insert comments" on comments;
create policy "Authenticated users can insert comments" on comments 
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own comments" on comments;
create policy "Users can update their own comments" on comments 
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on comments;
create policy "Users can delete their own comments" on comments 
    for delete using (auth.uid() = user_id);

-- Meal Plans
drop policy if exists "Users can view their own meal plans" on meal_plans;
create policy "Users can view their own meal plans" on meal_plans 
    for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meal plans" on meal_plans;
create policy "Users can insert their own meal plans" on meal_plans 
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own meal plans" on meal_plans;
create policy "Users can update their own meal plans" on meal_plans 
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own meal plans" on meal_plans;
create policy "Users can delete their own meal plans" on meal_plans 
    for delete using (auth.uid() = user_id);
