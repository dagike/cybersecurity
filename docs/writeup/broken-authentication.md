# Broken authentication

> **OWASP:** A07:2021 – Identification and Authentication Failures ·
> **CWE:** CWE-256, CWE-307, CWE-384

## The flaw

Four separate weaknesses in the vulnerable app combine:

1. **Weak password storage.** `apps/vulnerable/api/_lib/seedData.ts` hashes with
   unsalted MD5:

   ```ts
   export function weakHash(password: string): string {
     return createHash("md5").update(password).digest("hex");
   }
   ```

   MD5 is fast and unsalted, so the hashes dumped by the SQL injection UNION are
   crackable with a wordlist in seconds, and identical passwords produce
   identical hashes.

2. **No rate limiting.** `api/auth/login.ts` processes every attempt. Nothing
   locks the account or slows down guessing.

3. **Forgeable sessions.** `api/_lib/session.ts` sets `uid=<user id>` with no
   signature and no server-side record:

   ```ts
   res.setHeader("Set-Cookie", `${COOKIE}=${userId}; Path=/; SameSite=None; Secure`);
   ```

   Editing the cookie to another user's id impersonates them.

4. **User enumeration.** `login.ts` returns `"No account with that username"`
   vs `"Incorrect password"`, so an attacker can discover valid usernames.

## The exploit

- Send `{ "username": "alice", "password": "x" }` → `Incorrect password`
  (alice exists). Send a random name → `No account with that username`.
- Loop POSTs to `/api/auth/login` with a password list — no throttling.
- Take a `password_hash` from the injection dump, crack the MD5, log in.
- Or skip cracking entirely: log in once, then set `document.cookie = "uid=<other id>"`
  and call `/api/auth/me`.

Runnable version: [`docs/exploits/broken-authentication.http`](../exploits/broken-authentication.http).

## The fix

**Hashing** — `apps/fixed/api/_lib/password.ts` uses argon2id with
OWASP-range parameters:

```ts
const OPTIONS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };
export const hashPassword = (p: string) => hash(p, OPTIONS);
export const verifyPassword = (stored: string, p: string) => verify(stored, p, OPTIONS);
```

Each hash is uniquely salted, slow to compute, and verified in constant time.

**Rate limiting** — `apps/fixed/api/auth/login.ts` caps attempts per IP + username:

```ts
if (!(await checkLoginRateLimit(`${ip}:${username}`))) {
  throw new ApiError(429, "Too many attempts. Try again in a minute.");
}
```

**Sessions** — `apps/fixed/api/_lib/session.ts` issues a 256-bit random token,
stores the token → user mapping in the `sessions` table, and sets the cookie
`HttpOnly; Secure; SameSite=Lax`. The client never holds anything but an opaque
string, and logout / expiry are enforced server-side.

**Enumeration** — `login.ts` returns one message, `"Invalid username or
password"`, for every failure, and runs an equal-cost hash on the "no such user"
path so response timing does not reveal which usernames exist.

## Why it addresses the root cause

- A leaked argon2id hash cannot be reversed and is expensive to brute force, so
  a database breach no longer hands over passwords.
- Rate limiting bounds the number of guesses per unit time, which is what makes
  online password guessing impractical.
- An unguessable, server-issued token that the server can revoke means session
  identity is not something the client can construct or alter.
- One generic message and constant-time behaviour remove the oracle that let an
  attacker map the user base.

## Security principle

**Make credentials expensive to guess and impossible to recover, cap the guess
rate, and let only the server mint and revoke identity.** Authentication
failures should reveal nothing beyond "that didn't work".

## References

- OWASP: <https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/>
- OWASP Password Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- OWASP Session Management Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
- CWE-307: <https://cwe.mitre.org/data/definitions/307.html>
