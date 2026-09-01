// Sessions for the fixed app.
//
// The cookie carries only an opaque 256-bit random token. The mapping from
// token to user lives in the `sessions` table, so a client cannot forge or
// tamper with its identity, and logout / expiry are enforced server-side. The
// cookie is HttpOnly (JS cannot read it), Secure, and SameSite=Lax (not sent
// on cross-site sub-requests). Contrast with the vulnerable app's plaintext
// `uid` cookie.

import { randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, gt } from "drizzle-orm";
import { appendCookie } from "./cookies";
import { db, sessions } from "./db";

const COOKIE = "sid";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface Session {
  userId: string;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = v.join("=");
  }
  return out;
}

export async function createSession(res: VercelResponse, userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(sessions).values({ id: token, userId, expiresAt });
  appendCookie(
    res,
    `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL_MS / 1000}`,
  );
}

export async function getSession(req: VercelRequest): Promise<Session | null> {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;

  const rows = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

export async function destroySession(req: VercelRequest, res: VercelResponse): Promise<void> {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) await db.delete(sessions).where(eq(sessions.id, token));
  appendCookie(res, `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

/** Returns the session, or writes 401 and returns null. */
export async function requireSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<Session | null> {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return session;
}
