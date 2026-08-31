// "Sessions" for the vulnerable app.
//
// The session cookie is just the user's id in plain text, with no signature or
// server-side record. Anyone can edit the cookie to become any user, and
// because it is not HttpOnly a stored-XSS payload can read it. SameSite=None
// means the browser also sends it on cross-site requests, which is what makes
// the CSRF demo work. See:
//   docs/writeup/broken-authentication.md
//   docs/writeup/stored-xss.md
//   docs/writeup/csrf.md

import type { VercelRequest, VercelResponse } from "@vercel/node";

const COOKIE = "uid";

export interface Session {
  userId: string;
}

export function getSession(req: VercelRequest): Session | null {
  const userId = req.cookies?.[COOKIE];
  if (!userId) return null;
  return { userId };
}

export function setSession(res: VercelResponse, userId: string): void {
  res.setHeader("Set-Cookie", `${COOKIE}=${userId}; Path=/; SameSite=None; Secure`);
}

export function clearSession(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; SameSite=None; Secure`);
}

/** Returns the session or writes a 401 and returns null. */
export function requireSession(req: VercelRequest, res: VercelResponse): Session | null {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return session;
}
