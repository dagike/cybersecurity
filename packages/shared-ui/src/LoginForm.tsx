// Username + password form used for both login and registration. The parent
// supplies the submit handler and any error string returned by the API.

import { useState } from "react";

export interface CredentialsFormProps {
  submitLabel: string;
  onSubmit: (username: string, password: string) => void | Promise<void>;
  error?: string | null;
  busy?: boolean;
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px",
  marginTop: 4,
  marginBottom: 12,
  boxSizing: "border-box",
};

export function CredentialsForm({ submitLabel, onSubmit, error, busy }: CredentialsFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(username, password);
      }}
      style={{ maxWidth: 320 }}
    >
      <label>
        Username
        <input
          style={fieldStyle}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </label>
      <label>
        Password
        <input
          style={fieldStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error ? (
        <p style={{ color: "#b91c1c", marginTop: 0 }} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy}>
        {busy ? "…" : submitLabel}
      </button>
    </form>
  );
}

export function LoginForm(props: Omit<CredentialsFormProps, "submitLabel">) {
  return <CredentialsForm submitLabel="Log in" {...props} />;
}

export function RegisterForm(props: Omit<CredentialsFormProps, "submitLabel">) {
  return <CredentialsForm submitLabel="Create account" {...props} />;
}
