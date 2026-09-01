// Error handling for the fixed app.
//
// Callers may throw ApiError for an intentional client-facing status. Anything
// else is treated as a bug: the details go to the server log with a request id,
// and the client gets only a generic message plus that id for support. No
// stack traces, query text, or internals cross the wire. Contrast with the
// vulnerable app, which returns the raw error.

import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function withErrors(handler: Handler): Handler {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json({ error: err.message, details: err.details });
        return;
      }
      const requestId = randomUUID();
      console.error(`[${requestId}]`, err);
      res.status(500).json({ error: "Internal Server Error", requestId });
    }
  };
}
