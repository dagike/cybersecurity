// Resets the fixed database to a known set of fake data.
// Run with: npm run seed:fixed

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, notes, users } from "../api/_lib/db";
import { hashPassword } from "../api/_lib/password";
import { SEED_NOTES, SEED_USERS } from "../api/_lib/seedData";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

await db.execute(sql`TRUNCATE notes, users, sessions RESTART IDENTITY CASCADE`);

for (const user of SEED_USERS) {
  const [row] = await db
    .insert(users)
    .values({
      username: user.username,
      passwordHash: await hashPassword(user.password),
      isAdmin: user.isAdmin,
    })
    .returning({ id: users.id });

  for (const note of SEED_NOTES[user.username] ?? []) {
    await db.insert(notes).values({ userId: row!.id, title: note.title, body: note.body });
  }
}

console.log(`seeded ${SEED_USERS.length} users`);
