import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { issueCsrfToken } from "../_lib/csrf";
import { db, users } from "../_lib/db";
import { ApiError, withErrors } from "../_lib/errors";
import { hashPassword, verifyPassword } from "../_lib/password";
import { checkLoginRateLimit } from "../_lib/ratelimit";
import { createSession } from "../_lib/session";
import { credentialsSchema, parseBody } from "../_lib/validate";

// Fixes for the vulnerable login:
//  - the lookup is a parameterized Drizzle query (no injection)
//  - passwords are checked with argon2's constant-time verify
//  - attempts are rate limited per IP + username
//  - one generic failure message, and an equal-cost hash on the "no such user"
//    path, so usernames cannot be enumerated

const GENERIC = "Invalid username or password";

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") throw new ApiError(405, "Method not allowed");

  const { username, password } = parseBody(credentialsSchema, req.body);

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (!(await checkLoginRateLimit(`${ip}:${username}`))) {
    throw new ApiError(429, "Too many attempts. Try again in a minute.");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    await hashPassword(password); // spend comparable time
    throw new ApiError(401, GENERIC);
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    throw new ApiError(401, GENERIC);
  }

  await createSession(res, user.id);
  issueCsrfToken(res);
  res.status(200).json({
    user: { id: user.id, username: user.username, isAdmin: user.isAdmin },
  });
});
