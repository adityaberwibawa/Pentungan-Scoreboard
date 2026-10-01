import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily, MIN_TOUCH, Radius, Soft } from '../theme';
import { useStore } from '../store';
import type { RankEntry } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { RankBadge } from './RankBadge';

interface Props {
  visible: string | null;
  ranking: RankEntry[];
  roundCount: number;
  onClose: () => void;
}

/** Modal klasemen sementara: urutan lengkap + selisih dari pemimpin. */
export function RankingModal({ visible, ranking, roundCount, onClose }: Props) {
  const players = useStore((s) => s.players);
  const top = ranking[0]?.total ?? 0;
  return (
    <Modal
      visible={visible !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <View style={styles.overlay}>
        <View
          accessibilityLabel={`Klasemen sementara hingga ronde ${roundCount}`}
          style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="emoji-events" size={22} color={Colors.gold} />
            </View>
            <View style={styles.headerText}>
              <Text accessibilityRole="header" style={styles.title}>
                Klasemen Sementara
              </Text>
              <Text style={styles.subtitle}>Akumulasi hingga Ronde {roundCount}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup klasemen"
              onPress={onClose}
              style={styles.close}>
              <MaterialIcons name="close" size={20} color={Colors.muted} />
            </Pressable>
          </View>
          {ranking.map((entry) => {
            const player = players.find((p) => p.id === entry.playerId);
            if (!player) return null;
            const first = entry.rank === 1;
            const gap = top - entry.total;
            return (
              <View
                key={entry.playerId}
                accessible
                accessibilityLabel={`${player.name}, peringkat ${entry.rank}, ${entry.total} poin${
                  gap > 0 ? `, selisih ${gap} dari pemimpin` : ', pemimpin klasemen'
                }`}
                style={[styles.row, first && styles.rowFirst]}>
                <RankBadge rank={entry.rank} />
                <PlayerAvatar name={player.name} avatar={player.avatar} size={32} />
                <View style={styles.nameWrap}>
                  <Text style={styles.name} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={[styles.gap, first && styles.gapFirst]}>
                    {gap === 0 ? 'Pemimpin' : `−${gap} dari pemimpin`}
                  </Text>
                </View>
                <Text style={[styles.score, first && styles.scoreFirst]}>{entry.total}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 8,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerIcon: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: Radius.md,
    backgroundColor: Soft.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 17 },
  subtitle: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 12, marginTop: 2 },
  close: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
  },
  rowFirst: { backgroundColor: Soft.goldSoft, borderColor: Colors.gold },
  nameWrap: { flex: 1 },
  name: { color: Colors.ink, fontFamily: FontFamily.bodySemi, fontSize: 14 },
  gap: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 12, marginTop: 2 },
  gapFirst: { color: Colors.gold },
  score: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 18 },
  scoreFirst: { color: Colors.gold },
});
