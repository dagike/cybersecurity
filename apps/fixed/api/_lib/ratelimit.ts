// Rate limiting for the fixed app, backed by this app's own Postgres database
// (no external cache service). A single atomic upsert bumps a fixed-window
// counter and returns the new value.
//
// Two layers:
//  - checkEdgeRateLimit runs in middleware.ts for every request.
//  - checkLoginRateLimit runs inside the login handler, keyed by IP + username,
//    to cap credential guessing (see docs/writeup/broken-authentication.md).

import { sql } from "drizzle-orm";
import { db } from "./db";

async function hit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, expires_at)
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.expires_at < now() THEN 1
                   ELSE rate_limits.count + 1 END,
      expires_at = CASE WHEN rate_limits.expires_at < now()
                        THEN now() + make_interval(secs => ${windowSeconds})
                        ELSE rate_limits.expires_at END
    RETURNING count
  `);

  // Opportunistically clear expired rows so the table stays small.
  if (Math.random() < 0.02) {
    await db.execute(sql`DELETE FROM rate_limits WHERE expires_at < now()`);
  }

  const count = Number(result.rows[0]?.count ?? 1);
  return count <= limit;
}

export function checkEdgeRateLimit(ip: string, pathname: string): Promise<boolean> {
  const isAuth = pathname.startsWith("/api/auth/");
  return hit(`edge:${isAuth ? "auth" : "global"}:${ip}`, isAuth ? 10 : 60, 60);
}

export function checkLoginRateLimit(key: string): Promise<boolean> {
  return hit(`login:${key}`, 5, 60);
}
