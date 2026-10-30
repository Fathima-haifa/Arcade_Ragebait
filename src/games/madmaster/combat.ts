export type Phase = 1 | 2 | 3;
export type Fx = 'none' | 'hit' | 'block' | 'boss-hit' | 'special' | 'wind';

export const PLAYER_MAX = 100;
export const BOSS_MAX = 300;
export const ENERGY_CAP = 200;
export const SPECIAL_COST = 40;
export const ATTACK_DMG = 12;
export const SPECIAL_DMG = 45;
export const ATTACK_ENERGY = 10;
export const TELEGRAPH_MS = 800;
export const SHIELD_MS = 1200;
export const SHIELD_CD = 2000;
export const SECOND_WIND_HP = 60;

export interface Fight {
  playerHp: number;
  bossHp: number;
  energy: number;
  bossTimer: number;
  telegraph: number;
  shield: number;
  shieldCd: number;
  atkCd: number;
  phase: Phase;
  count: number;
  winds: number;
  status: 'fighting' | 'won';
  msg: string;
  fx: Fx;
  fxId: number;
}

// Temporary battle energy. Saved Rage Points are only read, never changed.
export function startEnergy(ragePoints: number): number {
  return Math.min(ENERGY_CAP, 60 + Math.floor(Math.max(0, ragePoints) / 3));
}

export function phaseOf(bossHp: number): Phase {
  const r = bossHp / BOSS_MAX;
  return r > 2 / 3 ? 1 : r > 1 / 3 ? 2 : 3;
}

export function bossDamage(phase: Phase, blocked: boolean): number {
  const base = 8 + phase * 4; // 12, 16, 20
  return blocked ? Math.round(base * 0.25) : base;
}

export function bossInterval(phase: Phase): number {
  return phase === 1 ? 2600 : phase === 2 ? 2200 : 1900;
}

const TAUNTS: Record<Phase, string[]> = {
  1: [
    'Is that your best? Cute.',
    'I have seen smarter toasters.',
    'Your gameplay has been reported to the authorities.',
  ],
  2: [
    'Still here? The tutorial ended ages ago.',
    'Even your save file is embarrassed.',
    'Keep going. I am collecting your tears.',
  ],
  3: [
    'No! My code! My beautiful bugs!',
    'This was not in the script!',
    'Fine, I am scared. Happy now?',
  ],
};

const SECOND_WIND = [
  'You fell! The arcade gives you a second wind. Pity is a feature.',
  'Knocked down, but the Mad Master got bored of waiting. Back up!',
  'Nobody loses in this arcade. It is bad for business. Get up!',
];

const PHASE_MSG: Record<Phase, string> = {
  1: '',
  2: 'PHASE 2! The Mad Master stops joking. He is still joking.',
  3: 'PHASE 3! The arcade glitches. He is panicking. Finish him!',
};

const taunt = (f: Fight) => TAUNTS[f.phase][f.count % 3];

function fx(f: Fight, kind: Fx, msg: string): Fight {
  return { ...f, fx: kind, msg, fxId: f.fxId + 1 };
}

export function newFight(ragePoints: number): Fight {
  return {
    playerHp: PLAYER_MAX,
    bossHp: BOSS_MAX,
    energy: startEnergy(ragePoints),
    bossTimer: 2500,
    telegraph: 0,
    shield: 0,
    shieldCd: 0,
    atkCd: 0,
    phase: 1,
    count: 0,
    winds: 0,
    status: 'fighting',
    msg: 'FIGHT! The Mad Master has been waiting. He brought snacks.',
    fx: 'none',
    fxId: 0,
  };
}

function strike(s: Fight): Fight {
  const blocked = s.shield > 0;
  const dmg = bossDamage(s.phase, blocked);
  const hp = s.playerHp - dmg;
  const out: Fight = {
    ...s,
    telegraph: 0,
    bossTimer: bossInterval(s.phase),
    count: s.count + 1,
  };
  if (hp <= 0) {
    return fx(
      {
        ...out,
        playerHp: SECOND_WIND_HP,
        winds: s.winds + 1,
        energy: Math.min(ENERGY_CAP, s.energy + 50),
        bossTimer: out.bossTimer + 1500,
      },
      'wind',
      SECOND_WIND[s.winds % SECOND_WIND.length]
    );
  }
  return fx(
    { ...out, playerHp: hp },
    blocked ? 'block' : 'hit',
    blocked
      ? `Blocked! Only ${dmg} damage. ${taunt(out)}`
      : `Ouch, ${dmg} damage. ${taunt(out)}`
  );
}

export function tick(f: Fight, dt: number): Fight {
  if (f.status !== 'fighting') return f;
  let s: Fight = {
    ...f,
    shield: Math.max(0, f.shield - dt),
    shieldCd: Math.max(0, f.shieldCd - dt),
    atkCd: Math.max(0, f.atkCd - dt),
  };
  if (s.telegraph > 0) {
    s = { ...s, telegraph: s.telegraph - dt };
    if (s.telegraph <= 0) s = strike(s);
  } else {
    s = { ...s, bossTimer: s.bossTimer - dt };
    if (s.bossTimer <= 0) {
      s = {
        ...s,
        telegraph: TELEGRAPH_MS,
        msg: `INCOMING! ${taunt(s)} Tap DEFEND!`,
      };
    }
  }
  return s;
}

function hitBoss(f: Fight, dmg: number, kind: Fx, msg: string): Fight {
  const bossHp = Math.max(0, f.bossHp - dmg);
  const phase = phaseOf(bossHp);
  const out: Fight = { ...f, bossHp, phase };
  if (bossHp <= 0) {
    return fx({ ...out, status: 'won', telegraph: 0 }, kind, 'The Mad Master collapses...');
  }
  if (phase > f.phase) {
    return fx({ ...out, telegraph: 0, bossTimer: out.bossTimer + 1200 }, kind, PHASE_MSG[phase]);
  }
  return fx(out, kind, msg);
}

export function playerAttack(f: Fight): Fight {
  if (f.status !== 'fighting' || f.atkCd > 0) return f;
  const s = {
    ...f,
    atkCd: 500,
    energy: Math.min(ENERGY_CAP, f.energy + ATTACK_ENERGY),
  };
  return hitBoss(s, ATTACK_DMG, 'boss-hit', `Hit for ${ATTACK_DMG}! +${ATTACK_ENERGY} energy.`);
}

export function playerSpecial(f: Fight): Fight {
  if (f.status !== 'fighting' || f.atkCd > 0) return f;
  if (f.energy < SPECIAL_COST) {
    return { ...f, msg: `Not enough energy. Attack to recharge (need ${SPECIAL_COST}).` };
  }
  const s = { ...f, atkCd: 700, energy: f.energy - SPECIAL_COST };
  return hitBoss(s, SPECIAL_DMG, 'special', `SPECIAL ATTACK! ${SPECIAL_DMG} damage!`);
}

export function playerDefend(f: Fight): Fight {
  if (f.status !== 'fighting' || f.shieldCd > 0) return f;
  return { ...f, shield: SHIELD_MS, shieldCd: SHIELD_CD, msg: 'Shield up!' };
}