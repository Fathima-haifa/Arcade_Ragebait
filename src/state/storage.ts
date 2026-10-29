import type { Progress } from '../types/game';

const KEY = 'mad-hacks-rage-arcade-v1';

export function makeDefault(): Progress {
  return {
    nickname: '',
    character: null,
    ragePoints: 0,
    completedGames: [],
    rewardedKeys: [],
    achievements: [],
    losses: 0,
    bossDefeated: false,
    settings: { sound: true, music: true, motion: true },
  };
}

export function hasSavedProgress(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function loadProgress(): Progress {
  const d = makeDefault();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const p = JSON.parse(raw);
    return {
      ...d,
      ...p,
      completedGames: Array.isArray(p.completedGames) ? p.completedGames : [],
      rewardedKeys: Array.isArray(p.rewardedKeys) ? p.rewardedKeys : [],
      achievements: Array.isArray(p.achievements) ? p.achievements : [],
      ragePoints: typeof p.ragePoints === 'number' ? p.ragePoints : 0,
      settings: { ...d.settings, ...(p.settings ?? {}) },
    };
  } catch {
    return d;
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // saving failed, game keeps working
  }
}