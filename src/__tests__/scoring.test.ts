import {
  checkTargetReached,
  defaultSessionTitle,
  initialsOf,
  leader,
  ranking,
  totals,
  validatePlayerName,
  validateTargetScore,
} from '../scoring';
import type { GameSession, Player } from '../types';

function makeSession(): GameSession {
  return {
    id: 's1',
    title: 'Game #1',
    createdAt: new Date().toISOString(),
    status: 'ongoing',
    participants: [
      { playerId: 'a', seatOrder: 1, isDealer: true, isActive: true },
      { playerId: 'b', seatOrder: 2, isDealer: false, isActive: true },
      { playerId: 'c', seatOrder: 3, isDealer: false, isActive: false },
    ],
    rules: { targetScoreEnabled: true, targetScore: 100 },
    rounds: [
      { roundNumber: 1, scores: { a: 20, b: 15, c: 30 } },
      { roundNumber: 2, scores: { a: -10, b: 40 } },
    ],
  };
}

describe('totals', () => {
  it('menjumlahkan skor semua ronde, termasuk negatif', () => {
    expect(totals(makeSession())).toEqual({ a: 10, b: 55, c: 30 });
  });
});

describe('ranking', () => {
  it('mengurutkan tertinggi dulu dan mengabaikan peserta nonaktif', () => {
    const ranks = ranking(makeSession());
    expect(ranks.map((r) => r.playerId)).toEqual(['b', 'a']);
    expect(ranks[0]).toMatchObject({ total: 55, rank: 1 });
    expect(ranks[1]).toMatchObject({ total: 10, rank: 2 });
  });

  it('memberi rank sama untuk total seri', () => {
    const s = makeSession();
    s.rounds = [{ roundNumber: 1, scores: { a: 10, b: 10 } }];
    const ranks = ranking(s);
    expect(ranks.map((r) => r.rank)).toEqual([1, 1]);
  });
});

describe('leader & target', () => {
  it('leader adalah total tertinggi', () => {
    expect(leader(makeSession())?.playerId).toBe('b');
  });

  it('null bila sesi kosong', () => {
    const s = makeSession();
    s.participants = [];
    expect(leader(s)).toBeNull();
  });

  it('target tercapai bila pemimpin melewati batas', () => {
    const s = makeSession();
    s.rules.targetScore = 50;
    expect(checkTargetReached(s)).toBe('b');
  });

  it('tidak selesai bila target mati atau belum tercapai', () => {
    const s = makeSession();
    expect(checkTargetReached(s)).toBeNull();
    s.rules.targetScoreEnabled = false;
    s.rules.targetScore = 1;
    expect(checkTargetReached(s)).toBeNull();
  });
});

describe('validatePlayerName', () => {
  const existing: Pick<Player, 'id' | 'name'>[] = [{ id: 'a', name: 'Bowo' }];
  it('menolak kosong', () => {
    expect(validatePlayerName('   ', existing)).toMatch(/kosong/);
  });
  it('menolak duplikat case-insensitive', () => {
    expect(validatePlayerName('bowo', existing)).toMatch(/sudah ada/);
  });
  it('mengizinkan nama sendiri saat edit', () => {
    expect(validatePlayerName('Bowo', existing, 'a')).toBeNull();
  });
  it('menolak lebih dari 16 karakter', () => {
    expect(validatePlayerName('x'.repeat(17), existing)).toMatch(/16/);
  });
  it('menerima nama valid', () => {
    expect(validatePlayerName('Dika', existing)).toBeNull();
  });
});

describe('validateTargetScore', () => {
  it('rentang 50–5000', () => {
    expect(validateTargetScore(49)).not.toBeNull();
    expect(validateTargetScore(5001)).not.toBeNull();
    expect(validateTargetScore(500)).toBeNull();
  });
});

describe('helpers', () => {
  it('defaultSessionTitle bernomor', () => {
    expect(defaultSessionTitle(0)).toBe('Game #1');
    expect(defaultSessionTitle(12)).toBe('Game #13');
  });
  it('initialsOf dua huruf kapital', () => {
    expect(initialsOf('bowo')).toBe('BO');
    expect(initialsOf('')).toBe('?');
  });
});
