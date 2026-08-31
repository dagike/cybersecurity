// Error handling for the vulnerable app.
//
// Every unhandled error is returned to the caller in full: the message, the
// stack trace, and the last SQL statement that ran. That turns any error into
// an information leak about the code, the file layout, and the database schema.
// See docs/writeup/verbose-errors.md — the fixed app returns a generic message
// and a request id instead.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { debugState } from "./db";

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

export function handleError(res: VercelResponse, err: unknown): void {
  const error = err instanceof Error ? err : new Error(String(err));
  res.status(500).json({
    error: error.message,
    stack: error.stack,
    lastQuery: debugState.lastSql,
  });
}

/** Wraps a handler so any thrown error is returned verbatim to the client. */
export function withErrors(handler: Handler): Handler {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      handleError(res, err);
    }
  };
}
