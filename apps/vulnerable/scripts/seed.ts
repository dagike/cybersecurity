// Resets the vulnerable database to a known set of fake data.
// Run with: npm run seed:vuln

import "dotenv/config";
import { Client } from "pg";
import { SEED_USERS, applySeed } from "../api/_lib/seedData.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();
try {
  await applySeed((text, params) => client.query(text, params) as never);
  console.log(`seeded ${SEED_USERS.length} users`);
} finally {
  await client.end();
}
