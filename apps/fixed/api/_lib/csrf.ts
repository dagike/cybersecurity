// CSRF protection for the fixed app — the double-submit-cookie pattern plus an
// origin check.
//
// A random token is stored in a readable (non-HttpOnly) cookie. Every
// state-changing request must echo that value in an X-CSRF-Token header. A
// cross-site attacker's page can cause the browser to send our cookies, but it
// cannot read them (same-origin policy) and so cannot set a matching header.
// SameSite=Lax on the session cookie and the origin check are extra layers.

import { randomBytes, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appendCookie } from "./cookies";

const COOKIE = "csrf";
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = v.join("=");
  }
  return out;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Sets a fresh CSRF cookie. Call on any response that establishes identity. */
export function issueCsrfToken(res: VercelResponse): void {
  const token = randomBytes(32).toString("base64url");
  appendCookie(res, `${COOKIE}=${token}; Path=/; Secure; SameSite=Lax`);
}

/** Returns true if the request may proceed; otherwise writes 403 and returns false. */
export function checkCsrf(req: VercelRequest, res: VercelResponse): boolean {
  if (!UNSAFE.has((req.method ?? "GET").toUpperCase())) return true;

  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (origin && host && new URL(origin).host !== host) {
    res.status(403).json({ error: "Cross-origin request rejected" });
    return false;
  }

  const cookieToken = parseCookies(req.headers.cookie)[COOKIE];
  const headerToken = req.headers["x-csrf-token"];
  if (
    !cookieToken ||
    typeof headerToken !== "string" ||
    !safeEqual(cookieToken, headerToken)
  ) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return false;
  }

  return true;
}
