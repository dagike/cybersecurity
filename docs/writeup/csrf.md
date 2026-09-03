# Missing CSRF protection

> **OWASP:** A01:2021 – Broken Access Control · **CWE:** CWE-352

## The flaw

The vulnerable app's state-changing endpoints (`POST /api/notes`,
`PUT`/`DELETE /api/notes/:id`, `POST /api/auth/logout`) authorize a request
using only the session cookie. There is:

- no CSRF token,
- no check on the `Origin` / `Referer` header,
- and the session cookie is set `SameSite=None` (`apps/vulnerable/api/_lib/session.ts`),
  so the browser attaches it to cross-site requests.

A page on any other origin can therefore cause the victim's browser to send an
authenticated request.

## The exploit

[`docs/exploits/csrf-poc.html`](../exploits/csrf-poc.html) is a standalone page.
Opened while the victim is logged in to the vulnerable app, it:

1. auto-submits a hidden form to `POST /api/notes` (a form submission is not
   subject to the same-origin policy), and
2. fires `fetch('/api/notes/1', { method: 'DELETE', credentials: 'include' })`.

Both run as the victim. No token is needed because none is checked.

## The fix

`apps/fixed/api/_lib/csrf.ts` implements the double-submit-cookie pattern plus
an origin check, and `apps/fixed` sets the session cookie `SameSite=Lax`.

```ts
export function issueCsrfToken(res: VercelResponse): void {
  const token = randomBytes(32).toString("base64url");
  appendCookie(res, `csrf=${token}; Path=/; Secure; SameSite=Lax`);
}

export function checkCsrf(req, res): boolean {
  if (!UNSAFE.has(req.method)) return true;

  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (origin && host && new URL(origin).host !== host) { /* 403 */ }

  const cookieToken = parseCookies(req.headers.cookie).csrf;
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !safeEqual(cookieToken, headerToken)) { /* 403 */ }
  return true;
}
```

The token is delivered in a readable cookie; the client
(`apps/fixed/src/lib/api.ts`) copies it into an `X-CSRF-Token` header on every
unsafe request. Every mutating endpoint calls `checkCsrf` first.

## Why it addresses the root cause

CSRF works because the browser automatically attaches cookies to requests the
attacker's site triggers — the cookie alone proves the user is *logged in*, not
that the user *intended this request*. The fixes add proof of intent:

- The attacker's origin cannot read our `csrf` cookie (same-origin policy), so
  it cannot produce a matching `X-CSRF-Token` header.
- `SameSite=Lax` stops the session cookie from riding along on cross-site
  sub-requests (POST, fetch, iframes) at all.
- The `Origin` check rejects anything not sent from our own site.

Any one of these blocks the classic attack; together they are robust.

## Security principle

**A cookie proves a session, not an intention.** For any request that changes
state, require a value that only your own origin could have supplied.

## References

- OWASP: <https://owasp.org/Top10/A01_2021-Broken_Access_Control/>
- OWASP CSRF Prevention Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
- CWE-352: <https://cwe.mitre.org/data/definitions/352.html>
