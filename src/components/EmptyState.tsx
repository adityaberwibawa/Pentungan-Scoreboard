import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily } from '../theme';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${title}. ${description ?? ''}`}>
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={28} color={Colors.muted} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 17, textAlign: 'center' },
  desc: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 14, textAlign: 'center' },
});
