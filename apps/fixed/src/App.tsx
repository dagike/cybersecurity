import { Layout, type User } from "@demo/shared-ui";
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { api } from "./lib/api";
import { AuthPages } from "./pages/AuthPages";
import { NotesPage } from "./pages/NotesPage";

type Status = { kind: "loading" } | { kind: "ready"; user: User | null };

export function App() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const bootstrap = useCallback(async () => {
    try {
      const { user } = await api.me();
      setStatus({ kind: "ready", user });
    } catch {
      setStatus({ kind: "ready", user: null });
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status.kind === "loading") return null;
  const { user } = status;

  return (
    <BrowserRouter>
      <Layout
        title="Notes"
        username={user?.username ?? null}
        onLogout={async () => {
          await api.logout();
          await bootstrap();
        }}
        navLinks={[{ href: "/", label: "Notes" }]}
      >
        <Routes>
          <Route
            path="/"
            element={user ? <NotesPage /> : <AuthPages onAuthed={() => void bootstrap()} />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
