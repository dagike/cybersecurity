import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { checkCsrf } from "../_lib/csrf.js";
import { db, notes } from "../_lib/db.js";
import { ApiError, withErrors } from "../_lib/errors.js";
import { requireSession } from "../_lib/session.js";
import { toNote } from "../_lib/serialize.js";
import { noteSchema, parseBody } from "../_lib/validate.js";

// Every query is scoped by BOTH the note id and the owner's user id. A note
// that exists but belongs to someone else is indistinguishable from one that
// does not exist: the response is 404 either way, so the endpoint never
// confirms another user's note ids. See docs/writeup/idor.md.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = await requireSession(req, res);
  if (!session) return;

  const parsedId = z.string().uuid().safeParse(req.query.id);
  if (!parsedId.success) throw new ApiError(404, "Note not found");
  const id = parsedId.data;
  const owned = and(eq(notes.id, id), eq(notes.userId, session.userId));

  if (req.method === "GET") {
    const [row] = await db.select().from(notes).where(owned).limit(1);
    if (!row) throw new ApiError(404, "Note not found");
    res.status(200).json({ note: toNote(row) });
    return;
  }

  if (req.method === "PUT") {
    if (!checkCsrf(req, res)) return;
    const { title, body } = parseBody(noteSchema, req.body);
    const [row] = await db
      .update(notes)
      .set({ title, body, updatedAt: new Date() })
      .where(owned)
      .returning();
    if (!row) throw new ApiError(404, "Note not found");
    res.status(200).json({ note: toNote(row) });
    return;
  }

  if (req.method === "DELETE") {
    if (!checkCsrf(req, res)) return;
    const deleted = await db.delete(notes).where(owned).returning({ id: notes.id });
    if (!deleted.length) throw new ApiError(404, "Note not found");
    res.status(200).json({ ok: true });
    return;
  }

  throw new ApiError(405, "Method not allowed");
});
