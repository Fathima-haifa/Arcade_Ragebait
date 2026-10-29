export type CoreGameId = 'football' | 'heavenhell' | 'wronganswer' | 'ghosthole';
export type GameId = CoreGameId | 'madmaster' | 'betrayal' | 'genius';

export interface Settings {
  sound: boolean;
  music: boolean;
  motion: boolean;
}

export interface Progress {
  nickname: string;
  character: 'male' | 'female' | null;
  ragePoints: number;
  completedGames: GameId[];
  rewardedKeys: string[];
  achievements: string[];
  losses: number;
  bossDefeated: boolean;
  settings: Settings;
}

export const CORE_GAMES: CoreGameId[] = [
  'football',
  'heavenhell',
  'wronganswer',
  'ghosthole',
];

export const UNLOCK_TARGET = 3;