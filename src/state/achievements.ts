export const ACHIEVEMENTS = [
  { id: 'first-rage', name: 'First Rage', desc: 'Complete your first game.' },
  { id: 'certified-victim', name: 'Certified Victim', desc: 'Lose three rounds.' },
  { id: 'rule-breaker', name: 'Rule Breaker', desc: 'Discover an unexpected game mechanic.' },
  { id: 'survivor', name: 'Survivor', desc: 'Complete three core games.' },
  { id: 'boss-challenger', name: 'Final Boss Challenger', desc: 'Unlock The Mad Master.' },
  { id: 'arcade-legend', name: 'Arcade Legend', desc: 'Defeat The Mad Master.' },
];

export function achievementName(id: string): string {
  return ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;
}