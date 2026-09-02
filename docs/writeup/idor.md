# IDOR (Insecure Direct Object Reference)

> **OWASP:** A01:2021 – Broken Access Control · **CWE:** CWE-639

## The flaw

`apps/vulnerable/api/notes/[id].ts` looks up notes by id and nothing else:

```ts
const id = String(req.query.id);
// GET
const rows = await rawQuery<NoteRow>(
  `SELECT id, title, body, created_at, updated_at FROM notes WHERE id = '${id}'`,
);
```

`PUT` and `DELETE` are the same — `WHERE id = '${id}'` with no reference to the
logged-in user. The endpoint requires a session (you must be *someone*), but it
never checks that the note belongs to *you*.

The vulnerable schema makes this trivial to exploit: `notes.id` is a
`bigserial`, so ids are `1, 2, 3, …` and can be walked.

## The exploit

1. Log in as `alice` (`password123`).
2. Request notes you were never shown:

   ```
   GET /api/notes/1
   GET /api/notes/2
   GET /api/notes/3
   ```

   These return `bob`'s, `carol`'s, and `admin`'s notes, including the
   "Internal: demo credentials" note.
3. `PUT /api/notes/3` overwrites admin's note; `DELETE /api/notes/2` removes
   carol's.

Runnable version: [`docs/exploits/idor.http`](../exploits/idor.http).

## The fix

`apps/fixed/api/notes/[id].ts` scopes every query to the owner:

```ts
const owned = and(eq(notes.id, id), eq(notes.userId, session.userId));

// GET
const [row] = await db.select().from(notes).where(owned).limit(1);
if (!row) throw new ApiError(404, "Note not found");
```

`PUT` uses `.update(notes).set(...).where(owned)`, `DELETE` uses
`.delete(notes).where(owned)`, and each checks that a row was actually
affected. A note that exists but belongs to someone else produces exactly the
same `404` as one that does not exist, so the endpoint never confirms another
user's ids. The fixed schema also uses random UUID ids as defence in depth.

## Why it addresses the root cause

Authentication answers "who is this?"; it does not answer "may this person
touch this object?". The fix moves the authorization check into the query
itself: the row is only returned or modified when `userId` matches the session,
so there is no code path that acts on an object the caller does not own.
Returning `404` rather than `403` also closes the side channel where error codes
leak which ids exist.

## Security principle

**Authentication is not authorization.** For every request that names an object,
the server must verify that the current principal is allowed to act on *that
specific object*. A client-supplied identifier is an input to be checked, never
a grant.

## References

- OWASP: <https://owasp.org/Top10/A01_2021-Broken_Access_Control/>
- OWASP IDOR guidance: <https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html>
- CWE-639: <https://cwe.mitre.org/data/definitions/639.html>
