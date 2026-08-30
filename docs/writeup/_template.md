# <Vulnerability name>

> **OWASP:** <A0X:2021 Category> · **CWE:** <CWE-XXX>

## The flaw

What is wrong, and where. Include the vulnerable snippet and a link to the file and line in
`apps/vulnerable/`.

```ts
// apps/vulnerable/api/...
```

## The exploit

Step by step, reproducible against the vulnerable app.

1. Which seeded user to log in as (see `apps/vulnerable/scripts/seed.ts`).
2. The request — an Attack Console card and/or a `curl` command from
   [`docs/exploits/`](../exploits/).
3. The observed result (what the response contains, screenshot placeholder).

## The fix

The hardened code and a link to the file in `apps/fixed/`, plus exactly what changed.

```ts
// apps/fixed/api/...
```

## Why it addresses the root cause

The mechanism — not just "we added a check", but *why* the class of attack is no longer possible.

## Security principle

The transferable idea, stated in one or two sentences.

## References

- OWASP: <link>
- CWE: <link>
- <one more canonical reference>
