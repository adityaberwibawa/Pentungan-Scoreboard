/** Store Zustand untuk status kunci aplikasi (biometrik + PIN, lokal offline). */
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { create } from 'zustand';
import {
  generateSalt,
  hashPin,
  lockoutDurationMs,
  validatePin,
  verifyPin,
} from './pin';
import { secureAuth } from './secure';

export type AuthStatus = 'loading' | 'setup' | 'locked' | 'unlocked';

interface AuthState {
  status: AuthStatus;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricLabel: string;
  failedAttempts: number;
  lockedUntil: number | null;
  lastBioSuccessAt: number | null;
  init: () => Promise<void>;
  setupPin: (pin: string) => Promise<string | null>;
  unlockWithPin: (pin: string) => Promise<string | null>;
  unlockWithBiometric: () => Promise<string | null>;
  probeBiometric: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<string | null>;
  changePin: (oldPin: string, newPin: string) => Promise<string | null>;
  changePinAfterBiometric: (newPin: string) => Promise<string | null>;
  lock: () => void;
  resetAll: (wipeDb: () => Promise<void>) => Promise<void>;
}

async function probeDeviceBiometric(): Promise<{ available: boolean; label: string }> {
  try {
    if (Platform.OS === 'web') return { available: false, label: 'Biometrik' };
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync().catch(() => false),
      LocalAuthentication.isEnrolledAsync().catch(() => false),
      LocalAuthentication.supportedAuthenticationTypesAsync().catch(
        () => [] as LocalAuthentication.AuthenticationType[],
      ),
    ]);
    const available = hasHardware && enrolled && types.length > 0;
    const label = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? Platform.OS === 'ios'
        ? 'Face ID'
        : 'Face Unlock'
      : types.includes(LocalAuthentication.AuthenticationType.IRIS)
        ? 'Iris'
        : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ? 'Sidik jari'
          : 'Biometrik';
    return { available, label };
  } catch {
    return { available: false, label: 'Biometrik' };
  }
}

function remainingLockoutMs(lockedUntil: number | null): number {
  if (!lockedUntil) return 0;
  return Math.max(0, lockedUntil - Date.now());
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  biometricEnabled: false,
  biometricAvailable: false,
  biometricLabel: 'Biometrik',
  failedAttempts: 0,
  lockedUntil: null,
  lastBioSuccessAt: null,

  init: async () => {
    const [pinHash, bioEnabled, failed, lockedUntil] = await Promise.all([
      secureAuth.getPinHash(),
      secureAuth.getBioEnabled(),
      secureAuth.getFailedAttempts(),
      secureAuth.getLockedUntil(),
    ]);
    const { available, label } = await probeDeviceBiometric();
    // Lockout kedaluwarsa → reset counter.
    let cleanFailed = failed;
    let cleanLocked: number | null = lockedUntil;
    if (lockedUntil && Date.now() >= lockedUntil) {
      cleanFailed = 0;
      cleanLocked = null;
      await Promise.all([
        secureAuth.setFailedAttempts(0),
        secureAuth.setLockedUntil(null),
      ]);
    }
    set({
      status: pinHash ? 'locked' : 'setup',
      biometricEnabled: bioEnabled && available,
      biometricAvailable: available,
      biometricLabel: label,
      failedAttempts: cleanFailed,
      lockedUntil: cleanLocked,
    });
  },

  probeBiometric: async () => {
    const { available, label } = await probeDeviceBiometric();
    set((s) => ({
      biometricAvailable: available,
      biometricLabel: label,
      biometricEnabled: s.biometricEnabled && available,
    }));
  },

  setupPin: async (pin) => {
    const error = validatePin(pin);
    if (error) return error;
    const salt = await generateSalt();
    const hash = await hashPin(pin, salt);
    await secureAuth.savePin(hash, salt);
    await Promise.all([
      secureAuth.setFailedAttempts(0),
      secureAuth.setLockedUntil(null),
    ]);
    set({ status: 'unlocked', failedAttempts: 0, lockedUntil: null });
    return null;
  },

  unlockWithPin: async (pin) => {
    const { failedAttempts, lockedUntil } = get();
    const remaining = remainingLockoutMs(lockedUntil);
    if (remaining > 0) {
      return `Terkunci. Coba lagi dalam ${Math.ceil(remaining / 1000)} detik.`;
    }
    const [salt, expectedHash] = await Promise.all([
      secureAuth.getPinSalt(),
      secureAuth.getPinHash(),
    ]);
    if (!salt || !expectedHash) {
      set({ status: 'setup' });
      return 'Belum ada PIN. Buat PIN baru.';
    }
    const ok = await verifyPin(pin, salt, expectedHash);
    if (ok) {
      await Promise.all([
        secureAuth.setFailedAttempts(0),
        secureAuth.setLockedUntil(null),
      ]);
      set({ status: 'unlocked', failedAttempts: 0, lockedUntil: null });
      return null;
    }
    const nextFailed = failedAttempts + 1;
    const duration = lockoutDurationMs(nextFailed);
    const nextLocked = duration > 0 ? Date.now() + duration : null;
    await Promise.all([
      secureAuth.setFailedAttempts(nextFailed),
      secureAuth.setLockedUntil(nextLocked),
    ]);
    set({ failedAttempts: nextFailed, lockedUntil: nextLocked });
    if (nextLocked) {
      return `PIN salah. Terkunci ${Math.ceil(duration / 1000)} detik.`;
    }
    const sisa = 5 - nextFailed;
    return sisa > 0
      ? `PIN salah. ${sisa} percobaan tersisa sebelum terkunci.`
      : 'PIN salah.';
  },

  unlockWithBiometric: async () => {
    const { biometricEnabled, lockedUntil } = get();
    if (remainingLockoutMs(lockedUntil) > 0) {
      return `Terkunci. Coba lagi dalam ${Math.ceil(remainingLockoutMs(lockedUntil) / 1000)} detik.`;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Buka PentungScore',
        cancelLabel: 'Batal',
        disableDeviceFallback: true,
      });
      if (result.success) {
        await Promise.all([
          secureAuth.setFailedAttempts(0),
          secureAuth.setLockedUntil(null),
        ]);
        set({
          status: 'unlocked',
          failedAttempts: 0,
          lockedUntil: null,
          lastBioSuccessAt: Date.now(),
        });
        return null;
      }
      if (!biometricEnabled) return 'Biometrik tidak aktif. Gunakan PIN.';
      return 'Autentikasi biometrik gagal atau dibatalkan.';
    } catch {
      return 'Biometrik tidak tersedia di perangkat ini.';
    }
  },

  setBiometricEnabled: async (enabled) => {
    const { biometricAvailable } = get();
    if (enabled && !biometricAvailable) {
      return 'Perangkat belum memiliki biometrik yang terdaftar.';
    }
    if (enabled) {
      // Verifikasi kepemilikan sebelum mengaktifkan: wajib lolos prompt.
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Aktifkan biometrik',
          cancelLabel: 'Batal',
          disableDeviceFallback: true,
        });
        if (!result.success) return 'Verifikasi biometrik gagal. Belum diaktifkan.';
      } catch {
        return 'Biometrik tidak tersedia di perangkat ini.';
      }
    }
    await secureAuth.setBioEnabled(enabled);
    set({ biometricEnabled: enabled });
    return null;
  },

  changePin: async (oldPin, newPin) => {
    const { lastBioSuccessAt } = get();
    const bioFresh = lastBioSuccessAt != null && Date.now() - lastBioSuccessAt < 60_000;
    const newError = validatePin(newPin);
    if (newError) return newError;
    if (!bioFresh) {
      const [salt, expectedHash] = await Promise.all([
        secureAuth.getPinSalt(),
        secureAuth.getPinHash(),
      ]);
      if (!salt || !expectedHash) {
        set({ status: 'setup' });
        return 'Belum ada PIN. Buat PIN baru.';
      }
      const ok = await verifyPin(oldPin, salt, expectedHash);
      if (!ok) return 'PIN lama salah.';
    }
    const salt = await generateSalt();
    const hash = await hashPin(newPin, salt);
    await secureAuth.savePin(hash, salt);
    set({ lastBioSuccessAt: null });
    return null;
  },

  changePinAfterBiometric: async (newPin) => {
    const newError = validatePin(newPin);
    if (newError) return newError;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifikasi untuk ubah PIN',
        cancelLabel: 'Batal',
        disableDeviceFallback: true,
      });
      if (!result.success) return 'Verifikasi biometrik gagal.';
    } catch {
      return 'Biometrik tidak tersedia di perangkat ini.';
    }
    const salt = await generateSalt();
    const hash = await hashPin(newPin, salt);
    await secureAuth.savePin(hash, salt);
    set({ lastBioSuccessAt: null });
    return null;
  },

  lock: () => {
    set((s) => (s.status === 'unlocked' ? { status: 'locked' } : s));
  },

  resetAll: async (wipeDb) => {
    await wipeDb();
    await secureAuth.clearAll();
    set({
      status: 'setup',
      biometricEnabled: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastBioSuccessAt: null,
    });
  },
}));
