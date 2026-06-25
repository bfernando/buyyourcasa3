import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mobile Redirect Middleware
 * ───────────────────────────
 * Automatically routes mobile users to the purpose-built mobile funnel.
 * Desktop users get the form-first desktop funnel.
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
  // /u stays on the exact URL for one-click unsubscribe clients.
  if (host === APEX_DOMAIN && pathname !== "/u") {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_DOMAIN;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  // Only apply to the root and language landing paths.
  if (pathname !== "/" && pathname !== "/en" && pathname !== "/es") {
    return NextResponse.next();
  }

  // Allow ?preview=desktop to bypass redirect on mobile
  if (searchParams.get("preview") === "desktop") return NextResponse.next();

  // Allow ?preview=mobile to force mobile view on desktop
  if (searchParams.get("preview") === "mobile") {
    const mobileTarget = pathname === "/es" ? "/es/m" : pathname === "/en" ? "/en/m" : "/m";
    return NextResponse.redirect(new URL(mobileTarget, request.url));
  }

  const ua = request.headers.get("user-agent") ?? "";
  const isMobile = MOBILE_UA_REGEX.test(ua);

  if (isMobile) {
    const mobileTarget = pathname === "/es" ? "/es/m" : pathname === "/en" ? "/en/m" : "/m";
    return NextResponse.redirect(new URL(mobileTarget, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
