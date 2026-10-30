export type CharacterId =
  | 'knight'
  | 'girl'
  | 'boy'
  | 'cowboy'
  | 'mage'
  | 'ninja'
  | 'astronaut'
  | 'pirate';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  tagline: string;
}

export const CHARACTERS: CharacterInfo[] = [
  { id: 'knight', name: 'Sir Rage-a-Lot', tagline: 'Armor on. Patience off.' },
  { id: 'girl', name: 'Skater Girl', tagline: 'Baggy jeans. Zero chill.' },
  { id: 'boy', name: 'Spike', tagline: 'The hair does the talking.' },
  { id: 'cowboy', name: 'Rage Rancher', tagline: 'Draws faster than your lag.' },
  { id: 'mage', name: 'Mad Mage', tagline: 'Glowing orb. Glowing ego.' },
  { id: 'ninja', name: 'Silent Rager', tagline: 'You never saw him fail.' },
  { id: 'astronaut', name: 'Lost Cosmonaut', tagline: 'Houston, we have a rage.' },
  { id: 'pirate', name: 'Captain Tilt', tagline: 'Treasure or bust. Mostly bust.' },
];

const KEY = 'rage-arcade-character-v1';

export function loadCharacter(): CharacterId {
  try {
    const v = localStorage.getItem(KEY);
    if (CHARACTERS.some((c) => c.id === v)) return v as CharacterId;
  } catch {
    /* storage blocked: ignore */
  }
  return 'knight';
}

export function saveCharacter(id: CharacterId): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage blocked: ignore */
  }
}