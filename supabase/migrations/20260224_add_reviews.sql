-- Create reviews table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating integer check (rating between 1 and 5) not null,
  comment text,
  photos text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, recipe_id)
);

-- Create indexes for performance
create index if not exists idx_reviews_recipe on reviews(recipe_id);
create index if not exists idx_reviews_user on reviews(user_id);
create index if not exists idx_reviews_created_at on reviews(created_at desc);

-- Enable Row Level Security
alter table reviews enable row level security;

-- RLS Policies
create policy "Reviews are viewable by everyone"
  on reviews for select
  using (true);

create policy "Users can create reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on reviews for delete
  using (auth.uid() = user_id);

-- Function to update recipe rating and review count
create or replace function update_recipe_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  target_recipe_id uuid;
begin
  -- Determine which recipe to update
  if TG_OP = 'DELETE' then
    target_recipe_id := OLD.recipe_id;
  else
    target_recipe_id := NEW.recipe_id;
  end if;

  -- Update recipe rating and review count
  update recipes
  set
    rating = COALESCE((
      select round(avg(rating)::numeric, 1)
      from reviews
      where recipe_id = target_recipe_id
    ), 0),
    reviews = (
      select count(*)
      from reviews
      where recipe_id = target_recipe_id
    )
  where id = target_recipe_id;

  return COALESCE(NEW, OLD);
end;
$$;

-- Trigger to update recipe rating after review changes
drop trigger if exists after_review_change on reviews;
create trigger after_review_change
  after insert or update or delete on reviews
  for each row
  execute function update_recipe_rating();

-- Add helpful comment
comment on table reviews is 'User reviews and ratings for recipes';
comment on column reviews.rating is 'Rating from 1 to 5 stars';
comment on column reviews.comment is 'Optional text review';
comment on column reviews.photos is 'Array of photo URLs for the review';
