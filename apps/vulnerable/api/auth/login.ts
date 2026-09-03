import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../_lib/db.js";
import { withErrors } from "../_lib/errors.js";
import { weakHash } from "../_lib/seedData.js";
import { setSession } from "../_lib/session.js";

// Problems here, all deliberate:
//  - the WHERE clause is built by string concatenation (SQL injection: a
//    username of  ' OR '1'='1' --  logs in as the first user)
//  - passwords are compared as unsalted MD5 hashes
//  - there is no rate limiting, so credentials can be brute forced
//  - the two failure messages differ, which lets an attacker enumerate which
//    usernames exist
// See docs/writeup/sql-injection.md and docs/writeup/broken-authentication.md.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  const hash = weakHash(String(password));

  const rows = await rawQuery<{ id: string; username: string; is_admin: boolean }>(
    `SELECT id, username, is_admin
       FROM users
      WHERE username = '${username}'
        AND password_hash = '${hash}'`,
  );

  const user = rows[0];
  if (!user) {
    const exists = await rawQuery(`SELECT 1 FROM users WHERE username = '${username}'`);
    res.status(401).json({
      error: exists.length ? "Incorrect password" : "No account with that username",
    });
    return;
  }

  setSession(res, user.id);
  res.status(200).json({
    user: { id: user.id, username: user.username, isAdmin: user.is_admin },
  });
});
