// Password hashing for the fixed app.
//
// argon2id with parameters in the range OWASP recommends. The hash is not
// reversible, each hash is uniquely salted, and verification is constant time,
// so a database leak does not hand over usable passwords and the stored value
// cannot be compared byte-for-byte by an attacker. Contrast with the
// vulnerable app's unsalted MD5.

import { hash, verify } from "@node-rs/argon2";

const OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  return verify(storedHash, plain, OPTIONS);
}
