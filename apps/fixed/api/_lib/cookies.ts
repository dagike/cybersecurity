// A single response often needs to set more than one cookie (session + CSRF).
// res.setHeader("Set-Cookie", ...) replaces any previous value, so this helper
// accumulates them into an array instead.

import type { VercelResponse } from "@vercel/node";

export function appendCookie(res: VercelResponse, cookie: string): void {
  const existing = res.getHeader("Set-Cookie");
  const list = Array.isArray(existing)
    ? existing
    : existing
      ? [String(existing)]
      : [];
  list.push(cookie);
  res.setHeader("Set-Cookie", list);
}
