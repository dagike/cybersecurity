import { timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withErrors } from "./_lib/errors";
import { issueGateCookie } from "./_lib/gate";

// Exchanges the shared demo password for a short-lived access cookie. This is
// the one endpoint that stays reachable before the gate is passed.

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export default withErrors(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const expected = process.env.DEMO_ACCESS_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "Demo gate is not configured" });
    return;
  }

  const { password } = (req.body ?? {}) as { password?: string };
  if (!password || !safeEqual(password, expected)) {
    res.status(401).json({ error: "Incorrect demo password" });
    return;
  }

  res.setHeader("Set-Cookie", await issueGateCookie());
  res.status(200).json({ ok: true });
});
