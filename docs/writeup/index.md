# Writeups — index

Each vulnerability is written up with the same structure (see [`_template.md`](_template.md)):
**the flaw → the exploit → the fix → why it works → the principle**.

## Vulnerability map

| # | Writeup | OWASP Top 10 (2021) | CWE |
|---|---|---|---|
| 1 | [SQL injection](sql-injection.md) | A03 — Injection | CWE-89 |
| 2 | [Broken authentication](broken-authentication.md) | A07 — Identification & Authentication Failures | CWE-256, CWE-307, CWE-384 |
| 3 | [IDOR](idor.md) | A01 — Broken Access Control | CWE-639 |
| 4 | [Stored XSS](stored-xss.md) | A03 — Injection | CWE-79, CWE-20 |
| 5 | [Missing CSRF protection](csrf.md) | A01 — Broken Access Control | CWE-352 |
| 6 | [Verbose error messages](verbose-errors.md) | A05 — Security Misconfiguration | CWE-209 |

## Running the demos

> Filled in as the apps are built. High level:
>
> 1. Create two isolated **Neon** projects (`notes-demo-vulnerable`, `notes-demo-fixed`).
> 2. Create two isolated **Upstash Redis** databases (one per app).
> 3. Import the repo into **Vercel** twice, setting the Root Directory to `apps/vulnerable`
>    and `apps/fixed` respectively, with each project holding only its own `DATABASE_URL`
>    and `UPSTASH_*` values.
> 4. Run migrations + seed against each database.
> 5. Set `ENABLE_VULN_MODE=true` and `DEMO_ACCESS_PASSWORD` on the vulnerable project only.
