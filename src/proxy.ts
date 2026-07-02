import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = new Set([
  "/",
  "/privacy",
  "/terms",
  "/login",
  "/login/forgot",
]);

// Refresh the Supabase session on every matched request. This is the standard
// @supabase/ssr middleware pattern: getUser() validates the JWT and, when the
// access token has expired, uses the refresh token to mint a new one — writing
// the refreshed cookies onto the response. Server Components can't persist
// refreshed cookies themselves, so without this the access token is never
// renewed and every RLS-scoped query silently returns zero rows once the ~1h
// access token lapses (even though the user still appears logged in because the
// refresh-token cookie is still present).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Collapse accidental duplicate slashes (e.g. a Supabase Site URL with a
  // trailing slash makes email links `…mx//auth/callback`). The double slash
  // dodges the `auth` bypass in the matcher below, so the callback would get
  // auth-gated and bounce to /login. Redirect to the clean path first — the
  // query string (which carries token_hash/type for recovery & invite links)
  // is preserved by clone().
  if (pathname.includes("//")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/{2,}/g, "/");
    return NextResponse.redirect(url, 308);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/leads", request.url));
  }

  return response;
}

export const config = {
  // Exclude Next internals, API/auth routes, and any static asset in /public
  // (files with an extension). Without the extension exclusion, requests for
  // public assets like /vive-management-logo.png get auth-gated and redirected
  // to /login, so the logo fails to load on unauthenticated pages.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js|txt|xml|woff2?|ttf|otf|map)$).*)",
  ],
};
