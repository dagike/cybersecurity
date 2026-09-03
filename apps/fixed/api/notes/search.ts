import type { VercelRequest, VercelResponse } from "@vercel/node";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db, notes } from "../_lib/db.js";
import { withErrors } from "../_lib/errors.js";
import { requireSession } from "../_lib/session.js";
import { toNote } from "../_lib/serialize.js";

// The search term is passed to Drizzle's `ilike` as a bound parameter. The
// query structure is fixed at author time; the term is only ever data, so it
// cannot change what the query does. Contrast with the vulnerable app, which
// concatenates the term into the SQL string.

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  const session = await requireSession(req, res);
  if (!session) return;

  const q = z.string().max(200).catch("").parse(req.query.q);

  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, session.userId), ilike(notes.title, `%${q}%`)))
    .orderBy(notes.createdAt);

  res.status(200).json({ notes: rows.map(toNote) });
});
