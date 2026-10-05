/** Validasi + hashing PIN 6 digit. Pure logic agar mudah di-unit-test. */
import * as Crypto from 'expo-crypto';

export const PIN_LENGTH = 6;
export const MAX_PIN_ATTEMPTS = 5;
export const BASE_LOCKOUT_MS = 30_000;

/** PIN harus tepat 6 digit numerik. Return pesan error ID atau null bila valid. */
export function validatePin(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'PIN hanya boleh berisi angka.';
  if (pin.length !== PIN_LENGTH) return `PIN harus tepat ${PIN_LENGTH} digit.`;
  return null;
}

/** Hitung durasi lockout eksponensial setelah melewati batas percobaan. */
export function lockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts < MAX_PIN_ATTEMPTS) return 0;
  const steps = failedAttempts - MAX_PIN_ATTEMPTS;
  return BASE_LOCKOUT_MS * 2 ** steps;
}

export async function generateSalt(byteLength = 16): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const actual = await hashPin(pin, salt);
  return actual === expectedHash;
}
