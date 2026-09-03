import { next } from "@vercel/edge";
import { checkEdgeRateLimit } from "./api/_lib/ratelimit.js";

// Runs at the edge before any function. It applies the per-IP rate limit (a
// platform-level guard, independent of the app's own checks) and sets the
// security response headers on every request.

export const config = {
  matcher: "/((?!assets/|favicon.ico).*)",
};

const isProd =
  process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

// script-src 'self' only — the Vite build emits no inline scripts. style-src
// allows 'unsafe-inline' because the UI uses inline style attributes. The
// content of a note is rendered as text by React, so it can never introduce a
// script regardless. In local `vercel dev` the CSP is dropped so Vite's HMR
// client works.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  ...(isProd
    ? {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
        ].join("; "),
      }
    : {}),
};

export default async function middleware(req: Request): Promise<Response> {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "0.0.0.0";
  const { pathname } = new URL(req.url);

  if (!(await checkEdgeRateLimit(ip, pathname))) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60", ...SECURITY_HEADERS },
    });
  }

  return next({ headers: SECURITY_HEADERS });
}
