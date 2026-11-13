import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth returns here with ?code=… (PKCE). Exchange it for a session, then enforce
 * the UMak domain ON THE SERVER. A non-UMak account is signed out and its auth row deleted,
 * so we keep no data about it. (The "before user created" auth hook blocks it earlier
 * when enabled; this is the second layer.)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = url.searchParams.get("next");
  const fail = (code: string, detail?: string) => {
    const to = new URL("/auth/sign-in", url.origin);
    to.searchParams.set("error", code);
    if (detail) to.searchParams.set("detail", detail.slice(0, 200));
    return NextResponse.redirect(to);
  };

  // Supabase sends errors (e.g. the auth hook's 403) back as query params.
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (providerError) return fail(/umak|domain|403/i.test(providerError) ? "domain" : "oauth", providerError);

  const code = url.searchParams.get("code");
  if (!code) return fail("oauth", "Missing sign-in code.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("oauth", error?.message);

  if (!isAllowedEmail(data.user.email)) {
    await supabase.auth.signOut();
    try {
      await createAdminClient().auth.admin.deleteUser(data.user.id);
    } catch {
      // best effort: the account is signed out either way
    }
    return fail("domain");
  }

  const to = new URL("/auth/continue", url.origin);
  if (next) to.searchParams.set("next", next);
  return NextResponse.redirect(to);
}
