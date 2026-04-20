import { NextResponse, type NextRequest } from "next/server";

// Fast cookie-presence check. Previously this proxy called
// supabase.auth.getUser() which is a network round-trip to Supabase
// (~150ms). That cost ran on every matched request, including the POST
// + redirect pair that every form submission generates, adding ~300ms
// of latency on every "Save" button click.
//
// Pages themselves call createSupabaseServerClient() + getUser(), which
// performs the real JWT validation and refresh. The proxy just fast-
// paths the "do you have any session cookie at all" decision.
function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSupabaseSession(request);

  if (!hasSession && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/leads", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth).*)",
  ],
};
