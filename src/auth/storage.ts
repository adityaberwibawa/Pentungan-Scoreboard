/** Penyimpanan kredensial auth di SecureStore (Keychain/Keystore). */
import * as SecureStore from 'expo-secure-store';

const KEY_HASH = 'pentung.auth.pinHash';
const KEY_SALT = 'pentung.auth.pinSalt';
const KEY_BIO = 'pentung.auth.bioEnabled';
const KEY_FAILED = 'pentung.auth.failed';
const KEY_LOCK_UNTIL = 'pentung.auth.lockUntil';

const OPTS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function hasPinSetup(): Promise<boolean> {
  const [hash, salt] = await Promise.all([
    SecureStore.getItemAsync(KEY_HASH),
    SecureStore.getItemAsync(KEY_SALT),
  ]);
  return Boolean(hash && salt);
}

export async function loadPinCredentials(): Promise<{ hash: string; salt: string } | null> {
  const [hash, salt] = await Promise.all([
    SecureStore.getItemAsync(KEY_HASH),
    SecureStore.getItemAsync(KEY_SALT),
  ]);
  if (!hash || !salt) return null;
  return { hash, salt };
}

export async function savePinCredentials(hash: string, salt: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEY_HASH, hash, OPTS),
    SecureStore.setItemAsync(KEY_SALT, salt, OPTS),
  ]);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all(
    [KEY_HASH, KEY_SALT, KEY_BIO, KEY_FAILED, KEY_LOCK_UNTIL].map((k) =>
      SecureStore.deleteItemAsync(k).catch(() => undefined),
    ),
  );
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY_BIO)) === '1';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(KEY_BIO, '1', OPTS);
  } else {
    await SecureStore.deleteItemAsync(KEY_BIO).catch(() => undefined);
  }
}

export async function loadThrottle(): Promise<{ failed: number; lockUntil: number | null }> {
  const [f, l] = await Promise.all([
    SecureStore.getItemAsync(KEY_FAILED),
    SecureStore.getItemAsync(KEY_LOCK_UNTIL),
  ]);
  return { failed: Number.parseInt(f ?? '0', 10) || 0, lockUntil: l ? Number(l) || null : null };
}

export async function saveThrottle(failed: number, lockUntil: number | null): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEY_FAILED, String(failed), OPTS),
    lockUntil
      ? SecureStore.setItemAsync(KEY_LOCK_UNTIL, String(lockUntil), OPTS)
      : SecureStore.deleteItemAsync(KEY_LOCK_UNTIL).catch(() => undefined),
  ]);
}
