import { useState } from "react";

// Shown when the demo is enabled but the visitor has not passed the shared
// password gate. Posting the correct password sets the access cookie; the
// caller then re-checks and renders the app.

export function GateScreen({ onPassed }: { onPassed: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect demo password.");
        return;
      }
      onPassed();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1>Insecure demo</h1>
      <p>
        This is a deliberately vulnerable teaching application. Access is limited by a shared
        password. If you are reviewing a portfolio, the password was shared with you directly.
      </p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Demo password"
          style={{ display: "block", width: "100%", padding: 8, marginBottom: 12 }}
        />
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
