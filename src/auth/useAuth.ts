/** Session auth in-memory + throttle persist. PIN mentah tidak pernah disimpan. */
import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  AUTO_LOCK_MS,
  lockoutMsFor,
  remainingLockoutMs,
  validatePin,
} from './pin';
import { generateSalt, hashPin, verifyPin } from './cryptoPin';
import {
  clearAuthStorage,
  hasPinSetup,
  isBiometricEnabled,
  loadPinCredentials,
  loadThrottle,
  savePinCredentials,
  saveThrottle,
  setBiometricEnabled,
} from './storage';

interface AuthState {
  initialized: boolean;
  hasPin: boolean;
  locked: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  failedAttempts: number;
  lockUntil: number | null;
  lastBackgroundAt: number | null;
  init: () => Promise<void>;
  setupPin: (pin: string) => Promise<string | null>;
  unlock: (pin: string) => Promise<string | null>;
  unlockWithBiometric: () => Promise<string | null>;
  lock: () => void;
  markBackground: () => void;
  checkAutoLock: () => void;
  setBioEnabled: (enabled: boolean) => Promise<void>;
  resetAppAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  initialized: false,
  hasPin: false,
  locked: true,
  biometricAvailable: false,
  biometricEnabled: false,
  failedAttempts: 0,
  lockUntil: null,
  lastBackgroundAt: null,

  init: async () => {
    const [setup, bioOn, throttle] = await Promise.all([
      hasPinSetup().catch(() => false),
      isBiometricEnabled().catch(() => false),
      loadThrottle().catch(() => ({ failed: 0, lockUntil: null })),
    ]);
    let bioAvailable = false;
    try {
      const [hw, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      bioAvailable = hw && enrolled;
    } catch {
      bioAvailable = false;
    }
    set({
      initialized: true,
      hasPin: setup,
      locked: setup,
      biometricAvailable: bioAvailable,
      biometricEnabled: bioOn && bioAvailable,
      failedAttempts: throttle.failed,
      lockUntil: throttle.lockUntil,
    });
  },

  setupPin: async (pin) => {
    const error = validatePin(pin);
    if (error) return error;
    const salt = await generateSalt();
    const hash = await hashPin(pin.trim(), salt);
    await savePinCredentials(hash, salt);
    await saveThrottle(0, null);
    set({ hasPin: true, locked: false, failedAttempts: 0, lockUntil: null });
    return null;
  },

  unlock: async (pin) => {
    const { failedAttempts, lockUntil } = get();
    if (remainingLockoutMs(lockUntil) > 0) {
      return `Terkunci. Coba lagi dalam ${Math.ceil(remainingLockoutMs(lockUntil) / 1000)} detik.`;
    }
    const error = validatePin(pin);
    if (error) return error;
    const creds = await loadPinCredentials();
    if (!creds) {
      set({ hasPin: false, locked: false });
      return 'PIN belum diatur. Buat PIN dulu.';
    }
    const ok = await verifyPin(pin.trim(), creds.salt, creds.hash);
    if (ok) {
      await saveThrottle(0, null);
      set({ locked: false, failedAttempts: 0, lockUntil: null });
      return null;
    }
    const failed = failedAttempts + 1;
    const ms = lockoutMsFor(failed);
    const nextLock = ms > 0 ? Date.now() + ms : null;
    await saveThrottle(failed, nextLock);
    set({ failedAttempts: failed, lockUntil: nextLock });
    if (nextLock) {
      return `PIN salah. Terkunci ${Math.ceil(ms / 1000)} detik.`;
    }
    return `PIN salah. Sisa ${5 - failed} percobaan sebelum dikunci.`;
  },

  unlockWithBiometric: async () => {
    const { biometricEnabled, lockUntil } = get();
    if (!biometricEnabled) return 'Biometrik belum aktif.';
    if (remainingLockoutMs(lockUntil) > 0) return 'Masih dikunci. Tunggu timer habis.';
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Buka PentungScore',
        fallbackLabel: 'Gunakan PIN',
      });
      if (!res.success) return 'Autentikasi biometrik gagal.';
    } catch {
      return 'Autentikasi biometrik gagal.';
    }
    await saveThrottle(0, null);
    set({ locked: false, failedAttempts: 0, lockUntil: null });
    return null;
  },

  lock: () => set({ locked: true, lastBackgroundAt: null }),

  markBackground: () => set({ lastBackgroundAt: Date.now() }),

  checkAutoLock: () => {
    const { hasPin, lastBackgroundAt } = get();
    if (!hasPin || lastBackgroundAt == null) return;
    if (Date.now() - lastBackgroundAt >= AUTO_LOCK_MS) {
      set({ locked: true, lastBackgroundAt: null });
    }
  },

  setBioEnabled: async (enabled) => {
    await setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled && get().biometricAvailable });
  },

  resetAppAuth: async () => {
    await clearAuthStorage();
    set({ hasPin: false, locked: false, failedAttempts: 0, lockUntil: null, biometricEnabled: false });
  },
}));
