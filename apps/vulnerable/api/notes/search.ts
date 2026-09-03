import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../_lib/db.js";
import { withErrors } from "../_lib/errors.js";
import { type NoteRow, toNote } from "../_lib/serialize.js";
import { requireSession } from "../_lib/session.js";

// The search term is concatenated straight into the query. Because the SELECT
// list has five columns, a UNION payload can pull data out of any table, e.g.:
//
//   ?q=' UNION SELECT id::text, username, password_hash, now(), now() FROM users --
//
// URL-encoding the term (which the client does) is not a defense: the server
// decodes it before building the string. See docs/writeup/sql-injection.md.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = requireSession(req, res);
  if (!session) return;

  const q = String(req.query.q ?? "");

  const rows = await rawQuery<NoteRow>(
    `SELECT id, title, body, created_at, updated_at FROM notes WHERE user_id = '${session.userId}' AND title ILIKE '%${q}%' ORDER BY id`,
  );

  res.status(200).json({ notes: rows.map(toNote) });
});
