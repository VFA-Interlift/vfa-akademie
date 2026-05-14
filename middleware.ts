import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSessionCookie(req: NextRequest) {
  return Boolean(
    req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/splash") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = hasSessionCookie(req);

  if (
    isLoggedIn &&
    (pathname === "/" || pathname === "/login" || pathname === "/register")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";

    return NextResponse.redirect(url);
  }

  if (isLoggedIn) {
    return NextResponse.next();
  }

  const seen = req.cookies.get("seenSplash")?.value;

  if (seen) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/splash";
  url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;

  const res = NextResponse.redirect(url);

  res.cookies.set("seenSplash", "true", {
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|splash).*)"],
};