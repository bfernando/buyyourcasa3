import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mobile Redirect Middleware
 * ───────────────────────────
 * Automatically routes mobile users to the purpose-built mobile funnel at /m.
 * Desktop users get the cinematic desktop funnel at /.
 *
 * Detection: User-Agent string check (server-side, zero client JS cost).
 * This is the most reliable method for first-paint routing on Next.js.
 *
 * To DISABLE auto-redirect (e.g., you want one unified page):
 * Simply delete this file or comment out the redirect logic.
 *
 * To FORCE mobile view on desktop for testing:
 * Visit: /?preview=mobile  (or just go directly to /m)
 */

const MOBILE_UA_REGEX =
  /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i;
const APEX_DOMAIN = "buyyour.casa";
const CANONICAL_DOMAIN = "www.buyyour.casa";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Keep the naked domain canonicalized to www once DNS is pointed to Vercel.
  if (host === APEX_DOMAIN) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_DOMAIN;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  // Only apply to the root path
  if (pathname !== "/") return NextResponse.next();

  // Allow ?preview=desktop to bypass redirect on mobile
  if (searchParams.get("preview") === "desktop") return NextResponse.next();

  // Allow ?preview=mobile to force mobile view on desktop
  if (searchParams.get("preview") === "mobile") {
    return NextResponse.redirect(new URL("/m", request.url));
  }

  const ua = request.headers.get("user-agent") ?? "";
  const isMobile = MOBILE_UA_REGEX.test(ua);

  if (isMobile) {
    return NextResponse.redirect(new URL("/m", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
