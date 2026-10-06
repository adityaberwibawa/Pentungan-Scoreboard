import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppHeader } from '../../components/AppHeader';
import { Colors, Common, FontFamily, MIN_TOUCH, Radius } from '../../theme';
import { PIN_LENGTH } from '../../auth/pin';
import { useAuth } from '../../auth/useAuth';

export default function SetupScreen() {
  const bioAvailable = useAuth((s) => s.biometricAvailable);
  const setupPin = useAuth((s) => s.setupPin);
  const setBioEnabled = useAuth((s) => s.setBioEnabled);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [wantBio, setWantBio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (pin !== confirm) {
      setError('Konfirmasi PIN tidak sama.');
      return;
    }
    setBusy(true);
    setError(null);
    const err = await setupPin(pin);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    if (wantBio && bioAvailable) {
      await setBioEnabled(true).catch(() => undefined);
    }
    setBusy(false);
  };

  return (
    <View style={Common.screen}>
      <AppHeader title="Kunci Aplikasi" subtitle="Buat PIN 6 digit agar data meja tetap privat" />
      <View style={[Common.content, styles.body]}>
        <View style={styles.card}>
          <Text style={styles.label}>PIN baru ({PIN_LENGTH} digit)</Text>
          <TextInput
            accessibilityLabel="PIN baru"
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/\D/g, '').slice(0, PIN_LENGTH));
              setError(null);
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_LENGTH}
            returnKeyType="next"
            style={styles.input}
          />
          <Text style={styles.label}>Konfirmasi PIN</Text>
          <TextInput
            accessibilityLabel="Konfirmasi PIN"
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v.replace(/\D/g, '').slice(0, PIN_LENGTH));
              setError(null);
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_LENGTH}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={styles.input}
          />
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          {bioAvailable ? (
            <View style={styles.bioRow}>
              <Text style={styles.bioText}>Buka dengan sidik jari / wajah</Text>
              <Switch
                accessibilityLabel="Aktifkan biometrik"
                value={wantBio}
                onValueChange={setWantBio}
                trackColor={{ false: Colors.raised, true: Colors.accent }}
                thumbColor={wantBio ? Colors.onAccent : Colors.muted}
              />
            </View>
          ) : null}
          <AppButton
            label={busy ? 'Menyimpan...' : 'Simpan PIN'}
            onPress={submit}
            disabled={busy || pin.length !== PIN_LENGTH || confirm.length !== PIN_LENGTH}
            disabledReason="Isi PIN 6 digit dan konfirmasinya dulu."
          />
          <Text style={styles.hint}>
            PIN hanya tersimpan sebagai hash di Keychain/Keystore perangkat, tidak pernah plaintext.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  label: { color: Colors.muted, fontFamily: FontFamily.bodyMedium, fontSize: 13 },
  input: {
    minHeight: MIN_TOUCH,
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    color: Colors.ink,
    fontFamily: FontFamily.display,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    paddingHorizontal: 12,
  },
  error: { color: Colors.danger, fontFamily: FontFamily.bodyMedium, fontSize: 13 },
  bioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bioText: { color: Colors.ink, fontFamily: FontFamily.body, fontSize: 14 },
  hint: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 12 },
});
