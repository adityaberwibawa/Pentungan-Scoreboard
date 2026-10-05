import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Radius } from '../theme';
import { PIN_LENGTH } from '../auth/pin';

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/** Keypad PIN 6 digit dengan indikator titik. */
export function PinPad({ value, onChange, disabled }: Props) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '' || value.length >= PIN_LENGTH) return;
    onChange(value + key);
  };

  return (
    <View>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`PIN terisi ${value.length} dari ${PIN_LENGTH} digit`}
        style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((key, index) => {
          let label = `Digit ${key}`;
          if (key === 'del') label = 'Hapus digit';
          if (key === '') label = 'Kosong';
          return (
          <Pressable
            key={`${key}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={disabled || key === ''}
            onPress={() => press(key)}
            style={({ pressed }) => [
              styles.key,
              key === '' && styles.keyEmpty,
              pressed && styles.keyPressed,
            ]}>
            {key === 'del' ? (
              <MaterialIcons name="backspace" size={24} color={Colors.ink} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.raised,
  },
  dotFilled: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  key: {
    width: '31%',
    minHeight: 60,
    borderRadius: Radius.md,
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyPressed: { opacity: 0.7 },
  keyText: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 22 },
});
