// Resets the vulnerable database to a known set of fake data.
// Run with: npm run seed:vuln

import "dotenv/config";
import { Client } from "pg";
import { SEED_NOTES, SEED_USERS, weakHash } from "../api/_lib/seedData";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();
try {
  await client.query("TRUNCATE notes, users RESTART IDENTITY CASCADE");

  for (const user of SEED_USERS) {
    const { rows } = await client.query<{ id: string }>(
      "INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id",
      [user.username, weakHash(user.password), user.isAdmin],
    );
    const userId = rows[0]!.id;

    for (const note of SEED_NOTES[user.username] ?? []) {
      await client.query(
        "INSERT INTO notes (user_id, title, body) VALUES ($1, $2, $3)",
        [userId, note.title, note.body],
      );
    }
  }

  console.log(`seeded ${SEED_USERS.length} users`);
} finally {
  await client.end();
}
