import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily, MIN_TOUCH, Radius } from '../theme';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  hint?: string;
}

/** Input angka dengan stepper −/+ (langkah 5) + ketik manual, boleh negatif. */
export function NumberStepper({ label, value, onChange, step = 5, hint }: Props) {
  const adjust = (delta: number) => {
    const current = Number.parseInt(value, 10);
    const next = Number.isFinite(current) ? current + delta : delta;
    onChange(String(next));
  };
  const inputId = `stepper-${label}`;
  return (
    <View style={styles.wrap}>
      <Text nativeID={inputId} style={styles.label}>
        {label}
      </Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Kurangi skor ${label} ${step} poin`}
          onPress={() => adjust(-step)}
          style={styles.stepBtn}>
          <MaterialIcons name="remove" size={20} color={Colors.ink} />
        </Pressable>
        <TextInput
          accessibilityLabel={`Skor ${label}${hint ? `. ${hint}` : ''}`}
          aria-labelledby={inputId}
          value={value}
          onChangeText={onChange}
          keyboardType="numbers-and-punctuation"
          inputMode="numeric"
          selectTextOnFocus
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tambah skor ${label} ${step} poin`}
          onPress={() => adjust(step)}
          style={styles.stepBtn}>
          <MaterialIcons name="add" size={20} color={Colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: Colors.muted, fontFamily: FontFamily.bodyMedium, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  stepBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: Colors.ink,
    fontFamily: FontFamily.display,
    fontSize: 20,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
