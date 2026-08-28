import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, etc.)
     * - api/cron (server-to-server, authenticated via a shared secret
     *   header instead of a session cookie — see app/api/cron/reminders)
     * - manifest.json / sw.js (must be publicly fetchable, including from
     *   the unauthenticated /login page)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|api/cron|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
