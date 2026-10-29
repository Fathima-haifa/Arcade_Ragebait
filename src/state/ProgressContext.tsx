import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type { GameId, Progress, Settings } from '../types/game';
import { CORE_GAMES, UNLOCK_TARGET } from '../types/game';
import { loadProgress, saveProgress, makeDefault } from './storage';

interface Ctx {
  progress: Progress;
  coreCompleted: number;
  bossUnlocked: boolean;
  award: (key: string, points: number) => boolean;
  completeGame: (id: GameId) => void;
  recordLoss: () => void;
  unlock: (achievementId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setProfile: (nickname: string, character: 'male' | 'female') => void;
  newGame: () => void;
}

const ProgressCtx = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const ref = useRef<Progress>(progress);

  const commit = (next: Progress) => {
    ref.current = next;
    setProgress(next);
    saveProgress(next);
  };

  const award = (key: string, points: number) => {
    const p = ref.current;
    if (p.rewardedKeys.includes(key)) return false;
    commit({ ...p, ragePoints: p.ragePoints + points, rewardedKeys: [...p.rewardedKeys, key] });
    return true;
  };

  const completeGame = (id: GameId) => {
    const p = ref.current;
    if (p.completedGames.includes(id)) return;
    commit({ ...p, completedGames: [...p.completedGames, id] });
  };

  const recordLoss = () => commit({ ...ref.current, losses: ref.current.losses + 1 });

  const unlock = (id: string) => {
    const p = ref.current;
    if (p.achievements.includes(id)) return;
    commit({ ...p, achievements: [...p.achievements, id] });
  };

  const updateSettings = (patch: Partial<Settings>) =>
    commit({ ...ref.current, settings: { ...ref.current.settings, ...patch } });

  const setProfile = (nickname: string, character: 'male' | 'female') =>
    commit({ ...ref.current, nickname, character });

  const newGame = () => commit({ ...makeDefault(), settings: ref.current.settings });

  const coreCompleted = progress.completedGames.filter((g) =>
    (CORE_GAMES as GameId[]).includes(g)
  ).length;

  const value: Ctx = {
    progress,
    coreCompleted,
    bossUnlocked: coreCompleted >= UNLOCK_TARGET,
    award,
    completeGame,
    recordLoss,
    unlock,
    updateSettings,
    setProfile,
    newGame,
  };

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): Ctx {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error('useProgress must be used inside ProgressProvider');
  return c;
}