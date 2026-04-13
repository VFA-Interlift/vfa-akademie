import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log("MIDDLEWARE RUNNING", req.nextUrl.pathname);

  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/splash") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const seen = req.cookies.get("seenSplash")?.value;

  if (seen) return NextResponse.next();

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