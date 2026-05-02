import { hash, verify } from "https://deno.land/x/scrypt/mod.ts";

/**
 * Hash a plaintext password using scrypt.
 * Returns the scrypt hash string.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return await hash(plaintext);
}

/**
 * Verify a plaintext password against a scrypt hash.
 * Returns true if the password matches.
 */
export async function verifyPassword(
  plaintext: string,
  hashedPassword: string,
): Promise<boolean> {
  return await verify(plaintext, hashedPassword);
}
