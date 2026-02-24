-- Create follows table for user-to-user following relationships
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(follower_id, following_id),
  check (follower_id != following_id) -- Prevent self-following
);

-- Create indexes for performance
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_follows_created_at on follows(created_at desc);

-- Enable Row Level Security
alter table follows enable row level security;

-- RLS Policies
create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);

-- Function to get follower count for a user
create or replace function get_follower_count(user_id uuid)
returns bigint
language plpgsql
security definer
as $$
begin
  return (
    select count(*)
    from follows
    where following_id = user_id
  );
end;
$$;

-- Function to get following count for a user
create or replace function get_following_count(user_id uuid)
returns bigint
language plpgsql
security definer
as $$
begin
  return (
    select count(*)
    from follows
    where follower_id = user_id
  );
end;
$$;

-- Function to check if user A follows user B
create or replace function is_following(follower uuid, following uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from follows
    where follower_id = follower
      and following_id = following
  );
end;
$$;

-- Function to get IDs of users that the current user follows
create or replace function get_following_ids(user_id uuid)
returns table(following_id uuid)
language plpgsql
security definer
as $$
begin
  return query
  select f.following_id
  from follows f
  where f.follower_id = user_id;
end;
$$;

-- Add helpful comments
comment on table follows is 'User following relationships';
comment on column follows.follower_id is 'User who is following';
comment on column follows.following_id is 'User being followed';
