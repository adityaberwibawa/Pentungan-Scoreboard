import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
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

type Step = 'menu' | 'verify-old' | 'new-pin' | 'confirm-new';

/** Pengaturan keamanan: ubah PIN (wajib PIN lama/biometrik), toggle biometrik, reset. */
export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const biometricAvailable = useAuthStore((s) => s.biometricAvailable);
  const biometricLabel = useAuthStore((s) => s.biometricLabel);
  const changePin = useAuthStore((s) => s.changePin);
  const changePinAfterBiometric = useAuthStore((s) => s.changePinAfterBiometric);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const unlockWithBiometric = useAuthStore((s) => s.unlockWithBiometric);
  const resetAll = useAuthStore((s) => s.resetAll);

  const [step, setStep] = useState<Step>('menu');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const resetFlow = () => {
    setStep('menu');
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
  };

  const submitOld = async (value: string) => {
    setOldPin(value);
    if (value.length === PIN_LENGTH) {
      setStep('new-pin');
    }
  };

  const submitNew = (value: string) => {
    setNewPin(value);
    if (value.length === PIN_LENGTH) setStep('confirm-new');
  };

  const submitConfirm = async (value: string) => {
    setConfirmPin(value);
    if (value.length !== PIN_LENGTH) return;
    if (value !== newPin) {
      setError('Konfirmasi tidak cocok. Ulangi PIN baru.');
      setNewPin('');
      setConfirmPin('');
      setStep('new-pin');
      return;
    }
    setBusy(true);
    const err = await changePin(oldPin, value);
    setBusy(false);
    if (err) {
      setError(err);
      // PIN lama salah → kembali ke verifikasi.
      if (err === 'PIN lama salah.') {
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setStep('verify-old');
      } else {
        setNewPin('');
        setConfirmPin('');
        setStep('new-pin');
      }
      return;
    }
    Alert.alert('Berhasil', 'PIN berhasil diubah.');
    resetFlow();
  };

  const changeViaBio = async () => {
    if (newPin.length !== PIN_LENGTH) {
      setError(`Isi PIN baru ${PIN_LENGTH} digit dulu di bawah, lalu verifikasi biometrik.`);
      return;
    }
    setBioBusy(true);
    const err = await changePinAfterBiometric(newPin);
    setBioBusy(false);
    if (err) {
      setError(err);
      return;
    }
    Alert.alert('Berhasil', 'PIN berhasil diubah via biometrik.');
    resetFlow();
  };

  const toggleBio = async (next: boolean) => {
    const err = await setBiometricEnabled(next);
    if (err) Alert.alert('Biometrik', err);
  };

  const verifyBioThenChange = async () => {
    setBioBusy(true);
    setError(null);
    const err = await unlockWithBiometric();
    setBioBusy(false);
    if (err) {
      setError(err);
      return;
    }
    // Biometrik fresh 60 detik → changePin boleh tanpa PIN lama.
    setOldPin('');
    setStep('new-pin');
    // Tandai: changePin akan melihat lastBioSuccessAt. Simulasikan dengan
    // memanggil changePin AFTER user isi PIN baru — verifikasi bio sudah fresh.
    // Untuk itu kita set oldPin ke '' dan biarkan changePin lolos via bioFresh.
  };

  const doReset = async () => {
    await resetAll(async () => {
      await wipeAllData();
    });
    await useStore.getState().loadAll().catch(() => undefined);
    setResetStep(0);
    setResetConfirmText('');
    router.replace('/setup-pin');
  };

  return (
    <View style={Common.screen}>
      <AppHeader title="Keamanan" subtitle="PIN & biometrik" showBack />
      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={Common.content}>
          {step === 'menu' ? (
            <View style={styles.stack}>
              <View style={styles.card}>
                <View style={styles.row}>
                  <MaterialIcons name="fingerprint" size={24} color={Colors.accent} />
                  <View style={styles.rowText}>
                    <Text style={styles.cardTitle}>{biometricLabel}</Text>
                    <Text style={styles.cardDesc}>
                      {biometricAvailable
                        ? 'Buka kunci lebih cepat tanpa mengetik PIN.'
                        : 'Tidak tersedia — perangkat belum mendaftarkan biometrik.'}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel={`Aktifkan ${biometricLabel}`}
                    value={biometricEnabled}
                    disabled={!biometricAvailable}
                    onValueChange={toggleBio}
                    trackColor={{ false: Colors.raised, true: Colors.accent }}
                    thumbColor={biometricEnabled ? Colors.onAccent : Colors.muted}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.cardTitle}>
                  Ubah PIN
                </Text>
                <Text style={styles.cardDesc}>
                  Wajib verifikasi PIN lama. Kalau lupa, satu-satunya jalan adalah reset data.
                </Text>
                <AppButton label="Ubah PIN dengan PIN lama" onPress={() => setStep('verify-old')} />
                {biometricEnabled ? (
                  <AppButton
                    label={bioBusy ? 'Memindai…' : 'Lupa PIN lama? Verifikasi biometrik'}
                    variant="ghost"
                    disabled={bioBusy}
                    onPress={verifyBioThenChange}
                  />
                ) : null}
                {error ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
              </View>

              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.dangerTitle}>
                  Zona berbahaya
                </Text>
                <Text style={styles.cardDesc}>
                  Reset menghapus SEMUA pemain, sesi, dan skor lokal secara permanen.
                </Text>
                <AppButton label="Reset semua data" variant="danger" onPress={() => setResetStep(1)} />
              </View>
            </View>
          ) : null}

          {step === 'verify-old' ? (
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                Masukkan PIN lama
              </Text>
              <PinPad value={oldPin} onChange={submitOld} />
              <AppButton label="Batal" variant="ghost" onPress={resetFlow} />
            </View>
          ) : null}

          {step === 'new-pin' ? (
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                PIN baru ({PIN_LENGTH} digit)
              </Text>
              <PinPad value={newPin} onChange={submitNew} />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              {biometricEnabled ? (
                <AppButton
                  label={bioBusy ? 'Memindai…' : 'Verifikasi biometrik & simpan'}
                  variant="ghost"
                  disabled={bioBusy || newPin.length !== PIN_LENGTH}
                  onPress={changeViaBio}
                />
              ) : null}
              <AppButton label="Batal" variant="ghost" onPress={resetFlow} />
            </View>
          ) : null}

          {step === 'confirm-new' ? (
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.cardTitle}>
                Ulangi PIN baru
              </Text>
              <PinPad value={confirmPin} onChange={submitConfirm} disabled={busy} />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <AppButton label="Batal" variant="ghost" onPress={resetFlow} />
            </View>
          ) : null}
        </View>
      </View>

      <ConfirmSheet
        visible={resetStep === 1}
        title="Reset semua data?"
        message="Tindakan ini menghapus SEMUA pemain, sesi, dan skor lokal secara permanen. Tidak bisa dikembalikan."
        confirmLabel="Lanjut"
        destructive
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />
      <ConfirmSheet
        visible={resetStep === 2}
        title="Konfirmasi terakhir"
        message='Ketik "HAPUS" untuk menghapus semua data dan membuat PIN baru.'
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
      </ConfirmSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  stack: { gap: 12 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  cardTitle: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 16 },
  dangerTitle: { color: Colors.danger, fontFamily: FontFamily.display, fontSize: 16 },
  cardDesc: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 13, lineHeight: 18 },
  error: { color: Colors.danger, fontFamily: FontFamily.bodyMedium, fontSize: 13, textAlign: 'center' },
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
