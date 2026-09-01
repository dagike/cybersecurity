// Database access for the fixed app. Every query goes through Drizzle's query
// builder or its `sql` tagged template, so values are always sent as bound
// parameters — user input can never change the shape of a query. Contrast
// with the vulnerable app's api/_lib/db.ts.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../drizzle/schema";

const sql = neon(process.env.DATABASE_URL ?? "");

export const db = drizzle(sql, { schema });
export const { users, notes, sessions } = schema;
