export const PLAYER_MAX = 100;
export const BOSS_MAX = 220;
export const FIGHT_MS = 75000;
export const PARRY_MS = 500;
export const ATTACK_CD = 450;
export const SPECIAL_CD = 600;

export type Phase = 'idle' | 'telegraph' | 'recover' | 'stunned';
export type AttackKind = 'light' | 'heavy' | 'feint';
export type Fx = 'none' | 'hit' | 'boss-hit' | 'block' | 'parry' | 'special';
export type Status = 'fighting' | 'won' | 'lost';

export interface Fight {
  playerHp: number;
  bossHp: number;
  meter: number;
  timeLeft: number;
  phase: Phase;
  phaseLeft: number;
  phaseTotal: number;
  kind: AttackKind;
  count: number;
  cooldown: number;
  defending: boolean;
  defendFor: number;
  status: Status;
  msg: string;
  fx: Fx;
  fxId: number;
}

export function newFight(): Fight {
  return {
    playerHp: PLAYER_MAX,
    bossHp: BOSS_MAX,
    meter: 0,
    timeLeft: FIGHT_MS,
    phase: 'idle',
    phaseLeft: 1500,
    phaseTotal: 1500,
    kind: 'light',
    count: 0,
    cooldown: 0,
    defending: false,
    defendFor: 0,
    status: 'fighting',
    msg: 'FIGHT! The Mad Master cracks his knuckles. All of them.',
    fx: 'none',
    fxId: 0,
  };
}

const PATTERN1: AttackKind[] = ['light', 'light', 'heavy', 'feint', 'light', 'heavy'];
const PATTERN2: AttackKind[] = ['heavy', 'light', 'feint', 'heavy', 'light', 'light'];

export function nextKind(count: number, bossHp: number): AttackKind {
  const p = bossHp <= BOSS_MAX / 2 ? PATTERN2 : PATTERN1;
  return p[count % p.length];
}

// 1.0 at full health, down to 0.7 when almost beaten: the boss speeds up.
function speed(f: Fight): number {
  return 1 - (1 - f.bossHp / BOSS_MAX) * 0.3;
}

export function telegraphMs(kind: AttackKind, f: Fight, pity: number): number {
  const base = kind === 'heavy' ? 1000 : kind === 'light' ? 800 : 900;
  return Math.max(550, Math.round(base * speed(f)) + pity * 100);
}

export function baseDamage(kind: AttackKind, pity: number): number {
  const d = kind === 'heavy' ? 20 : 10;
  return Math.round(d * (1 - pity * 0.12));
}

function setPhase(f: Fight, phase: Phase, ms: number): Fight {
  return { ...f, phase, phaseLeft: ms, phaseTotal: ms };
}

function withFx(f: Fight, fx: Fx, msg: string): Fight {
  return { ...f, fx, msg, fxId: f.fxId + 1 };
}

function strike(f: Fight, pity: number): Fight {
  const count = f.count + 1;

  if (f.kind === 'feint') {
    return withFx(
      setPhase({ ...f, count }, 'recover', 900),
      'none',
      'FEINT! He never attacked. He is open, hit him!'
    );
  }

  const dmg = baseDamage(f.kind, pity);

  if (f.defending) {
    if (f.defendFor <= PARRY_MS) {
      const s = setPhase(
        { ...f, count, meter: Math.min(100, f.meter + 25) },
        'stunned',
        1800
      );
      return withFx(s, 'parry', 'PARRY! The Mad Master is stunned. Hit him!');
    }
    const chip = Math.round(dmg * 0.2);
    const s = setPhase(
      {
        ...f,
        count,
        playerHp: Math.max(0, f.playerHp - chip),
        meter: Math.min(100, f.meter + 8),
      },
      'recover',
      700
    );
    return withFx(s, 'block', `Blocked, ${chip} chip damage. Defend later for a PARRY.`);
  }

  const s = setPhase(
    { ...f, count, playerHp: Math.max(0, f.playerHp - dmg) },
    'recover',
    700
  );
  return withFx(
    s,
    'hit',
    f.kind === 'heavy'
      ? `OUCH! A heavy hit for ${dmg}.`
      : `Hit for ${dmg}. Start defending near the end of his wind-up.`
  );
}

export function tick(f: Fight, dt: number, held: boolean, pity: number): Fight {
  if (f.status !== 'fighting') return f;

  let s: Fight = {
    ...f,
    timeLeft: f.timeLeft - dt,
    cooldown: Math.max(0, f.cooldown - dt),
    phaseLeft: f.phaseLeft - dt,
    defending: held,
    defendFor: held ? (f.defending ? f.defendFor + dt : 0) : 0,
  };

  if (s.phaseLeft <= 0) {
    if (s.phase === 'idle') {
      const kind = nextKind(s.count, s.bossHp);
      s = setPhase({ ...s, kind }, 'telegraph', telegraphMs(kind, s, pity));
      s.msg = kind === 'heavy' ? 'He is winding up something BIG...' : 'He is winding up...';
    } else if (s.phase === 'telegraph') {
      s = strike(s, pity);
    } else {
      s = setPhase(s, 'idle', Math.round(1400 * speed(s)));
    }
  }

  if (s.playerHp <= 0) {
    return { ...s, status: 'lost', msg: 'Knocked out. The Mad Master says: skill issue.' };
  }
  if (s.timeLeft <= 0) {
    return {
      ...s,
      timeLeft: 0,
      status: 'lost',
      msg: "Time's up. The Mad Master wins on a technicality.",
    };
  }
  return s;
}

export function playerAttack(f: Fight): Fight {
  if (f.status !== 'fighting' || f.cooldown > 0 || f.defending) return f;
  const open = f.phase === 'recover' || f.phase === 'stunned';
  const dmg = open ? 9 : 6;
  const bossHp = Math.max(0, f.bossHp - dmg);
  const s: Fight = {
    ...f,
    bossHp,
    meter: Math.min(100, f.meter + 10),
    cooldown: ATTACK_CD,
    status: bossHp <= 0 ? 'won' : 'fighting',
  };
  return withFx(s, 'boss-hit', open ? `Clean hit for ${dmg}! He was open.` : `Jab for ${dmg}.`);
}

export function playerSpecial(f: Fight): Fight {
  if (f.status !== 'fighting' || f.cooldown > 0 || f.meter < 100) return f;
  const bossHp = Math.max(0, f.bossHp - 30);
  const s = setPhase(
    {
      ...f,
      bossHp,
      meter: 0,
      cooldown: SPECIAL_CD,
      status: bossHp <= 0 ? 'won' : 'fighting',
    },
    'stunned',
    1000
  );
  return withFx(s, 'special', 'RAGE SPECIAL! 30 damage and his attack is cancelled.');
}