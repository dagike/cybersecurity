import type { Note } from "@demo/shared-ui";

export interface NoteRow {
  id: string | number;
  title: string;
  body: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export function toNote(row: NoteRow): Note {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
