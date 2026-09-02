import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Fixed app schema.
//
// Note ids are random UUIDs, not a sequence, so they cannot be enumerated.
// That is defence in depth — the real IDOR fix is the ownership check in every
// query (see api/notes/[id].ts). Sessions are stored server-side; the cookie
// only carries an opaque token.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("notes_user_id_idx").on(t.userId),
  }),
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Fixed-window rate-limit counters. Kept in this app's own database so the
// fixed app needs no external cache service. Rows are cheap and short-lived;
// see api/_lib/ratelimit.ts.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
