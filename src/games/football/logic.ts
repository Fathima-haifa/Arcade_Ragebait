export type Dir = 0 | 1 | 2; // 0 = left, 1 = centre, 2 = right
export const DIR_NAMES = ['Left', 'Centre', 'Right'];
export const KICKS = 7;
export const WIN_GOALS = 4;

export type Outcome = 'goal' | 'saved' | 'wide' | 'miss' | 'var' | 'decoy';

export interface KickResult {
  keepers: Dir[];
  outcome: Outcome;
  message: string;
}

// Kicks (0-based) where the goal slides away: a shot to the right goes wide.
export function goalMoved(kick: number): boolean {
  return kick === 1 || kick === 3 || kick === 5;
}

// Every kick after the first has decoy balls.
export function hasDecoys(kick: number): boolean {
  return kick >= 1;
}

// Two keepers = aim at the gap. Never overlaps a moved goal.
export function keeperSpots(kick: number): Dir[] {
  if (kick === 2 || kick === 4) return [0, 1]; // gap on the right
  if (kick === 6) return [1, 2]; // gap on the left
  return [1];
}

export function zoneWidth(kick: number, pity: number): number {
  return Math.max(6, 16 - kick * 1.5 + pity * 6);
}

export function meterStep(kick: number, pity: number): number {
  return Math.max(1.2, 2.4 + kick * 0.6 - pity * 0.25);
}

export function randomZoneCenter(): number {
  return 15 + Math.random() * 70;
}

const pick = (arr: string[], i: number) => arr[i % arr.length];

const MISS = [
  'You kicked it into orbit. NASA says thanks.',
  'The ball left the stadium. It does not miss you.',
  'Perfect aim, terrible timing. Mostly terrible timing.',
];
const SAVED = [
  'The goalkeeper has read your intentions.',
  'Saved. The keeper says it was personal.',
  'A beautiful shot. Unfortunately, the universe disagrees.',
];
const GOAL = [
  'You scored! The referee is investigating.',
  'The goalkeeper filed a complaint.',
  'Somehow, the universe allowed it.',
];
const VAR = [
  'VAR cancelled it. Reason: the ball looked smug.',
  'VAR cancelled it. Your shoelace was 2mm offside.',
  'VAR cancelled it. The referee had a feeling.',
];
const DECOY = [
  'You kicked a hallucination. The real ball is laughing.',
  'That ball was a decoy. It had a family.',
  'Wrong ball. The real one is in the stands, eating nachos.',
];

export function resolveKick(
  kick: number,
  aim: Dir,
  hit: boolean,
  pity: number,
  ballOk: boolean
): KickResult {
  const readChance = Math.max(0.2, 0.85 - pity * 0.13);
  const spots = keeperSpots(kick);
  let keepers: Dir[];

  if (spots.length === 2) {
    keepers = [...spots];
    if (!spots.includes(aim) && Math.random() < readChance * 0.6) {
      keepers[Math.random() < 0.5 ? 0 : 1] = aim; // one keeper slides to read you
    }
  } else {
    let keeper: Dir = aim;
    if (Math.random() >= readChance) {
      const others = ([0, 1, 2] as Dir[]).filter((d) => d !== aim);
      keeper = others[Math.random() < 0.5 ? 0 : 1];
    }
    keepers = [keeper];
  }

  if (!ballOk) return { keepers, outcome: 'decoy', message: pick(DECOY, kick) };
  if (!hit) return { keepers, outcome: 'miss', message: pick(MISS, kick) };
  if (goalMoved(kick) && aim === 2) {
    return {
      keepers,
      outcome: 'wide',
      message: 'The goal has moved. It says this is legal. Your ball is now in a car park.',
    };
  }
  if (keepers.includes(aim)) return { keepers, outcome: 'saved', message: pick(SAVED, kick) };

  const varChance = Math.max(0.05, 0.4 - pity * 0.07);
  if (kick >= 1 && Math.random() < varChance) {
    return { keepers, outcome: 'var', message: pick(VAR, kick) };
  }
  return { keepers, outcome: 'goal', message: pick(GOAL, kick) };
}

export function hintFor(kick: number): string {
  const hints = [
    'Pick a side, then stop the needle in the green zone. Easy. Probably.',
    'The goal moved and the balls multiply. Good luck.',
    'Two keepers. Aim at the gap. They may disagree.',
    'The goal moved again. Rude.',
    'Two keepers and more balls. This is fine.',
    'The goal is moving AND the needle is faster.',
    'Last kick. Trust nothing. Especially yourself.',
  ];
  return hints[kick] ?? hints[0];
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  goal: 'GOAL!',
  saved: 'SAVED!',
  wide: 'WIDE!',
  miss: 'MISS!',
  var: 'CANCELLED!',
  decoy: 'DECOY!',
};