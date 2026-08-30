# Notes — Web Application Security Demo

The same small full-stack app (cookie-session login + CRUD notes) built **twice**:

- **`apps/vulnerable`** — realistic, intentional web vulnerabilities.
- **`apps/fixed`** — the same features, hardened with industry-standard practices.

Each vulnerability is documented in [`docs/writeup/`](docs/writeup/) as **flaw → exploit → fix →
principle**, with runnable exploit requests in [`docs/exploits/`](docs/exploits/).

---

## ⚠️ Safety disclaimer

The vulnerable app is a **deliberately insecure teaching demo**. It exists only to show how common
flaws work and how to fix them.

- It contains **only fake, seeded data** — no real accounts, emails, or credentials, ever.
- The vulnerable behaviour is **off by default**. It runs only when `ENABLE_VULN_MODE=true` **and**
  the visitor passes a shared password gate.
- Its database, cache, and secrets are **fully isolated** from the fixed app and from anything
  else — separate Neon project, separate Upstash database, no shared credentials or network path.
- Every page carries a visible "insecure demo" banner.
- Both deployments are rate-limited at the edge regardless of any app-level flaw.
- The vulnerable database is re-seeded on a schedule, wiping anything visitors enter.

**Do not enter real credentials or data anywhere in this project.**

---

## Vulnerabilities covered

| # | Vulnerability | OWASP | Writeup |
|---|---|---|---|
| 1 | SQL injection | A03:2021 Injection | [sql-injection.md](docs/writeup/sql-injection.md) |
| 2 | Broken authentication | A07:2021 Identification & Authentication Failures | [broken-authentication.md](docs/writeup/broken-authentication.md) |
| 3 | IDOR / broken access control | A01:2021 Broken Access Control | [idor.md](docs/writeup/idor.md) |
| 4 | Stored XSS / missing input validation | A03:2021 Injection | [stored-xss.md](docs/writeup/stored-xss.md) |
| 5 | Missing CSRF protection | A01:2021 Broken Access Control | [csrf.md](docs/writeup/csrf.md) |
| 6 | Verbose error messages | A05:2021 Security Misconfiguration | [verbose-errors.md](docs/writeup/verbose-errors.md) |

---

## Architecture

```
                repo (npm workspaces)
                        │
    ┌───────────────────┼────────────────────┐
    │                   │                    │
packages/shared-ui  apps/vulnerable      apps/fixed
 React components    Vite SPA + /api      Vite SPA + /api
 (consumed as        raw pg queries       Drizzle ORM
  source)            unsigned cookie      argon2 + sessions
    │                   │                    │
    │            Vercel project A     Vercel project B
    │             ├ Neon project A     ├ Neon project B
    │             └ Upstash DB A       └ Upstash DB B
    │                (isolated — no shared secrets or network path)
```

- **Frontend:** React + Vite, deployed on Vercel.
- **Backend:** Vercel serverless functions (Node / TypeScript) in each app's `api/` folder.
- **Database:** Neon (serverless Postgres) — one isolated project per app.
- **Edge:** Vercel Edge Middleware + Upstash Redis for rate limiting — one isolated database per app.

---

## Tech stack

| Layer | Vulnerable | Fixed |
|---|---|---|
| DB access | raw string-concatenated `pg` queries | Drizzle ORM (parameterized) |
| Passwords | unsalted MD5 | argon2id |
| Sessions | unsigned `uid` cookie | opaque random token, server-side store |
| Input | unvalidated | `zod` schemas |
| Output | `dangerouslySetInnerHTML` | React escaping + CSP |
| CSRF | none | double-submit token + SameSite + Origin check |
| Errors | full stack traces in the response | generic message + request id |

---

## Local development

Requires Node 20+, and a Neon project + Upstash database per app.

```bash
npm install

# vulnerable app
cp apps/vulnerable/.env.example apps/vulnerable/.env   # fill in values
npm run migrate:vuln && npm run seed:vuln
npm run dev:vuln                                        # http://localhost:3001

# fixed app
cp apps/fixed/.env.example apps/fixed/.env             # fill in values
npm run migrate:fixed && npm run seed:fixed
npm run dev:fixed                                       # http://localhost:3002
```

Full setup (Neon, Upstash, Vercel) is documented in
[`docs/writeup/index.md`](docs/writeup/index.md).

## Tests

```bash
npm test
```

The suite runs each exploit against both apps: it asserts the exploit **succeeds** on the
vulnerable app and **fails safely** on the fixed app.
