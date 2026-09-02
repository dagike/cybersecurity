import { NoteEditor, NoteList, type ApiError, type Note } from "@demo/shared-ui";
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// The note body is rendered as text (React escapes it), so any markup a note
// contains is shown literally and never executed. See docs/writeup/stored-xss.md.

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { notes } = await api.listNotes();
    setNotes(notes);
  }, []);

  useEffect(() => {
    void refresh().catch((e) => setError((e as ApiError).message));
  }, [refresh]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { notes } = await api.searchNotes(query);
      setNotes(notes);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function save(title: string, body: string) {
    setBusy(true);
    setError(null);
    try {
      if (creating) {
        await api.createNote(title, body);
      } else if (selected) {
        await api.updateNote(selected.id, title, body);
      }
      setCreating(false);
      setSelected(null);
      await refresh();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes by title"
          style={{ flex: 1, padding: 6 }}
        />
        <button type="submit">Search</button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            void refresh();
          }}
        >
          Reset
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setCreating(true);
          setSelected(null);
        }}
        style={{ marginBottom: 12 }}
      >
        New note
      </button>

      <NoteList
        notes={notes}
        selectedId={selected?.id ?? null}
        onSelect={(id) => {
          setCreating(false);
          void api
            .getNote(id)
            .then(({ note }) => setSelected(note))
            .catch((e) => setError((e as ApiError).message));
        }}
        onDelete={async (id) => {
          await api.deleteNote(id);
          if (selected?.id === id) setSelected(null);
          await refresh();
        }}
      />

      <hr style={{ margin: "24px 0" }} />

      {creating ? (
        <NoteEditor busy={busy} onSave={save} onCancel={() => setCreating(false)} />
      ) : selected ? (
        <article>
          <h2>{selected.title}</h2>
          <div style={{ whiteSpace: "pre-wrap" }}>{selected.body}</div>
          <div style={{ marginTop: 16 }}>
            <NoteEditor
              initial={selected}
              busy={busy}
              onSave={save}
              onCancel={() => setSelected(null)}
            />
          </div>
        </article>
      ) : (
        <p style={{ color: "#6b7280" }}>Select a note, or create one.</p>
      )}
    </div>
  );
}
