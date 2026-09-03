import { GATE_COOKIE_NAME, isGateCookieValid } from "./api/_lib/gate.js";
import { checkRateLimit } from "./api/_lib/ratelimit.js";

// Runs at the edge, before any function or static asset. Three safety controls
// live here:
//
//  1. The whole app is disabled unless ENABLE_VULN_MODE === "true".
//  2. Every request is rate limited per IP (tighter on /api/auth). This is a
//     platform-level guard that holds regardless of the app's own flaws.
//  3. When enabled, every /api route except /api/gate requires a valid
//     demo-access cookie; without one it returns 403 gate_required and the
//     frontend shows the password screen.

export const config = {
  matcher: "/((?!assets/|favicon.ico).*)",
};

const DISABLED_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Demo disabled</title></head><body style="font-family:system-ui;max-width:32rem;margin:5rem auto;padding:0 1rem">
<h1>This demo is turned off</h1>
<p>This is a deliberately insecure teaching application. It only runs when explicitly enabled.</p>
</body></html>`;

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export default async function middleware(req: Request): Promise<Response | undefined> {
  if (process.env.ENABLE_VULN_MODE !== "true") {
    return new Response(DISABLED_PAGE, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const { pathname } = new URL(req.url);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "0.0.0.0";

  // Fail open: an Upstash error must not take the site down.
  let overLimit = false;
  try {
    overLimit = !(await checkRateLimit(ip, pathname)).ok;
  } catch (err) {
    console.error("edge rate limit check failed", err);
  }
  if (overLimit) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60" },
    });
  }

  const gateExempt = pathname === "/api/gate" || pathname === "/api/admin/reseed";
  if (pathname.startsWith("/api/") && !gateExempt) {
    // Fail closed: any error checking the gate cookie denies access.
    let valid = false;
    try {
      const cookie = readCookie(req.headers.get("cookie"), GATE_COOKIE_NAME);
      valid = await isGateCookieValid(cookie);
    } catch (err) {
      console.error("gate cookie check failed", err);
    }
    if (!valid) {
      return new Response(JSON.stringify({ error: "gate_required" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return undefined;
}
