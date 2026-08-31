import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../_lib/db";
import { withErrors } from "../_lib/errors";
import { type NoteRow, toNote } from "../_lib/serialize";
import { requireSession } from "../_lib/session";

// Every query here matches on the note id alone — it never checks that the
// note belongs to the logged-in user. Because note ids are a short sequence,
// anyone logged in can read, edit, or delete any other user's notes by
// walking ids. See docs/writeup/idor.md. (PUT and DELETE also have no CSRF
// protection.)

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = requireSession(req, res);
  if (!session) return;

  const id = String(req.query.id);

  if (req.method === "GET") {
    const rows = await rawQuery<NoteRow>(
      `SELECT id, title, body, created_at, updated_at FROM notes WHERE id = '${id}'`,
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.status(200).json({ note: toNote(rows[0]) });
    return;
  }

  if (req.method === "PUT") {
    const { title, body } = (req.body ?? {}) as { title?: string; body?: string };
    const rows = await rawQuery<NoteRow>(
      `UPDATE notes
          SET title = '${title}', body = '${body}', updated_at = now()
        WHERE id = '${id}'
        RETURNING id, title, body, created_at, updated_at`,
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.status(200).json({ note: toNote(rows[0]) });
    return;
  }

  if (req.method === "DELETE") {
    await rawQuery(`DELETE FROM notes WHERE id = '${id}'`);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
});
