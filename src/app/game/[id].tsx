import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../components/AppButton';
import { AppHeader } from '../../components/AppHeader';
import { ConfirmSheet } from '../../components/ConfirmSheet';
import { EmptyState } from '../../components/EmptyState';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { RankBadge } from '../../components/RankBadge';
import { RankingModal } from '../../components/RankingModal';
import { ScoreModal } from '../../components/ScoreModal';
import { Colors, Common, FontFamily, MIN_TOUCH, Radius, Soft } from '../../theme';
import { ranking, totals } from '../../scoring';
import { playerName, useStore } from '../../store';

const ROW_H = 46;
const LABEL_W = 52;

interface EditTarget {
  roundNumber: number | null;
  playerId?: string;
}

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const sessions = useStore((s) => s.sessions);
  const players = useStore((s) => s.players);
  const loadAll = useStore((s) => s.loadAll);
  const saveRound = useStore((s) => s.saveRound);
  const undoLastRound = useStore((s) => s.undoLastRound);
  const deleteSession = useStore((s) => s.deleteSession);

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelScroll = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      loadAll().catch(() => undefined);
    }, [loadAll]),
  );

  const session = sessions.find((s) => s.id === id);
  const activeParts = useMemo(
    () => (session ? session.participants.filter((p) => p.isActive) : []),
    [session],
  );
  const sessionTotals = useMemo(
    () => (session ? totals(session) : {}),
    [session],
  );
  const ranks = useMemo(() => (session ? ranking(session) : []), [session]);
  const rankOf = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of ranks) map[r.playerId] = r.rank;
    return map;
  }, [ranks]);
  const lead = ranks[0];
  const leadPlayer = lead ? players.find((p) => p.id === lead.playerId) : undefined;
  const ongoing = session?.status === 'ongoing';

  const announce = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const syncLabels = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    labelScroll.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
  };

  if (!session) {
    return (
      <View style={Common.screen}>
        <AppHeader title="Sesi tidak ada" showBack />
        <EmptyState
          icon="history"
          title="Sesi tidak ditemukan"
          description="Sesi ini mungkin sudah dihapus."
        />
      </View>
    );
  }

  const colWidth = Math.max(76, 280 / Math.max(1, activeParts.length));

  const openNewRound = () => setEditTarget({ roundNumber: null });
  const openEditCell = (roundNumber: number, playerId: string) =>
    setEditTarget({ roundNumber, playerId });

  const handleSaveScores = async (scores: Record<string, number>) => {
    if (!editTarget) return;
    const res = await saveRound(session.id, scores, editTarget.roundNumber ?? undefined);
    setEditTarget(null);
    if (res.completed) {
      setWinner(res.winnerName ?? 'Pemenang');
    } else {
      announce(
        editTarget.roundNumber == null
          ? 'Skor ronde berhasil diperbarui.'
          : 'Skor berhasil diubah.',
      );
    }
  };

  const handleUndo = async () => {
    setConfirmUndo(false);
    const ok = await undoLastRound(session.id);
    announce(ok ? 'Ronde terakhir dihapus.' : 'Tidak ada ronde untuk dihapus.');
  };

  const modalPlayers =
    editTarget?.playerId != null
      ? activeParts
          .filter((p) => p.playerId === editTarget.playerId)
          .map((p) => {
            const player = players.find((pl) => pl.id === p.playerId)!;
            const round = session.rounds.find((r) => r.roundNumber === editTarget.roundNumber);
            return {
              player,
              total: sessionTotals[p.playerId] ?? 0,
              initial: round?.scores[p.playerId] ?? 0,
            };
          })
      : activeParts.map((p) => ({
          player: players.find((pl) => pl.id === p.playerId)!,
          total: sessionTotals[p.playerId] ?? 0,
          initial: 0,
        }));

  const editRoundLabel =
    editTarget?.roundNumber != null
      ? `Ronde ${editTarget.roundNumber}${
          editTarget.playerId ? ` • ${playerName(players, editTarget.playerId)}` : ''
        }`
      : `Ronde ${session.rounds.length + 1}`;

  return (
    <View style={Common.screen}>
      <AppHeader
        title={session.title}
        subtitle={
          ongoing
            ? `Game berjalan • Ronde ${session.rounds.length + 1}`
            : `Selesai • ${session.rounds.length} ronde`
        }
        showBack
        right={
          leadPlayer ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pemimpin ${leadPlayer.name}, ${lead.total} poin. Buka klasemen.`}
              onPress={() => setShowRanking(true)}
              style={styles.leader}>
              <MaterialIcons name="emoji-events" size={18} color={Colors.gold} />
              <Text style={styles.leaderText} numberOfLines={1}>
                {leadPlayer.name} ({lead.total})
              </Text>
            </Pressable>
          ) : undefined
        }
      />
      {session.status === 'completed' && session.winnerPlayerId ? (
        <View
          accessible
          accessibilityLabel={`Pemenang ${playerName(players, session.winnerPlayerId)}`}
          style={styles.winnerBanner}>
          <MaterialIcons name="emoji-events" size={20} color={Colors.gold} />
          <Text style={styles.winnerBannerText}>
            {playerName(players, session.winnerPlayerId)} memenangkan permainan
          </Text>
        </View>
      ) : null}
      <View style={styles.gridHint}>
        <Text style={styles.gridHintText}>
          {ongoing ? 'Ketuk sel ronde untuk ubah skor' : 'Mode lihat saja — sesi sudah selesai'}
        </Text>
        <Text style={styles.gridHintText}>{activeParts.length} Pemain</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.headRow}>
          <View style={[styles.corner, { width: LABEL_W }]}>
            <Text style={styles.cornerText}>Rnd</Text>
          </View>
          <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
            <View style={styles.headCols}>
              {activeParts.map((part) => {
                const player = players.find((p) => p.id === part.playerId);
                if (!player) return null;
                const total = sessionTotals[part.playerId] ?? 0;
                const rank = rankOf[part.playerId] ?? 99;
                return (
                  <View
                    key={part.playerId}
                    accessible
                    accessibilityLabel={`${player.name}, total ${total} poin, peringkat ${rank}`}
                    style={[styles.headCell, { width: colWidth }]}>
                    <Text style={styles.headName} numberOfLines={1}>
                      {player.name}
                    </Text>
                    <View style={styles.headMeta}>
                      <RankBadge rank={rank} size={20} />
                      <Text style={[styles.headTotal, rank === 1 && styles.headTotalFirst]}>
                        {total}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
        <View style={styles.bodyRow}>
          <ScrollView
            ref={labelScroll}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            style={{ width: LABEL_W }}>
            {session.rounds.map((round) => (
              <View key={round.roundNumber} style={styles.labelCell}>
                <Text style={styles.labelText}>R{round.roundNumber}</Text>
              </View>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScroll}>
            <ScrollView
              onScroll={syncLabels}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}>
              {session.rounds.map((round) => {
                const best = Math.max(
                  ...activeParts.map((p) => round.scores[p.playerId] ?? 0),
                );
                return (
                  <View key={round.roundNumber} style={styles.gridRow}>
                    {activeParts.map((part) => {
                      const value = round.scores[part.playerId] ?? 0;
                      const isBest = value === best && activeParts.length > 1;
                      const negative = value < 0;
                      const name = playerName(players, part.playerId);
                      return (
                        <Pressable
                          key={part.playerId}
                          accessibilityRole="button"
                          accessibilityLabel={`Ronde ${round.roundNumber}, ${name}, skor ${value}${
                            negative ? ', kena pentung' : ''
                          }${isBest ? ', tertinggi ronde ini' : ''}${
                            ongoing ? '. Ketuk untuk ubah.' : ''
                          }`}
                          disabled={!ongoing}
                          onPress={() => openEditCell(round.roundNumber, part.playerId)}
                          style={[styles.cell, { width: colWidth }]}>
                          <Text
                            style={[
                              styles.cellText,
                              isBest && styles.cellBest,
                              negative && styles.cellMinus,
                            ]}>
                            {value > 0 ? `+${value}` : `${value}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </ScrollView>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.gold }]} />
          <Text style={styles.legendText}>Tertinggi ronde</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>Pentung / Minus</Text>
        </View>
        <Text style={styles.legendText}>{session.rounds.length} Ronde</Text>
      </View>
      {toast ? (
        <Text accessibilityLiveRegion="polite" style={styles.toast}>
          {toast}
        </Text>
      ) : null}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka klasemen sementara"
          onPress={() => setShowRanking(true)}
          style={styles.barBtn}>
          <MaterialIcons name="leaderboard" size={22} color={Colors.gold} />
          <Text style={styles.barLabel}>Klasemen</Text>
        </Pressable>
        {ongoing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tambah ronde baru"
            accessibilityHint="Buka form input skor ronde berikutnya"
            onPress={openNewRound}
            style={styles.fab}>
            <MaterialIcons name="add" size={26} color={Colors.onAccent} />
          </Pressable>
        ) : (
          <View style={styles.fabSpacer} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buka menu permainan"
          onPress={() => setShowMenu(true)}
          style={styles.barBtn}>
          <MaterialIcons name="menu" size={22} color={Colors.ink} />
          <Text style={styles.barLabel}>Menu</Text>
        </Pressable>
      </View>
      <ScoreModal
        visible={editTarget !== null}
        title={editTarget?.roundNumber == null ? `Input Skor Ronde ${session.rounds.length + 1}` : 'Ubah Skor'}
        subtitle={editRoundLabel}
        players={modalPlayers}
        saveLabel={editTarget?.roundNumber == null ? 'Simpan Skor Ronde' : 'Simpan Perubahan'}
        onSave={handleSaveScores}
        onClose={() => setEditTarget(null)}
      />
      <RankingModal
        visible={showRanking ? 'ranking' : null}
        ranking={ranks}
        roundCount={session.rounds.length}
        onClose={() => setShowRanking(false)}
      />
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
        accessibilityViewIsModal>
        <View style={styles.menuOverlay}>
          <View
            accessibilityRole="menu"
            accessibilityLabel="Menu permainan"
            style={[styles.menu, { paddingBottom: insets.bottom + 16 }]}>
            <Text accessibilityRole="header" style={styles.menuTitle}>
              Menu & Pengaturan Game
            </Text>
            <MenuRow
              icon="add-circle"
              label="Game Baru"
              hint="Buat sesi permainan baru"
              onPress={() => {
                setShowMenu(false);
                router.push('/create');
              }}
            />
            <MenuRow
              icon="history"
              label="Daftar Game / Riwayat"
              hint="Lihat semua sesi tersimpan"
              onPress={() => {
                setShowMenu(false);
                router.push('/(tabs)/saved');
              }}
            />
            <MenuRow
              icon="group"
              label="Daftar Pemain"
              hint="Kelola roster pemain"
              onPress={() => {
                setShowMenu(false);
                router.push('/(tabs)/players');
              }}
            />
            <View
              accessible
              accessibilityLabel="Auto-save aktif. Semua data tersimpan otomatis di perangkat."
              style={styles.autoSave}>
              <MaterialIcons name="cloud-done" size={18} color={Colors.accent} />
              <Text style={styles.autoSaveText}>Auto-save aktif (tersimpan lokal)</Text>
            </View>
            {ongoing && session.rounds.length > 0 ? (
              <MenuRow
                icon="undo"
                label="Hapus Ronde Terakhir"
                hint="Minta konfirmasi dulu"
                danger
                onPress={() => {
                  setShowMenu(false);
                  setConfirmUndo(true);
                }}
              />
            ) : null}
            <MenuRow
              icon="delete-outline"
              label="Hapus Sesi Ini"
              hint="Minta konfirmasi dulu"
              danger
              onPress={() => {
                setShowMenu(false);
                setConfirmDelete(true);
              }}
            />
            <AppButton label="Tutup Menu" variant="ghost" onPress={() => setShowMenu(false)} />
          </View>
        </View>
      </Modal>
      <ConfirmSheet
        visible={confirmUndo}
        title="Hapus Ronde Terakhir?"
        message={`Ronde ${session.rounds.length} beserta semua skornya akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus Ronde"
        destructive
        onCancel={() => setConfirmUndo(false)}
        onConfirm={handleUndo}
      />
      <ConfirmSheet
        visible={confirmDelete}
        title="Hapus Sesi Ini?"
        message={`${session.title} beserta semua ronde skornya akan dihapus permanen.`}
        confirmLabel="Hapus Sesi"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteSession(session.id)
            .then(() => router.replace('/(tabs)/saved'))
            .catch(() => Alert.alert('Gagal', 'Sesi gagal dihapus.'));
        }}
      />
      <Modal
        visible={winner !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setWinner(null)}
        accessibilityViewIsModal>
        <View style={styles.menuOverlay}>
          <View
            accessibilityRole="alert"
            accessibilityLabel={`Permainan selesai. Pemenang ${winner}`}
            style={styles.winnerSheet}>
            <MaterialIcons name="emoji-events" size={40} color={Colors.gold} />
            <Text accessibilityRole="header" style={styles.winnerTitle}>
              Permainan Selesai
            </Text>
            <Text style={styles.winnerText}>{winner} memenangkan permainan!</Text>
            <View style={styles.winnerActions}>
              <View style={styles.winnerBtn}>
                <AppButton
                  label="Lihat Riwayat"
                  variant="ghost"
                  onPress={() => {
                    setWinner(null);
                    router.replace('/(tabs)/saved');
                  }}
                />
              </View>
              <View style={styles.winnerBtn}>
                <AppButton
                  label="Buat Game Baru"
                  onPress={() => {
                    setWinner(null);
                    router.replace('/create');
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  danger,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  hint: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={styles.menuRow}>
      <MaterialIcons
        name={icon}
        size={22}
        color={danger ? Colors.danger : Colors.ink}
      />
      <Text style={[styles.menuRowText, danger && styles.menuRowDanger]}>{label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={Colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  leader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    minHeight: MIN_TOUCH,
    maxWidth: 180,
  },
  leaderText: { color: Colors.gold, fontFamily: FontFamily.bodySemi, fontSize: 12, flexShrink: 1 },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Soft.goldSoft,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    padding: 12,
  },
  winnerBannerText: { color: Colors.gold, fontFamily: FontFamily.bodySemi, fontSize: 14, flex: 1 },
  gridHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  gridHintText: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 12 },
  table: {
    marginHorizontal: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    maxHeight: '52%',
  },
  headRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  corner: {
    backgroundColor: Colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  cornerText: { color: Colors.muted, fontFamily: FontFamily.bodyBold, fontSize: 11 },
  headCols: { flexDirection: 'row', backgroundColor: Colors.base },
  headCell: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    gap: 4,
  },
  headName: { color: Colors.ink, fontFamily: FontFamily.bodySemi, fontSize: 12 },
  headMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headTotal: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 14 },
  headTotalFirst: { color: Colors.gold },
  bodyRow: { flexDirection: 'row' },
  labelCell: {
    height: ROW_H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  labelText: { color: Colors.muted, fontFamily: FontFamily.bodyBold, fontSize: 12 },
  gridScroll: { flex: 1 },
  gridRow: { flexDirection: 'row' },
  cell: {
    height: ROW_H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.raised,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cellText: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 14 },
  cellBest: { color: Colors.gold },
  cellMinus: { color: Colors.danger },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 12 },
  toast: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: Colors.raised,
    borderWidth: 1,
    borderColor: Colors.accent,
    color: Colors.accent,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    borderRadius: Radius.md,
    padding: 10,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 'auto',
  },
  barBtn: { alignItems: 'center', gap: 2, minWidth: 72, minHeight: MIN_TOUCH, justifyContent: 'center' },
  barLabel: { color: Colors.muted, fontFamily: FontFamily.bodySemi, fontSize: 11 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSpacer: { width: 52 },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 4,
  },
  menuTitle: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 17, marginBottom: 8 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 8,
  },
  menuRowText: { flex: 1, color: Colors.ink, fontFamily: FontFamily.bodyMedium, fontSize: 15 },
  menuRowDanger: { color: Colors.danger },
  autoSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  autoSaveText: { color: Colors.muted, fontFamily: FontFamily.body, fontSize: 13 },
  winnerSheet: {
    margin: 24,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    maxWidth: 400,
    width: '100%',
  },
  winnerTitle: { color: Colors.ink, fontFamily: FontFamily.display, fontSize: 20 },
  winnerText: {
    color: Colors.gold,
    fontFamily: FontFamily.bodySemi,
    fontSize: 15,
    textAlign: 'center',
  },
  winnerActions: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
  winnerBtn: { flex: 1 },
});
