import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkCsrf } from "../_lib/csrf";
import { ApiError, withErrors } from "../_lib/errors";
import { destroySession } from "../_lib/session";

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") throw new ApiError(405, "Method not allowed");
  if (!checkCsrf(req, res)) return;

  await destroySession(req, res);
  res.status(200).json({ ok: true });
});
