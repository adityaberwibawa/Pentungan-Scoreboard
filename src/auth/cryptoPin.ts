/** Hash PIN dengan salt via expo-crypto (SHA-256). PIN mentah tidak pernah disimpan. */
import * as Crypto from 'expo-crypto';
import { timingSafeEqual } from './pin';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return bytesToHex(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashPin(pin, salt);
  return timingSafeEqual(actual, expectedHash);
}
