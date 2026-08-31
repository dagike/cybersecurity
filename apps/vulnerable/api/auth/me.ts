import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../_lib/db";
import { withErrors } from "../_lib/errors";
import { getSession } from "../_lib/session";

// The user id comes straight from the cookie and is concatenated into the
// query, so the session cookie is itself a SQL injection vector.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const rows = await rawQuery<{ id: string; username: string; is_admin: boolean }>(
    `SELECT id, username, is_admin FROM users WHERE id = '${session.userId}'`,
  );

  const user = rows[0];
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.status(200).json({
    user: { id: user.id, username: user.username, isAdmin: user.is_admin },
  });
});
