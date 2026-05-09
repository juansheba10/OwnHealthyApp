-- NutriTrack · Per-user recipe favorites
-- Recipes are a shared catalog, but favoriting is per-user. A separate join
-- table keeps it simple and lets RLS isolate each user's set.

create table public.recipe_favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index idx_recipe_favorites_recipe on public.recipe_favorites(recipe_id);

alter table public.recipe_favorites enable row level security;

create policy "Users can view own favorites"
  on public.recipe_favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.recipe_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.recipe_favorites for delete
  using (auth.uid() = user_id);
