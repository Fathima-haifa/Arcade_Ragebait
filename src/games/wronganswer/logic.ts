import type { Question } from './questions';

export function isAccepted(q: Question, choice: number): boolean {
  return q.mode === 'reverse' ? choice === q.absurd : choice === q.real;
}

const GOOD_REVERSE = [
  'Correct! The answer is mathematically questionable.',
  'Correct! The host has consulted absolutely nobody.',
  'Correct! Nobody is more confused than the audience.',
];
const BAD_REVERSE = [
  'Incorrect. Your confidence has been recorded.',
  'Incorrect. Being right was not part of the rules.',
  'Incorrect. The host is deeply offended by accuracy.',
];
const GOOD_HONEST = ['Correct! The host is honest now. Nobody is ready.'];
const BAD_HONEST = ['Incorrect. Logic has left the building.'];

export function feedbackFor(q: Question, accepted: boolean, index: number): string {
  const pool =
    q.mode === 'reverse'
      ? accepted ? GOOD_REVERSE : BAD_REVERSE
      : accepted ? GOOD_HONEST : BAD_HONEST;
  return pool[index % pool.length];
}