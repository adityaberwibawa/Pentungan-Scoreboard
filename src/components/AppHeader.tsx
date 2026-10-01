import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, MIN_TOUCH } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  right?: React.ReactNode;
}

/** Header layar: aman dari notch, judul sebagai heading screen-reader. */
export function AppHeader({ title, subtitle, showBack, backLabel = 'Kembali', right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]} accessible={false}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.back}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.ink} />
          </Pressable>
        ) : null}
        <View style={styles.titles} accessible={false}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right ?? (showBack ? <View style={styles.back} /> : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.base,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  titles: { flex: 1 },
  title: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 20 },
  subtitle: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 13, marginTop: 2 },
});
