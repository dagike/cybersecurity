import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { issueCsrfToken } from "../_lib/csrf.js";
import { db, users } from "../_lib/db.js";
import { ApiError, withErrors } from "../_lib/errors.js";
import { getSession } from "../_lib/session.js";

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = await getSession(req);
  if (!session) throw new ApiError(401, "Not authenticated");

  const [user] = await db
    .select({ id: users.id, username: users.username, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) throw new ApiError(401, "Not authenticated");

  // Refresh the CSRF cookie so a returning visitor with only a session cookie
  // gets a usable token.
  issueCsrfToken(res);
  res.status(200).json({ user });
});
