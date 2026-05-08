-- NutriTrack · Tighten shopping_lists RLS
-- Drop the `or user_id is null` clause so a stray NULL row cannot be read or
-- mutated by another user. Also require user_id to be NOT NULL going forward.

drop policy if exists "Users can view own shopping lists" on public.shopping_lists;
drop policy if exists "Users can insert shopping lists" on public.shopping_lists;
drop policy if exists "Users can update own shopping lists" on public.shopping_lists;

-- Best-effort cleanup of any legacy unowned rows. Adjust if you need to
-- preserve them under a specific user.
delete from public.shopping_lists where user_id is null;

alter table public.shopping_lists
  alter column user_id set not null;

create policy "Users can view own shopping lists"
  on public.shopping_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert own shopping lists"
  on public.shopping_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own shopping lists"
  on public.shopping_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete own shopping lists"
  on public.shopping_lists for delete
  using (auth.uid() = user_id);
