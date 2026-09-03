# SQL injection

> **OWASP:** A03:2021 – Injection · **CWE:** CWE-89

## The flaw

The vulnerable app builds every SQL statement by concatenating strings, and the
values it concatenates come straight from the request. `api/_lib/db.ts` only
exposes a `rawQuery(sql)` function — there is no way to pass bound parameters.

`apps/vulnerable/api/notes/search.ts`:

```ts
const rows = await rawQuery<NoteRow>(
  `SELECT id, title, body, created_at, updated_at
     FROM notes
    WHERE user_id = '${session.userId}'
      AND title ILIKE '%${q}%'
    ORDER BY id`,
);
```

`apps/vulnerable/api/auth/login.ts` does the same with the username:

```ts
`SELECT id, username, is_admin
   FROM users
  WHERE username = '${username}'
    AND password_hash = '${hash}'`
```

The database receives one string and cannot tell which parts were written by
the developer and which parts came from the user.

## The exploit

**Auth bypass.** POST to `/api/auth/login` with:

```json
{ "username": "' OR '1'='1' --", "password": "anything" }
```

The query becomes `... WHERE username = '' OR '1'='1' --' AND password_hash = '...'`.
`'1'='1'` is always true and `--` comments out the password check, so the first
row in `users` is returned and you are logged in as that user.

**Data exfiltration.** The search `SELECT` returns five columns
(`id` bigint, `title`, `body`, `created_at`, `updated_at`), so a `UNION` whose
column types line up can read any table:

```
GET /api/notes/search?q=' UNION SELECT NULL, username, id::text || ' | ' || password_hash, now(), now() FROM users --
```

The response comes back as a list of "notes" whose title is each username and
whose body is `"<user id> | <MD5 hash>"`. URL-encoding the term (which the
client does) changes nothing — the server decodes it before building the string.

Runnable version: [`docs/exploits/sql-injection.http`](../exploits/sql-injection.http).

## The fix

The fixed app never builds SQL from strings. Every query goes through Drizzle,
which sends the statement and its parameters separately.

`apps/fixed/api/notes/search.ts`:

```ts
const rows = await db
  .select()
  .from(notes)
  .where(and(eq(notes.userId, session.userId), ilike(notes.title, `%${q}%`)))
  .orderBy(notes.createdAt);
```

The `%${q}%` string is still assembled in JavaScript, but Drizzle passes it as a
**bound parameter** — the driver sends `SELECT ... WHERE title ILIKE $1` and
`$1 = '%<q>%'` as separate values. The login lookup is likewise
`where(eq(users.username, username))`.

## Why it addresses the root cause

The vulnerability exists because user input is interpreted as SQL *code*.
Parameterized queries send the query text and the data over the protocol as
distinct fields: the database parses the query first, then binds the values into
already-parsed placeholders. A value can contain `'`, `--`, `UNION`, or anything
else and it will only ever be compared as a literal string. Escaping or
blocklisting input tries to sanitize the data; parameterization removes the
possibility entirely.

## Security principle

**Separate code from data.** Never assemble an interpreter's input (SQL, shell,
HTML, LDAP…) by concatenating untrusted values. Use an API that keeps the
structure and the data apart.

## References

- OWASP: <https://owasp.org/Top10/A03_2021-Injection/>
- OWASP Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html>
- CWE-89: <https://cwe.mitre.org/data/definitions/89.html>
