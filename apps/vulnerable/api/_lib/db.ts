// Database access for the vulnerable app.
//
// Queries are sent as raw SQL strings with no bound parameters, and call sites
// build those strings with concatenation. This is the root cause of the SQL
// injection demo (docs/writeup/sql-injection.md); the fixed app uses a query
// builder with bound parameters instead.

import { Pool } from "pg";

const globalForPg = globalThis as unknown as { __pgPool?: Pool };

const pool =
  globalForPg.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

if (!globalForPg.__pgPool) globalForPg.__pgPool = pool;

// The most recent statement, echoed back by the verbose error handler.
export const debugState: { lastSql: string | null } = { lastSql: null };

/** Run a raw SQL string and return the rows. No parameters — by design. */
export async function rawQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  debugState.lastSql = sql;
  const result = await pool.query(sql);
  return result.rows as T[];
}
