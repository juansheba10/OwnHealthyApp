-- NutriTrack · Allow users to delete their own meal logs
-- Needed so the "I ate this" toggle on the dashboard can undo a log.

create policy "Users can delete own meal logs"
  on public.meal_logs for delete
  using (auth.uid() = user_id);
