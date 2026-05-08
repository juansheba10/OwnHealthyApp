-- NutriTrack · Recipe ownership
-- Recipes remain a shared catalog (any authenticated user can SELECT), but
-- mutations are now restricted to the creator. Pre-existing seed rows have
-- created_by IS NULL and remain editable by any authenticated user for
-- backwards compatibility.

alter table public.recipes
  add column created_by uuid references auth.users(id) on delete set null;

create index idx_recipes_created_by on public.recipes(created_by);

-- Replace the permissive INSERT/UPDATE policies with creator-gated ones, and
-- add the missing DELETE policy.

drop policy if exists "Authenticated users can insert recipes" on public.recipes;
drop policy if exists "Authenticated users can update recipes" on public.recipes;
drop policy if exists "Authenticated users can delete recipes" on public.recipes;

create policy "Users can insert recipes they own"
  on public.recipes for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Creator (or legacy unowned) can update recipes"
  on public.recipes for update
  to authenticated
  using (created_by is null or auth.uid() = created_by);

create policy "Creator (or legacy unowned) can delete recipes"
  on public.recipes for delete
  to authenticated
  using (created_by is null or auth.uid() = created_by);
