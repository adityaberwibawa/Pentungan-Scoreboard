/** Logika turunan murni: total, ranking, validasi, aturan selesai. Diuji unit. */
import { GameSession, Player, RankEntry, SUITS, Suit } from './types';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MAX_NAME_LENGTH = 16;
export const MIN_TARGET = 50;
export const MAX_TARGET = 5000;
export const TARGET_STEP = 50;
export const TARGET_PRESETS = [100, 250, 500, 1000];

/** Total kumulatif per pemain (jumlah semua ronde). */
export function totals(session: Pick<GameSession, 'rounds'>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const round of session.rounds) {
    for (const [playerId, score] of Object.entries(round.scores)) {
      out[playerId] = (out[playerId] ?? 0) + score;
    }
  }
  return out;
}

/** Urutan pemain dari total tertinggi. Total sama = rank sama. */
export function ranking(session: Pick<GameSession, 'participants' | 'rounds'>): RankEntry[] {
  const t = totals(session);
  const active = session.participants.filter((p) => p.isActive);
  const sorted = [...active].sort((a, b) => (t[b.playerId] ?? 0) - (t[a.playerId] ?? 0));
  const entries: RankEntry[] = [];
  let currentRank = 0;
  let lastTotal: number | null = null;
  sorted.forEach((p, index) => {
    const total = t[p.playerId] ?? 0;
    if (lastTotal === null || total !== lastTotal) {
      currentRank = index + 1;
      lastTotal = total;
    }
    entries.push({ playerId: p.playerId, total, rank: currentRank });
  });
  return entries;
}

export function leader(
  session: Pick<GameSession, 'participants' | 'rounds'>,
): RankEntry | null {
  const r = ranking(session);
  return r.length > 0 ? r[0] : null;
}

/** Kembalikan id pemenang bila target tercapai, atau null. */
export function checkTargetReached(session: GameSession): string | null {
  if (!session.rules.targetScoreEnabled) return null;
  const lead = leader(session);
  if (lead && lead.total >= session.rules.targetScore) return lead.playerId;
  return null;
}

/** Validasi nama pemain. Kembalikan pesan Indonesia atau null bila valid. */
export function validatePlayerName(
  rawName: string,
  existing: Pick<Player, 'id' | 'name'>[],
  excludeId?: string,
): string | null {
  const name = rawName.trim();
  if (!name) return 'Nama pemain tidak boleh kosong.';
  if (name.length > MAX_NAME_LENGTH) {
    return `Nama maksimal ${MAX_NAME_LENGTH} karakter.`;
  }
  const dupe = existing.some(
    (p) => p.id !== excludeId && p.name.toLowerCase() === name.toLowerCase(),
  );
  if (dupe) return `Pemain "${name}" sudah ada. Gunakan nama lain.`;
  return null;
}

export function validateTargetScore(value: number): string | null {
  if (!Number.isFinite(value)) return 'Target skor harus berupa angka.';
  if (value < MIN_TARGET || value > MAX_TARGET) {
    return `Target skor minimal ${MIN_TARGET} dan maksimal ${MAX_TARGET}.`;
  }
  return null;
}

/** Suit berikutnya round-robin untuk quick-add. */
export function nextSuit(index: number): Suit {
  return SUITS[index % SUITS.length];
}

export function defaultSessionTitle(sessionCount: number): string {
  return `Game #${sessionCount + 1}`;
}

/** Inisial avatar: 2 huruf awal, atau '?' bila kosong. */
export function initialsOf(name: string): string {
  const clean = name.trim();
  if (!clean) return '?';
  return clean.slice(0, 2).toUpperCase();
}

export function formatDateId(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
