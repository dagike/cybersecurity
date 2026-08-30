// Shapes returned by both apps' APIs. The two apps use different id types
// for notes (see docs/writeup/idor.md), so `id` is kept as a string on the
// wire and rendered as-is.

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
