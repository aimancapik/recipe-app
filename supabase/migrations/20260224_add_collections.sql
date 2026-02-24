-- Create collections table
create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) > 0 and char_length(name) <= 100),
  description text,
  cover_image text,
  is_public boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create collection_recipes junction table
create table if not exists collection_recipes (
  collection_id uuid references collections(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  added_at timestamptz default now() not null,
  primary key (collection_id, recipe_id)
);

-- Create indexes for performance
create index if not exists idx_collections_user on collections(user_id);
create index if not exists idx_collections_created_at on collections(created_at desc);
create index if not exists idx_collection_recipes_collection on collection_recipes(collection_id);
create index if not exists idx_collection_recipes_recipe on collection_recipes(recipe_id);

-- Enable Row Level Security
alter table collections enable row level security;
alter table collection_recipes enable row level security;

-- RLS Policies for collections
create policy "Public collections viewable by everyone"
  on collections for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can create own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own collections"
  on collections for update
  using (auth.uid() = user_id);

create policy "Users can delete own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- RLS Policies for collection_recipes
create policy "Collection recipes viewable if collection viewable"
  on collection_recipes for select
  using (
    exists (
      select 1 from collections
      where id = collection_id
      and (is_public = true or user_id = auth.uid())
    )
  );

create policy "Users can add recipes to own collections"
  on collection_recipes for insert
  with check (
    exists (
      select 1 from collections
      where id = collection_id
      and user_id = auth.uid()
    )
  );

create policy "Users can remove recipes from own collections"
  on collection_recipes for delete
  using (
    exists (
      select 1 from collections
      where id = collection_id
      and user_id = auth.uid()
    )
  );

-- Add helpful comments
comment on table collections is 'User-created recipe collections/playlists';
comment on column collections.is_public is 'Whether the collection is publicly viewable';
comment on table collection_recipes is 'Junction table for recipes in collections';
