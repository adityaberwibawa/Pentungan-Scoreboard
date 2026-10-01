import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../theme';

interface Props {
  rank: number;
  size?: number;
}

/** Badge peringkat: hanya #1 emas, sisanya abu netral + selalu ada angka. */
export function RankBadge({ rank, size = 28 }: Props) {
  const isFirst = rank === 1;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={isFirst ? 'Peringkat 1, juara' : `Peringkat ${rank}`}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isFirst ? Colors.gold : Colors.rank,
        },
      ]}>
      <Text style={[styles.text, { color: isFirst ? Colors.coal : Colors.ink }]}>
        {rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FontFamily.display, fontSize: 13 },
});
