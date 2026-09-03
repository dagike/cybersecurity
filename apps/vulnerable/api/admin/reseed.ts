import { timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "pg";
import { withErrors } from "../_lib/errors.js";
import { applySeed } from "../_lib/seedData.js";

// Called on a schedule by Vercel Cron (see vercel.json) to wipe anything
// visitors entered and restore the fake data. Vercel Cron sends
// `Authorization: Bearer <CRON_SECRET>`, so the endpoint checks that.

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

function authorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (!authorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await applySeed((text, params) => pool.query(text, params) as never);
  res.status(200).json({ ok: true, reseededAt: new Date().toISOString() });
});
