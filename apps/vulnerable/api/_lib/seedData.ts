// Fake seed data for the vulnerable app. Everything here is invented — no real
// people, emails, or passwords. The weak, well-known passwords are part of the
// broken-authentication demo (docs/writeup/broken-authentication.md).

import { createHash } from "node:crypto";

export interface SeedUser {
  username: string;
  password: string;
  isAdmin: boolean;
}

export const SEED_USERS: SeedUser[] = [
  { username: "alice", password: "password123", isAdmin: false },
  { username: "bob", password: "bob12345", isAdmin: false },
  { username: "carol", password: "sunshine", isAdmin: false },
  { username: "admin", password: "admin", isAdmin: true },
];

export const SEED_NOTES: Record<string, Array<{ title: string; body: string }>> = {
  alice: [
    { title: "Grocery list", body: "Oat milk, bread, tomatoes, coffee." },
    { title: "Book ideas", body: "A short story about a lighthouse keeper." },
  ],
  bob: [
    { title: "Weekend plans", body: "Bike ride Saturday morning, then fix the fence." },
    { title: "Gift ideas for Carol", body: "She mentioned a pottery class." },
  ],
  carol: [{ title: "Recipe", body: "Lemon pasta: zest, juice, parmesan, black pepper." }],
  admin: [
    {
      title: "Internal: demo credentials",
      body: "Reminder — all accounts here use placeholder passwords. Rotate before any real use.",
    },
  ],
};

/** Unsalted MD5 — deliberately weak (see the broken-auth writeup). */
export function weakHash(password: string): string {
  return createHash("md5").update(password).digest("hex");
}

type SqlExec = (text: string, params: unknown[]) => Promise<{ rows: Array<{ id: string }> }>;

/** Wipes and rebuilds the fake data. Shared by the seed script and the cron. */
export async function applySeed(exec: SqlExec): Promise<void> {
  await exec("TRUNCATE notes, users RESTART IDENTITY CASCADE", []);

  for (const user of SEED_USERS) {
    const { rows } = await exec(
      "INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id",
      [user.username, weakHash(user.password), user.isAdmin],
    );
    const userId = rows[0]!.id;

    for (const note of SEED_NOTES[user.username] ?? []) {
      await exec("INSERT INTO notes (user_id, title, body) VALUES ($1, $2, $3)", [
        userId,
        note.title,
        note.body,
      ]);
    }
  }
}
