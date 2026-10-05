/** Wrapper SecureStore untuk kredensial auth. Semua rahasia di Keychain/Keystore. */
import * as SecureStore from 'expo-secure-store';

const ACCESSIBLE = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;

export const AuthKeys = {
  pinHash: 'pentung_pin_hash',
  pinSalt: 'pentung_pin_salt',
  bioEnabled: 'pentung_bio_enabled',
  failed: 'pentung_failed',
  lockedUntil: 'pentung_locked_until',
} as const;

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, { keychainAccessible: ACCESSIBLE });
}

async function safeDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Key tidak ada — abaikan.
  }
}

export const secureAuth = {
  async getPinHash(): Promise<string | null> {
    return safeGet(AuthKeys.pinHash);
  },
  async getPinSalt(): Promise<string | null> {
    return safeGet(AuthKeys.pinSalt);
  },
  async savePin(hash: string, salt: string): Promise<void> {
    await safeSet(AuthKeys.pinHash, hash);
    await safeSet(AuthKeys.pinSalt, salt);
  },
  async getBioEnabled(): Promise<boolean> {
    return (await safeGet(AuthKeys.bioEnabled)) === '1';
  },
  async setBioEnabled(enabled: boolean): Promise<void> {
    await safeSet(AuthKeys.bioEnabled, enabled ? '1' : '0');
  },
  async getFailedAttempts(): Promise<number> {
    const raw = await safeGet(AuthKeys.failed);
    const n = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  },
  async setFailedAttempts(n: number): Promise<void> {
    await safeSet(AuthKeys.failed, String(Math.max(0, n)));
  },
  async getLockedUntil(): Promise<number | null> {
    const raw = await safeGet(AuthKeys.lockedUntil);
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  },
  async setLockedUntil(ts: number | null): Promise<void> {
    if (ts == null) {
      await safeDelete(AuthKeys.lockedUntil);
    } else {
      await safeSet(AuthKeys.lockedUntil, String(ts));
    }
  },
  async clearAll(): Promise<void> {
    await Promise.all(Object.values(AuthKeys).map((k) => safeDelete(k)));
  },
};
