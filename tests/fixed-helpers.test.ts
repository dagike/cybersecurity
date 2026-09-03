import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../apps/fixed/api/_lib/password";

// Runs with no infrastructure. Confirms the fixed app's password helper does
// what the broken-auth writeup claims.
describe("fixed password helper", () => {
  it("produces a verifiable argon2id hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("s3cret");
    expect(await verifyPassword(hash, "s3cr3t")).toBe(false);
  });

  it("salts — the same password hashes differently each time", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toEqual(b);
  });
});
