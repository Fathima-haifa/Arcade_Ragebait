import type { Rule } from './cases';

export type Step = { kind: 'case'; index: number } | { kind: 'challenge' };

export const STEPS: Step[] = [
  { kind: 'case', index: 0 },
  { kind: 'case', index: 1 },
  { kind: 'challenge' },
  { kind: 'case', index: 2 },
  { kind: 'case', index: 3 },
];

export function applyRule(rule: Rule, value: number): number {
  if (rule === 'reverse') return -value;
  if (rule === 'double') return value * 2;
  return value;
}

// Seconds allowed per case. Gets shorter each step, easier after losses.
export function timeLimit(step: number, pity: number): number {
  return Math.max(6, 13 - step * 2 + pity * 2);
}

export function tapsNeeded(pity: number): number {
  return Math.max(7, 14 - pity * 2);
}

export const CHALLENGE_SECONDS = 5;
export const TIMEOUT_VALUE = -2;

export type Verdict = 'heaven' | 'hell' | 'probation' | 'appeal';

export function getVerdict(net: number, timeouts: number, challengeOk: boolean): Verdict {
  if (timeouts >= 2) return 'appeal';
  if (net >= 7 && challengeOk && timeouts === 0) return 'heaven';
  if (net >= 3) return 'probation';
  return 'hell';
}

export const VERDICTS: Record<Verdict, { title: string; message: string; won: boolean }> = {
  heaven: {
    title: 'HEAVEN: suspiciously generous',
    message: 'The gates open. Someone hands you a free upgrade. Nobody explains why.',
    won: true,
  },
  probation: {
    title: 'PROBATION: the judge is tired',
    message: 'You are free to go. The judge wants to go home more than you do.',
    won: true,
  },
  hell: {
    title: 'HELL: technically justified',
    message: 'The court checked the rules. You lost them. Enjoy the heat.',
    won: false,
  },
  appeal: {
    title: 'APPEAL DENIED: the paperwork has become sentient',
    message: 'You ran out of time twice. The paperwork has filed against you.',
    won: false,
  },
};