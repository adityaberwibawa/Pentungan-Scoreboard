import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppHeader } from '../components/AppHeader';
import { PinPad } from '../components/PinPad';
import { Colors, Common, FontFamily, Radius } from '../theme';
import { PIN_LENGTH } from '../auth/pin';
import { useAuthStore } from '../auth/useAuthStore';

/** Setup awal: buat PIN 6 digit 2x konfirmasi, lalu tawarkan biometrik. */
export default function SetupPinScreen() {
  const insets = useSafeAreaInsets();
  const setupPin = useAuthStore((s) => s.setupPin);
  const biometricAvailable = useAuthStore((s) => s.biometricAvailable);
  const biometricLabel = useAuthStore((s) => s.biometricLabel);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);

  const [stage, setStage] = useState<'create' | 'confirm' | 'done'>('create');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  const value = stage === 'create' ? first : second;
  const setValue = (next: string) => {
    setError(null);
    if (stage === 'create') {
      setFirst(next);
      if (next.length === PIN_LENGTH) setStage('confirm');
    } else if (stage === 'confirm') {
      setSecond(next);
      if (next.length === PIN_LENGTH) void submit(next);
    }
  };

  const submit = async (confirmValue: string) => {
    if (first.length !== PIN_LENGTH) {
      setStage('create');
      return;
    }
    if (confirmValue !== first) {
      setError('Konfirmasi tidak cocok. Ulangi dari awal.');
      setFirst('');
      setSecond('');
      setStage('create');
      return;
    }
    setBusy(true);
    const err = await setupPin(confirmValue);
    setBusy(false);
    if (err) {
      setError(err);
      setFirst('');
      setSecond('');
      setStage('create');
      return;
    }
    setStage('done');
  };

  const enableBio = async () => {
    setBioError(null);
    const err = await setBiometricEnabled(true);
    if (err) {
      setBioError(err);
      return;
    }
    router.replace('/(tabs)');
  };

  const skipBio = () => router.replace('/(tabs)');

  return (
    <View style={Common.screen}>
      <AppHeader title="Kunci Aplikasi" subtitle="Buat PIN 6 digit" />
      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={Common.content}>
          {stage === 'done' ? (
            <View style={styles.card}>
              <MaterialIcons name="lock-outline" size={40} color={Colors.accent} />
              <Text accessibilityRole="header" style={styles.title}>
                PIN berhasil dibuat
              </Text>
              <Text style={styles.desc}>
                Setiap membuka PentungScore kamu akan diminta PIN ini.
                {biometricAvailable
                  ? ` Aktifkan ${biometricLabel} agar lebih cepat.`
                  : ''}
              </Text>
              {biometricAvailable ? (
                <>
                  <AppButton label={`Aktifkan ${biometricLabel}`} onPress={enableBio} />
                  {bioError ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                      {bioError}
                    </Text>
                  ) : null}
                  <AppButton label="Lewati dulu" variant="ghost" onPress={skipBio} />
                </>
              ) : (
                <AppButton label="Mulai" onPress={skipBio} />
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.title}>
                {stage === 'create' ? 'Buat PIN baru' : 'Ulangi PIN untuk konfirmasi'}
              </Text>
              <Text style={styles.desc}>
                {stage === 'create'
                  ? `Masukkan ${PIN_LENGTH} angka. Jangan gunakan tanggal lahir.`
                  : 'Masukkan PIN yang sama sekali lagi.'}
              </Text>
              <PinPad value={value} onChange={setValue} disabled={busy} />
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              {stage === 'confirm' ? (
                <AppButton
                  label="Ulangi dari awal"
                  variant="ghost"
                  onPress={() => {
                    setFirst('');
                    setSecond('');
                    setError(null);
                    setStage('create');
                  }}
                />
              ) : null}
            </View>
          )}
        </View>
      </View>
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
});
