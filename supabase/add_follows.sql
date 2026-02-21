-- ============================================================
-- SOCIAL FEATURES: FOLLOWS TABLE & RPC
-- ============================================================

-- 1. Create Follows Table
create table if not exists follows (
    follower_id uuid references auth.users(id) on delete cascade,
    following_id uuid references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    primary key (follower_id, following_id)
);

-- Index for faster count lookups
create index if not exists idx_follows_following_id on follows(following_id);
create index if not exists idx_follows_follower_id on follows(follower_id);

-- 2. Enable RLS
alter table follows enable row level security;

-- 3. RLS Policies
create policy "Follows are viewable by everyone"
    on follows for select using (true);

create policy "Users can follow others"
    on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
    on follows for delete using (auth.uid() = follower_id);

-- 4. Toggle Follow RPC
-- This handles atomic follow/unfollow to avoid race conditions or UI desync
create or replace function toggle_follow(target_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
    is_following boolean;
begin
    -- Check if already following
    select exists (
        select 1 from follows 
        where follower_id = auth.uid() 
        and following_id = target_user_id
    ) into is_following;

    if is_following then
        -- Unfollow
        delete from follows 
        where follower_id = auth.uid() 
        and following_id = target_user_id;
        return false;
    else
        -- Follow
        insert into follows (follower_id, following_id)
        values (auth.uid(), target_user_id);
        return true;
    end if;
end;
$$;

-- Grant access
grant execute on function toggle_follow(uuid) to authenticated;
