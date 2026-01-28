import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Nie auf API / Next intern / Assets / Splash selbst anwenden
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/splash") ||
    pathname.includes(".") // z.B. /favicon.ico, /logo.png
  ) {
    return NextResponse.next();
  }

  // Cookie prüfen
  const seen = req.cookies.get("seenSplash")?.value;

  if (seen) return NextResponse.next();

  // Ziel merken (damit wir nach Splash dahin zurück gehen)
  const url = req.nextUrl.clone();
  url.pathname = "/splash";
  url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;

  const res = NextResponse.redirect(url);

  // Cookie setzen: nur 1x pro Browser (hier 1 Tag)
  res.cookies.set("seenSplash", "true", {
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|splash).*)"],
};
