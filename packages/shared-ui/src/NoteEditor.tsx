// Create / edit form for a note. The parent owns persistence and any server
// validation error.

import { useEffect, useState } from "react";
import type { Note } from "./types";

export interface NoteEditorProps {
  initial?: Pick<Note, "title" | "body"> | null;
  onSave: (title: string, body: string) => void | Promise<void>;
  onCancel?: () => void;
  error?: string | null;
  busy?: boolean;
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 8,
  marginTop: 4,
  marginBottom: 12,
  boxSizing: "border-box",
};

export function NoteEditor({ initial, onSave, onCancel, error, busy }: NoteEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setBody(initial?.body ?? "");
  }, [initial]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(title, body);
      }}
    >
      <label>
        Title
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Body
        <textarea
          style={{ ...inputStyle, minHeight: 120, fontFamily: "inherit" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      {error ? (
        <p style={{ color: "#b91c1c", marginTop: 0 }} role="alert">
          {error}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Save"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
