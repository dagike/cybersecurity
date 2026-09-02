import type { VercelRequest, VercelResponse } from "@vercel/node";
import { desc, eq } from "drizzle-orm";
import { checkCsrf } from "../_lib/csrf";
import { db, notes } from "../_lib/db";
import { ApiError, withErrors } from "../_lib/errors";
import { requireSession } from "../_lib/session";
import { toNote } from "../_lib/serialize";
import { noteSchema, parseBody } from "../_lib/validate";

// GET  -> the current user's notes
// POST -> create a note (CSRF-checked, body validated)
//
// The body is stored as-is but rendered as text on the client, so markup in it
// never executes (see docs/writeup/stored-xss.md).

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, session.userId))
      .orderBy(desc(notes.createdAt));
    res.status(200).json({ notes: rows.map(toNote) });
    return;
  }

  if (req.method === "POST") {
    if (!checkCsrf(req, res)) return;
    const { title, body } = parseBody(noteSchema, req.body);
    const [row] = await db
      .insert(notes)
      .values({ userId: session.userId, title, body })
      .returning();
    res.status(201).json({ note: toNote(row!) });
    return;
  }

  throw new ApiError(405, "Method not allowed");
});
