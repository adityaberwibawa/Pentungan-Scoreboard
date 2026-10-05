import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppHeader } from '../components/AppHeader';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { PinPad } from '../components/PinPad';
import { Colors, Common, FontFamily, Radius } from '../theme';
import { PIN_LENGTH } from '../auth/pin';
import { useAuthStore } from '../auth/useAuthStore';
import { wipeAllData } from '../db';
import { useStore } from '../store';

/** Layar kunci: biometrik otomatis + fallback PIN + reset destruktif. */
export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((s) => s.status);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const biometricLabel = useAuthStore((s) => s.biometricLabel);
  const failedAttempts = useAuthStore((s) => s.failedAttempts);
  const lockedUntil = useAuthStore((s) => s.lockedUntil);
  const unlockWithPin = useAuthStore((s) => s.unlockWithPin);
  const unlockWithBiometric = useAuthStore((s) => s.unlockWithBiometric);
  const resetAll = useAuthStore((s) => s.resetAll);

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const autoBioFired = useRef(false);

  const remainingMs = lockedUntil ? Math.max(0, lockedUntil - now) : 0;
  const isLockedOut = remainingMs > 0;

  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // Auto-prompt biometrik sekali saat layar muncul.
  useEffect(() => {
    if (biometricEnabled && !autoBioFired.current) {
      autoBioFired.current = true;
      void (async () => {
        setBioBusy(true);
        const err = await unlockWithBiometric();
        setBioBusy(false);
        if (err) setError(err);
      })();
    }
  }, [biometricEnabled, unlockWithBiometric]);

  // Redirect saat sudah unlock (gate _layout juga menjaga).
  useEffect(() => {
    if (status === 'unlocked') router.replace('/(tabs)');
    if (status === 'setup') router.replace('/setup-pin');
  }, [status]);

  const submitPin = async (value: string) => {
    setPin(value);
    setError(null);
    if (value.length !== PIN_LENGTH || isLockedOut) return;
    setBusy(true);
    const err = await unlockWithPin(value);
    setBusy(false);
    if (err) {
      setError(err);
      setPin('');
    }
  };

  const tryBio = async () => {
    setBioBusy(true);
    setError(null);
    const err = await unlockWithBiometric();
    setBioBusy(false);
    if (err) setError(err);
  };

  const doReset = async () => {
    await resetAll(async () => {
      await wipeAllData();
    });
    // Segarkan store skor agar UI kosong.
    await useStore.getState().loadAll().catch(() => undefined);
    setResetStep(0);
    setResetConfirmText('');
    router.replace('/setup-pin');
  };

  return (
    <View style={Common.screen}>
      <AppHeader title="Terkunci" subtitle="PentungScore diproteksi PIN" />
      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={Common.content}>
          <View style={styles.card}>
            <MaterialIcons name="lock" size={40} color={Colors.accent} />
            <Text accessibilityRole="header" style={styles.title}>
              Masukkan PIN
            </Text>
            {failedAttempts > 0 && !isLockedOut ? (
              <Text style={styles.desc}>{failedAttempts}x salah. Hati-hati, 5x salah terkunci.</Text>
            ) : null}
            {isLockedOut ? (
              <Text accessibilityRole="alert" style={styles.error}>
                Terkunci. Coba lagi dalam {Math.ceil(remainingMs / 1000)} detik.
              </Text>
            ) : null}
            <PinPad value={pin} onChange={submitPin} disabled={busy || isLockedOut} />
            {error && !isLockedOut ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            {biometricEnabled ? (
              <AppButton
                label={bioBusy ? 'Memindai…' : `Gunakan ${biometricLabel}`}
                variant="ghost"
                disabled={bioBusy || isLockedOut}
                onPress={tryBio}
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lupa PIN? Reset data"
              accessibilityHint="Menghapus seluruh data lokal dan kunci untuk membuat PIN baru"
              onPress={() => setResetStep(1)}
              style={styles.resetLink}>
              <Text style={styles.resetText}>Lupa PIN? Reset data</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ConfirmSheet
        visible={resetStep === 1}
        title="Reset semua data?"
        message="Lupa PIN hanya bisa dipulihkan dengan reset. SEMUA pemain, sesi, dan skor lokal akan dihapus permanen dan tidak bisa dikembalikan."
        confirmLabel="Lanjut"
        destructive
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />
      <ConfirmSheet
        visible={resetStep === 2}
        title="Konfirmasi terakhir"
        message='Ketik "HAPUS" (huruf besar) untuk menghapus semua data dan membuat PIN baru.'
        confirmLabel="Hapus semua & reset"
        destructive
        onCancel={() => {
          setResetStep(0);
          setResetConfirmText('');
        }}
        onConfirm={() => {
          if (resetConfirmText.trim() === 'HAPUS') void doReset();
        }}>
        <TextInput
          accessibilityLabel="Ketik HAPUS untuk konfirmasi"
          value={resetConfirmText}
          onChangeText={setResetConfirmText}
          autoCapitalize="characters"
          placeholder="HAPUS"
          placeholderTextColor={Colors.muted}
          style={styles.confirmInput}
        />
        {resetConfirmText.length > 0 && resetConfirmText.trim() !== 'HAPUS' ? (
          <Text style={styles.error}>Ketik tepat “HAPUS”.</Text>
        ) : null}
      </ConfirmSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 12,
    alignItems: 'stretch',
  },
  title: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 20, textAlign: 'center' },
  desc: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 13, textAlign: 'center' },
  error: { color: Colors.danger, fontFamily: FontFamily.bodyMedium, fontSize: 13, textAlign: 'center' },
  resetLink: { alignItems: 'center', paddingVertical: 12 },
  resetText: { color: Colors.danger, fontFamily: FontFamily.bodySemi, fontSize: 14 },
  confirmInput: {
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    color: Colors.ink,
    fontFamily: FontFamily.bodySemi,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
});
