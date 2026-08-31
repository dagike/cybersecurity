import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../_lib/db";
import { withErrors } from "../_lib/errors";
import { weakHash } from "../_lib/seedData";
import { setSession } from "../_lib/session";

// No input validation, and the INSERT is built by string concatenation like
// every other query in this app.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  const hash = weakHash(String(password));

  const rows = await rawQuery<{ id: string; username: string; is_admin: boolean }>(
    `INSERT INTO users (username, password_hash)
     VALUES ('${username}', '${hash}')
     RETURNING id, username, is_admin`,
  );

  const user = rows[0]!;
  setSession(res, user.id);
  res.status(201).json({
    user: { id: user.id, username: user.username, isAdmin: user.is_admin },
  });
});
