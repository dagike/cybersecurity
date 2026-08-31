// The demo access gate — a safety control, not a vulnerability.
//
// When ENABLE_VULN_MODE is on, visitors must post the shared DEMO_ACCESS_PASSWORD
// to /api/gate before any other route responds. A valid password issues a
// short-lived signed cookie. Signing uses Web Crypto so the same helper runs in
// both the Node functions and the Edge middleware.

const COOKIE = "demo_access";
const TTL_MS = 12 * 60 * 60 * 1000;
const encoder = new TextEncoder();

export const GATE_COOKIE_NAME = COOKIE;

function b64url(bytes: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(bytes)).toString("base64url");
}

async function hmac(message: string): Promise<string> {
  const secret = process.env.GATE_COOKIE_SECRET;
  if (!secret) throw new Error("GATE_COOKIE_SECRET is not set");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return b64url(sig);
}

export async function issueGateCookie(): Promise<string> {
  const exp = String(Date.now() + TTL_MS);
  const value = `${exp}.${await hmac(exp)}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${TTL_MS / 1000}; HttpOnly; Secure; SameSite=Lax`;
}

export async function isGateCookieValid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const [exp, sig] = cookieValue.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  return sig === (await hmac(exp));
}
