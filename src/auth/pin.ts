/** Validasi PIN + kebijakan lockout. Murni, bisa diuji unit. */

export const PIN_LENGTH = 6;
export const MAX_ATTEMPTS = 5;
export const BASE_LOCKOUT_MS = 30_000;
export const AUTO_LOCK_MS = 60_000;

/** Validasi format PIN. Kembalikan pesan Indonesia atau null bila valid. */
export function validatePin(raw: string): string | null {
  const pin = raw.trim();
  if (!pin) return 'PIN tidak boleh kosong.';
  if (!/^\d+$/.test(pin)) return 'PIN hanya boleh berisi angka.';
  if (pin.length !== PIN_LENGTH) return `PIN harus tepat ${PIN_LENGTH} digit.`;
  return null;
}

/** Durasi kunci (ms) berdasarkan jumlah gagal beruntun. 0 = belum dikunci. */
export function lockoutMsFor(failedAttempts: number): number {
  if (failedAttempts < MAX_ATTEMPTS) return 0;
  const steps = failedAttempts - MAX_ATTEMPTS;
  return BASE_LOCKOUT_MS * 2 ** Math.min(steps, 4);
}

/** Sisa waktu kunci (ms). 0 bila tidak dikunci / sudah kedaluwarsa. */
export function remainingLockoutMs(lockUntil: number | null, now = Date.now()): number {
  if (!lockUntil) return 0;
  return Math.max(0, lockUntil - now);
}

/** Bandingkan dua string tanpa bocor timing (untuk hash). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
