// Cross-origin allowlist for the public /api/leads endpoints.
// Used to let the standalone Mi Casa Investment Group landing page
// (micasainvestmentgroup.com) post leads into this database from the browser.
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set<string>([
  "https://micasainvestmentgroup.com",
  "https://www.micasainvestmentgroup.com",
  "https://buyyour.casa",
  "https://www.buyyour.casa",
  // Dev / preview
  "http://localhost:3000",
  "http://localhost:3001",
]);

/**
 * Resolve the Access-Control-Allow-Origin value for an incoming request.
 * Returns the request's Origin if allowlisted, otherwise null (no CORS headers
 * emitted, browser blocks the call).
 */
export function resolveAllowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) ? origin : null;
}

/** Common CORS headers for an allowed origin. */
export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Standard preflight response for OPTIONS requests. */
export function preflightResponse(req: Request): NextResponse {
  const origin = resolveAllowedOrigin(req);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/** Wrap a JSON response with CORS headers when the origin is allowlisted. */
export function withCors(req: Request, res: NextResponse): NextResponse {
  const origin = resolveAllowedOrigin(req);
  const headers = corsHeaders(origin);
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  return res;
}
