// Input validation for the fixed app.
//
// Every request body is parsed against an explicit schema before it reaches
// any logic. Unknown fields are dropped, types are enforced, and lengths are
// bounded, so downstream code always works with well-formed data. The bounded
// `body` length is also part of the XSS defence (see docs/writeup/stored-xss.md):
// the real protection is escaping on output, but there is no reason to store
// unbounded input.

import { z } from "zod";
import { ApiError } from "./errors";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, - and _"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().max(10_000, "Body is too long"),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(400, "Invalid request", result.error.flatten().fieldErrors);
  }
  return result.data;
}
