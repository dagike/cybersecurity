// List of the current user's notes. Rendering of a single note's body is left
// to each app's page (the two apps differ deliberately in how they do it), so
// this component only shows titles and metadata.

import type { Note } from "./types";

export interface NoteListProps {
  notes: Note[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 0",
  borderBottom: "1px solid #f0f0f0",
};

export function NoteList({ notes, selectedId, onSelect, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return <p style={{ color: "#6b7280" }}>No notes yet.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {notes.map((note) => (
        <li key={note.id} style={rowStyle}>
          <button
            type="button"
            onClick={() => onSelect(note.id)}
            style={{
              flex: 1,
              textAlign: "left",
              fontWeight: note.id === selectedId ? 700 : 400,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {note.title || "(untitled)"}
          </button>
          <span style={{ color: "#9ca3af", fontSize: 12 }}>#{note.id}</span>
          {onDelete && (
            <button type="button" onClick={() => onDelete(note.id)}>
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
