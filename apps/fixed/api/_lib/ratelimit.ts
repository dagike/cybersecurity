// Rate limiting for the fixed app.
//
// Two layers:
//  - checkEdgeRateLimit runs in middleware.ts for every request (platform-level
//    guard on the isolated Neon / Upstash resources).
//  - checkLoginRateLimit runs inside the login handler, keyed by IP + username,
//    to cap credential guessing (see docs/writeup/broken-authentication.md).
//
// If the Upstash env vars are absent (local dev), limiting is skipped.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const enabled =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = enabled ? Redis.fromEnv() : null;

const edgeGlobal = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60 s"), prefix: "rl:global" })
  : null;
const edgeAuth = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "rl:auth" })
  : null;
const login = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "rl:login" })
  : null;

export async function checkEdgeRateLimit(ip: string, pathname: string): Promise<boolean> {
  const limiter = pathname.startsWith("/api/auth/") ? edgeAuth : edgeGlobal;
  if (!limiter) return true;
  return (await limiter.limit(ip)).success;
}

export async function checkLoginRateLimit(key: string): Promise<boolean> {
  if (!login) return true;
  return (await login.limit(key)).success;
}
