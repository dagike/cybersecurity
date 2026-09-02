import { LoginForm, RegisterForm, type ApiError } from "@demo/shared-ui";
import { useState } from "react";
import { api } from "../lib/api";

export function AuthPages({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onAuthed();
    } catch (err) {
      setError((err as ApiError).message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 320 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setMode("login")} disabled={mode === "login"}>
          Log in
        </button>
        <button type="button" onClick={() => setMode("register")} disabled={mode === "register"}>
          Register
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Seeded accounts: <code>alice / password123</code>, <code>bob / bob12345</code>,{" "}
        <code>carol / sunshine</code>.
      </p>

      {mode === "login" ? (
        <LoginForm error={error} busy={busy} onSubmit={(u, p) => run(() => api.login(u, p))} />
      ) : (
        <RegisterForm
          error={error}
          busy={busy}
          onSubmit={(u, p) => run(() => api.register(u, p))}
        />
      )}
    </div>
  );
}
