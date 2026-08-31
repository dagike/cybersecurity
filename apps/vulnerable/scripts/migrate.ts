// Applies migrations/schema.sql to the database in DATABASE_URL.
// Run with: npm run migrate:vuln

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const schemaPath = fileURLToPath(new URL("../migrations/schema.sql", import.meta.url));

const client = new Client({ connectionString });
await client.connect();
try {
  const sql = await readFile(schemaPath, "utf8");
  await client.query(sql);
  console.log("schema applied");
} finally {
  await client.end();
}
