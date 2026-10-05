import {
  BASE_LOCKOUT_MS,
  MAX_PIN_ATTEMPTS,
  PIN_LENGTH,
  lockoutDurationMs,
  validatePin,
} from '../auth/pin';

describe('validatePin (6 digit tetap)', () => {
  it('menerima tepat 6 digit angka', () => {
    expect(validatePin('123456')).toBeNull();
    expect(validatePin('000000')).toBeNull();
  });

  it('menolak non-angka dan panjang salah', () => {
    expect(validatePin('12345')).toBe(`PIN harus tepat ${PIN_LENGTH} digit.`);
    expect(validatePin('1234567')).toBe(`PIN harus tepat ${PIN_LENGTH} digit.`);
    expect(validatePin('12a456')).toBe('PIN hanya boleh berisi angka.');
    expect(validatePin('')).toBe('PIN hanya boleh berisi angka.');
  });
});

describe('lockoutDurationMs (eksponensial)', () => {
  it('nol sebelum batas', () => {
    expect(lockoutDurationMs(0)).toBe(0);
    expect(lockoutDurationMs(MAX_PIN_ATTEMPTS - 1)).toBe(0);
  });

  it('30 dtk saat menyentuh batas, lalu ganda', () => {
    expect(lockoutDurationMs(MAX_PIN_ATTEMPTS)).toBe(BASE_LOCKOUT_MS);
    expect(lockoutDurationMs(MAX_PIN_ATTEMPTS + 1)).toBe(BASE_LOCKOUT_MS * 2);
    expect(lockoutDurationMs(MAX_PIN_ATTEMPTS + 2)).toBe(BASE_LOCKOUT_MS * 4);
  });
});
