import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { issueCsrfToken } from "../_lib/csrf.js";
import { db, users } from "../_lib/db.js";
import { ApiError, withErrors } from "../_lib/errors.js";
import { hashPassword } from "../_lib/password.js";
import { createSession } from "../_lib/session.js";
import { credentialsSchema, parseBody } from "../_lib/validate.js";

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") throw new ApiError(405, "Method not allowed");

  const { username, password } = parseBody(credentialsSchema, req.body);

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (taken.length) throw new ApiError(409, "That username is taken");

  const [user] = await db
    .insert(users)
    .values({ username, passwordHash: await hashPassword(password) })
    .returning({ id: users.id, username: users.username, isAdmin: users.isAdmin });

  await createSession(res, user!.id);
  issueCsrfToken(res);
  res.status(201).json({ user });
});
