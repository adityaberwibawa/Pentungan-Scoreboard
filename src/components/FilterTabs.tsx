import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, MIN_TOUCH, Radius } from '../theme';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count: number;
}

interface Props<T extends string> {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pilihan filter tersegmentasi: state terpilih diumumkan ke screen-reader. */
export function FilterTabs<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityLabel={`${opt.label}, ${opt.count} sesi`}
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={[styles.tab, selected && styles.tabActive]}>
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>
              {opt.label}
            </Text>
            <View style={[styles.count, selected && styles.countActive]}>
              <Text style={[styles.countText, selected && styles.countTextActive]}>
                {opt.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tab: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { color: Colors.muted, fontFamily: FontFamily.bodySemi, fontSize: 14 },
  tabTextActive: { color: Colors.onAccent },
  count: {
    minWidth: 24,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.raised,
    alignItems: 'center',
  },
  countActive: { backgroundColor: 'rgba(5, 46, 34, 0.2)' },
  countText: { color: Colors.muted, fontFamily: FontFamily.bodyBold, fontSize: 12 },
  countTextActive: { color: Colors.onAccent },
});
