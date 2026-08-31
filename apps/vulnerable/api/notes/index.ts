import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../_lib/db";
import { withErrors } from "../_lib/errors";
import { type NoteRow, toNote } from "../_lib/serialize";
import { requireSession } from "../_lib/session";

// GET  -> list the current user's notes
// POST -> create a note
//
// The POST body is stored exactly as received: no length limit, no type check,
// no sanitization. Combined with the way notes are rendered on the client
// (dangerouslySetInnerHTML), that gives stored XSS. There is also no CSRF
// token, so a cross-site page can create notes as the victim.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const rows = await rawQuery<NoteRow>(
      `SELECT id, title, body, created_at, updated_at
         FROM notes
        WHERE user_id = '${session.userId}'
        ORDER BY id`,
    );
    res.status(200).json({ notes: rows.map(toNote) });
    return;
  }

  if (req.method === "POST") {
    const { title, body } = (req.body ?? {}) as { title?: string; body?: string };
    const rows = await rawQuery<NoteRow>(
      `INSERT INTO notes (user_id, title, body)
       VALUES ('${session.userId}', '${title}', '${body}')
       RETURNING id, title, body, created_at, updated_at`,
    );
    res.status(201).json({ note: toNote(rows[0]!) });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
});
