// Edge rate limiting, applied in middleware.ts before any function runs. This
// is a platform-level control that stands regardless of the app's own bugs:
// even with every vulnerability in place, the demo cannot be hammered or used
// to bootstrap abuse of the underlying Neon / Upstash resources.
//
// If the Upstash env vars are not set (e.g. local dev), limiting is skipped.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let globalLimiter: Ratelimit | null = null;
let authLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = Redis.fromEnv();
  globalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"),
    prefix: "rl:global",
  });
  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:auth",
  });
}

export interface LimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
}

export async function checkRateLimit(ip: string, pathname: string): Promise<LimitResult> {
  const limiter = pathname.startsWith("/api/auth/") ? authLimiter : globalLimiter;
  if (!limiter) return { ok: true, limit: 0, remaining: 0 };
  const res = await limiter.limit(ip);
  return { ok: res.success, limit: res.limit, remaining: res.remaining };
}
