import type { Note } from "@demo/shared-ui";

interface NoteRow {
  id: string;
  title: string;
  body: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
