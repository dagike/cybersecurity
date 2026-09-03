import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withErrors } from "../_lib/errors.js";
import { clearSession } from "../_lib/session.js";

// No CSRF protection: a cross-site page can log the victim out. Minor on its
// own, but the same gap applies to every state-changing route here.

export default withErrors(async (_req: VercelRequest, res: VercelResponse) => {
  clearSession(res);
  res.status(200).json({ ok: true });
});
