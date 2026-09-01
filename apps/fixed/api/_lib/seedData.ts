// Fake seed data for the fixed app. Invented data only — no real people or
// credentials. Kept parallel to the vulnerable app's seed so the two demos
// tell the same story, but here the passwords are hashed with argon2id.

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
