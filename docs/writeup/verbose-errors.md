# Verbose error messages

> **OWASP:** A05:2021 – Security Misconfiguration · **CWE:** CWE-209

## The flaw

`apps/vulnerable/api/_lib/errors.ts` returns every unhandled error to the
caller in full:

```ts
export function handleError(res: VercelResponse, err: unknown): void {
  const error = err instanceof Error ? err : new Error(String(err));
  res.status(500).json({
    error: error.message,
    stack: error.stack,
    lastQuery: debugState.lastSql,
  });
}
```

`debugState.lastSql` is set by `rawQuery` on every call, so a 500 hands the
client the exact SQL that ran.

## The exploit

Any malformed request produces a leak. The simplest is an unbalanced quote in
the search term:

```
GET /api/notes/search?q='
```

Response:

```json
{
  "error": "unterminated quoted string at or near \"'...\"",
  "stack": "error: ...\n    at .../api/notes/search.ts:15 ...",
  "lastQuery": "SELECT id, title, body, created_at, updated_at FROM notes WHERE user_id = '...' AND title ILIKE '%'%' ..."
}
```

That single response reveals the database engine, table and column names, the
query shape (useful for building injection payloads), file paths, and the
framework internals from the stack trace.

Runnable version: [`docs/exploits/verbose-errors.http`](../exploits/verbose-errors.http).

## The fix

`apps/fixed/api/_lib/errors.ts` splits intentional client errors from bugs:

```ts
export function withErrors(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message, details: err.details });
        return;
      }
      const requestId = randomUUID();
      console.error(`[${requestId}]`, err);
      res.status(500).json({ error: "Internal Server Error", requestId });
    }
  };
}
```

Validation failures throw `ApiError(400, "Invalid request", fieldErrors)` — safe,
specific, no internals. Everything else becomes a generic 500 with a request id;
the real error goes to the server log under that id, where an operator can find
it.

## Why it addresses the root cause

An error response is an output channel like any other, and by default it was
carrying implementation detail to anyone who could trigger it. The fix treats
internal error information as sensitive: the user gets only what they need to
report the problem (a correlation id), and the diagnostic detail is delivered
out of band to the people who operate the system.

## Security principle

**Fail closed on information.** Distinguish "this is a message for the user"
from "this is a diagnostic for the operator", and never send the second to the
first.

## References

- OWASP: <https://owasp.org/Top10/A05_2021-Security_Misconfiguration/>
- OWASP Error Handling Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html>
- CWE-209: <https://cwe.mitre.org/data/definitions/209.html>
