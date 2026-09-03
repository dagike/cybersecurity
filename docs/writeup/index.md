# Writeups — index

Each vulnerability is written up with the same structure (see [`_template.md`](_template.md)):
**the flaw → the exploit → the fix → why it works → the principle**.

## Vulnerability map

| # | Writeup | OWASP Top 10 (2021) | CWE | Exploit |
|---|---|---|---|---|
| 1 | [SQL injection](sql-injection.md) | A03 – Injection | CWE-89 | [sql-injection.http](../exploits/sql-injection.http) |
| 2 | [Broken authentication](broken-authentication.md) | A07 – Identification & Authentication Failures | CWE-256, CWE-307, CWE-384 | [broken-authentication.http](../exploits/broken-authentication.http) |
| 3 | [IDOR](idor.md) | A01 – Broken Access Control | CWE-639 | [idor.http](../exploits/idor.http) |
| 4 | [Stored XSS](stored-xss.md) | A03 – Injection | CWE-79, CWE-20 | [stored-xss.http](../exploits/stored-xss.http) |
| 5 | [Missing CSRF protection](csrf.md) | A01 – Broken Access Control | CWE-352 | [csrf-poc.html](../exploits/csrf-poc.html) |
| 6 | [Verbose error messages](verbose-errors.md) | A05 – Security Misconfiguration | CWE-209 | [verbose-errors.http](../exploits/verbose-errors.http) |

Every vulnerable behaviour is also runnable from the vulnerable app's **Attack
console** page.

---

## Infrastructure — two fully isolated stacks

| | Vulnerable app | Fixed app |
|---|---|---|
| Vercel project | `notes-demo-vulnerable` (Root Directory `apps/vulnerable`) | `notes-demo-fixed` (Root Directory `apps/fixed`) |
| Database | its own Neon project | its own **separate** Neon project |
| Rate-limit store | Upstash Redis (its own DB) | the fixed app's own Neon DB (`rate_limits` table) |
| Env vars | see `apps/vulnerable/.env.example` | see `apps/fixed/.env.example` |

The two apps never import each other and share no credential or network path.
The vulnerable app is additionally disabled unless `ENABLE_VULN_MODE=true` and
gated behind a shared password.

---

## Setup

### 1. Neon — two projects

1. In the Neon console, create **`notes-demo-vulnerable`** and, separately,
   **`notes-demo-fixed`**. Two projects, not two branches — separate compute and
   credentials.
2. For each, copy the **pooled** connection string (host contains `-pooler`).

### 2. Upstash — one Redis database (vulnerable app only)

1. At upstash.com create a **Redis** database near your Vercel region.
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from its REST
   API section. These go on the vulnerable Vercel project only. The fixed app
   does its rate limiting in its own Neon database and needs no cache service.

### 3. Local dev

```bash
npm install

cp apps/vulnerable/.env.example apps/vulnerable/.env   # fill DATABASE_URL etc.
npm run migrate:vuln && npm run seed:vuln
npm run dev:vuln            # http://localhost:3001  (set ENABLE_VULN_MODE=true to use it)

cp apps/fixed/.env.example apps/fixed/.env             # fill DATABASE_URL
npm run migrate:fixed && npm run seed:fixed
npm run dev:fixed          # http://localhost:3002
```

### 4. Vercel — import the repo twice

For each project: **New Project → import `dagike/cybersecurity` → set Root
Directory** (`apps/vulnerable` or `apps/fixed`) → add the env vars from that
app's `.env.example` → deploy.

- Vulnerable project also needs `ENABLE_VULN_MODE=true`, `DEMO_ACCESS_PASSWORD`,
  `GATE_COOKIE_SECRET`, `CRON_SECRET`, and the `UPSTASH_*` pair.
  Generate each secret with
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
- Fixed project needs only `DATABASE_URL`.

After the first deploy, run the migrations and seed against each production
database (point the local `.env` at the production `DATABASE_URL` and run
`npm run migrate:* && npm run seed:*`, or use `vercel env pull`).

### 5. Verify

- Vulnerable: with `ENABLE_VULN_MODE` unset the site returns 503; set it and the
  password gate appears; once past, the red banner is on every page.
- Fixed: register, add a note containing `<script>`, reload — it shows as text.
- Both: loop requests past the limit and observe `429` from the edge.
- In each Vercel project's settings, confirm only its own `DATABASE_URL` is set.
