import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Only use where `userId` is passed in
// explicitly and already trusted (a real authenticated session, or a
// server-only cron path), never derived from unvalidated client input.
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
