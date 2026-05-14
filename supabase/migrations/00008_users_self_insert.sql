-- Allow a newly-authenticated user to create their own profile row
-- during onboarding. The check restricts the insert to their own auth.uid.

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);
