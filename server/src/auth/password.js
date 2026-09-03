import argon2 from 'argon2';

/** Paramètres OWASP (2024) pour Argon2id. */
const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export const hashPassword = (plain) => argon2.hash(plain, OPTIONS);

export async function verifyPassword(hash, plain) {
  if (!hash) return false;
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
