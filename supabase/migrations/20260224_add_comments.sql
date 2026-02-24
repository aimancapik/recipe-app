-- Create comments table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_id uuid references comments(id) on delete cascade,
  text text not null check (char_length(text) > 0 and char_length(text) <= 2000),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create indexes for performance
create index if not exists idx_comments_recipe on comments(recipe_id);
create index if not exists idx_comments_user on comments(user_id);
create index if not exists idx_comments_parent on comments(parent_id);
create index if not exists idx_comments_created_at on comments(created_at desc);

-- Enable Row Level Security
alter table comments enable row level security;

-- RLS Policies
create policy "Comments are viewable by everyone"
  on comments for select
  using (true);

create policy "Authenticated users can create comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on comments for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- Add helpful comments
comment on table comments is 'User comments and discussions on recipes';
comment on column comments.text is 'Comment text, max 2000 characters';
comment on column comments.parent_id is 'Parent comment ID for threaded replies';
