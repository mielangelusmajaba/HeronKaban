import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Paths that need a signed-in user. Finer checks (domain, consent, org role) run on the server. */
const PROTECTED = ["/m", "/o", "/welcome", "/admin", "/auth/consent"];

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase auth session cookie on each request and bounces signed-out
 * visitors away from app pages. This is a coarse, optimistic check only: pages and
 * server actions re-check the user (src/lib/auth.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response; // Supabase not configured yet: pass through.

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Cache-control headers so a CDN never serves one user's session cookie to another.
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Don't run code between createServerClient and getClaims(): this call refreshes the token.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && isProtected(request.nextUrl.pathname)) {
    const to = request.nextUrl.clone();
    to.pathname = "/auth/sign-in";
    to.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(to);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
