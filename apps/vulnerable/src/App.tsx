import { DemoBanner, Layout, type User } from "@demo/shared-ui";
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { api } from "./lib/api";
import { AuthPages } from "./pages/AuthPages";
import { GateScreen } from "./pages/GateScreen";
import { NotesPage } from "./pages/NotesPage";

type Status =
  | { kind: "loading" }
  | { kind: "gate" }
  | { kind: "ready"; user: User | null };

// Added in a later commit.
const AttackConsole = () => <p>Attack console (coming soon).</p>;

export function App() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const bootstrap = useCallback(async () => {
    try {
      const { user } = await api.me();
      setStatus({ kind: "ready", user });
    } catch (err) {
      const status = (err as { status?: number }).status;
      const code = (err as { body?: { error?: string } }).body?.error;
      if (status === 403 && code === "gate_required") {
        setStatus({ kind: "gate" });
      } else {
        setStatus({ kind: "ready", user: null });
      }
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status.kind === "loading") return <DemoBanner />;
  if (status.kind === "gate") {
    return (
      <>
        <DemoBanner />
        <GateScreen onPassed={() => void bootstrap()} />
      </>
    );
  }

  const { user } = status;

  return (
    <BrowserRouter>
      <Layout
        title="Notes (insecure demo)"
        banner={<DemoBanner />}
        username={user?.username ?? null}
        onLogout={async () => {
          await api.logout();
          await bootstrap();
        }}
        navLinks={[
          { href: "/", label: "Notes" },
          { href: "/attack", label: "Attack console" },
        ]}
      >
        <Routes>
          <Route
            path="/"
            element={user ? <NotesPage /> : <AuthPages onAuthed={() => void bootstrap()} />}
          />
          <Route path="/attack" element={<AttackConsole />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
