import { useMemo } from 'react';
import type { CharacterId } from '../state/character';

const GRID_W = 16;
const GRID_H = 22;

// "." = transparent. Other letters come from that character's palette.
const SPRITES: Record<CharacterId, string[]> = {
  knight: [
    '.....RRRR.......',
    '....RRRRRR......',
    '...KKKKKKKKKK...',
    '..KLLLLLLLLSSK..',
    '..KLLLLLLLLSSK..',
    '..KLKKKKKKKLSK..',
    '..KLKDKDKDKLSK..',
    '..KLKKKKKKKLSK..',
    '..KLLLLLLLLSSK..',
    '...KKKKKKKKKK...',
    '..KYYYYYYYYYYK..',
    '.KLLKLLLLLLKLLK.',
    '.KSSKLLYYYYKSSK.',
    '.KSSKLLLLLLKSSK.',
    '..KKBBBBBBBBKK..',
    '...KDDDKKDDDK...',
    '...KDDDKKDDDK...',
    '...KLLLKKLLLK...',
    '...KLLLKKLLLK...',
    '...KSSSKKSSSK...',
    '..KKSSSKKSSSKK..',
    '..KKKKKKKKKKKK..',
  ],
  girl: [
    '....KKKKKKKK....',
    '...KHHHHHHHHK...',
    '..KHHHHHHHHHHK..',
    '..KHHSSSSSSHHK..',
    '..KHSSSSSSSSHK..',
    '..KHSKSSSSKSHK..',
    '..KHSSSSSSSSHK..',
    '..KHSSSMMSSSHK..',
    '..KHHKSSSSKHHK..',
    '..KHHKKKKKKHHK..',
    '..KHKTTTTTTKHK..',
    '.KSKTTTCCTTTKSK.',
    '.KSKTTTTTTTTKSK.',
    '.KSKTTTTTTTTKSK.',
    '..KKKJJJJJJKKK..',
    '...KJJJJJJJJK...',
    '...KJJJJJJJJK...',
    '...KJJJKKJJJK...',
    '...KJJJKKJJJK...',
    '...KJJJKKJJJK...',
    '...KOOOKKOOOK...',
    '...KKKKKKKKKK...',
  ],
  boy: [
    '...K..KK..K.....',
    '..KHKKHHKKHK....',
    '..KHHHHHHHHHK...',
    '..KHHHHHHHHHK...',
    '..KHSSSSSSSHK...',
    '...KSSSSSSSSK...',
    '...KSKSSSSKSK...',
    '...KSSSSSSSSK...',
    '...KSSSMMSSSK...',
    '....KKSSSSKK....',
    '...KGGGGGGGGK...',
    '..KGGGGGGGGGGK..',
    '.KSKGGGWWGGGKSK.',
    '.KSKGGGGGGGGKSK.',
    '.KSKGGGGGGGGKSK.',
    '..KKKBBBBBBKKK..',
    '....KJJJJJJK....',
    '....KJJKKJJK....',
    '....KJJKKJJK....',
    '....KJJKKJJK....',
    '...KWWWKKWWWK...',
    '...KKKKKKKKKK...',
  ],
  cowboy: [
    '......HHHH......',
    '....KHHHHHHK....',
    '.KKKHHHHHHHHKKK.',
    'KHHHHHHHHHHHHHHK',
    '.KKKKKKKKKKKKKK.',
    '...KSSSSSSSSK...',
    '...KSKSSSSKSK...',
    '...KSSSSSSSSK...',
    '...KSSDDDDSSK...',
    '....KRRRRRRK....',
    '..KKVVRRRRVVKK..',
    '.KSKVVVYYVVVKSK.',
    '.KSKVVVVVVVVKSK.',
    '.KSKVVVVVVVVKSK.',
    '..KKKBBBBBBKKK..',
    '...KJJJJJJJJK...',
    '...KJJJJJJJJK...',
    '...KJJJKKJJJK...',
    '...KJJJKKJJJK...',
    '..KKBBBKKBBBKK..',
    '..KBBBBKKBBBBK..',
    '..KKKKKKKKKKKK..',
  ],
  mage: [
    '.......KK.......',
    '......KBBK......',
    '.....KBBBBK.....',
    '....KBBBBBBK....',
    '...KBBBBBBBBK...',
    '.KKKKKKKKKKKKKK.',
    '...KSSSSSSSSK...',
    '...KSKSSSSKSK...',
    '...KWWSSSSWWK...',
    '...KWWWMMWWWK...',
    '...KWWWWWWWWK..C',
    '..KKBBWWWWBBKK.C',
    '.KSKBBBBBBBBKSKC',
    '.KSKBBYYYYBBKSK.',
    '..KKBBBBBBBBKK..',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KBBBKKBBBK...',
    '...KDDDKKDDDK...',
    '...KKKKKKKKKK...',
  ],
  ninja: [
    '....KKKKKKKK....',
    '...KNNNNNNNNK...',
    '...KCCCCCCCCK...',
    '...KNNSSSSNNK...',
    '...KNSKSSKSNK...',
    '...KNSSSSSSNK...',
    '...KNNNNNNNNK...',
    '....KKNNNNKK....',
    '..KKNNNNNNNNKK..',
    '.KNNKNNNNNNKNNK.',
    '.KNNKNNCCNNKNNK.',
    '.KSSKNNNNNNKSSK.',
    '..KKCCCCCCCCKK..',
    '...KNNNNNNNNK...',
    '...KNNNKKNNNK...',
    '...KNNNKKNNNK...',
    '...KNNNKKNNNK...',
    '...KGGGKKGGGK...',
    '...KNNNKKNNNK...',
    '..KKNNNKKNNNKK..',
    '..KKKKKKKKKKKK..',
  ],
  astronaut: [
    '......KKKK......',
    '....KKWWWWKK....',
    '...KWWWWWWWWK...',
    '..KWWKKKKKKWWK..',
    '..KWKCCCCCCKWK..',
    '..KWKCWCCCCKWK..',
    '..KWKCCCCCCKWK..',
    '..KWWKKKKKKWWK..',
    '...KWWWWWWWWK...',
    '..KKOOOOOOOOKK..',
    '.KWWKWWWWWWKWWK.',
    '.KWWKWCCCCWKWWK.',
    '.KGGKWWWWWWKGGK.',
    '..KKKWWWWWWKKK..',
    '...KWWWWWWWWK...',
    '...KWWWKKWWWK...',
    '...KWWWKKWWWK...',
    '...KWWWKKWWWK...',
    '...KOOOKKOOOK...',
    '..KGGGGKKGGGGK..',
    '..KKKKKKKKKKKK..',
  ],
  pirate: [
    '....KKKKKKKK....',
    '...KRRRRRRRRK...',
    '..KRRRRRRRRRRK..',
    '..KKKKKKKKKKKK..',
    '...KSSSSSSSSK...',
    '...KSKKSSSKSK...',
    '...KSSSSSSSSK...',
    '...KSSDDDDSSK...',
    '....KKSSSSKK....',
    '..KKNNWWWWNNKK..',
    '.KNNKNWWWWNKNNK.',
    '.KSSKNYWWYNKSSK.',
    '.KNNKNWWWWNKNNK.',
    '..KKKBBBBBBKKK..',
    '...KNNNNNNNNK...',
    '...KNNNKKNNNK...',
    '...KNNNKKNNNK...',
    '...KNNNKKNNNK...',
    '...KBBBKKBBBK...',
    '..KBBBBKKBBBBK..',
    '..KKKKKKKKKKKK..',
  ],
};

const PALETTES: Record<CharacterId, Record<string, string>> = {
  knight: { K: '#0b1020', R: '#d63a2f', L: '#aeb7c4', S: '#6c7788', D: '#2b3340', Y: '#f2c14e', B: '#7a4a26' },
  girl: { K: '#0b1020', H: '#f2c94c', S: '#f0c08a', M: '#a33a3a', T: '#15182b', C: '#6ff2ff', J: '#7fa3d1', O: '#f2f2f2' },
  boy: { K: '#0b1020', H: '#5a3a22', S: '#f0c08a', M: '#7a2e2e', G: '#3fae5a', W: '#ffffff', B: '#7a4a26', J: '#2e4a8a' },
  cowboy: { K: '#0b1020', H: '#8a5a2b', S: '#e0a878', D: '#4a2c14', R: '#c0392b', V: '#6b4423', Y: '#f2c14e', B: '#3b2412', J: '#3f6fb5' },
  mage: { K: '#0b1020', B: '#3a6fd8', S: '#f0c08a', W: '#eaf6ff', M: '#7a2e2e', C: '#6ff2ff', Y: '#f2c14e', D: '#1b2a5a' },
  ninja: { K: '#0b1020', N: '#2b3040', S: '#f0c08a', C: '#6ff2ff', G: '#8a93a6' },
  astronaut: { K: '#0b1020', W: '#f4f8ff', C: '#6ff2ff', O: '#ff8a1f', G: '#8a93a6' },
  pirate: { K: '#0b1020', R: '#d63a2f', S: '#f0c08a', D: '#5a3a22', W: '#f4f4f4', N: '#1c2a4a', Y: '#f2c14e', B: '#4a2c14' },
};

interface CharacterAvatarProps {
  id?: CharacterId;
  character?: CharacterId; // alias for id, so older files keep working
  size?: number; // height in px, default 160
  animated?: boolean; // idle bobbing, default true
  className?: string;
}

export default function CharacterAvatar({
  id,
  character,
  size = 160,
  animated = true,
  className = '',
}: CharacterAvatarProps) {
  const charId: CharacterId = id ?? character ?? 'knight';

  const rects = useMemo(() => {
    const rows = SPRITES[charId] ?? SPRITES.knight;
    const palette = PALETTES[charId] ?? PALETTES.knight;
    const yOffset = GRID_H - rows.length; // all feet sit on the same floor line
    const out: { x: number; y: number; w: number; fill: string }[] = [];

    rows.forEach((rawRow, y) => {
      const row = rawRow.padEnd(GRID_W, '.').slice(0, GRID_W);
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        if (ch === '.') {
          x++;
          continue;
        }
        const start = x;
        while (x < row.length && row[x] === ch) x++;
        out.push({ x: start, y: y + yOffset, w: x - start, fill: palette[ch] ?? '#ffffff' });
      }
    });
    return out;
  }, [charId]);

  return (
    <div
      className={`pixel-avatar pixel-avatar--${charId} ${animated ? 'pixel-avatar--idle' : ''} ${className}`}
      style={{ height: size, width: (size * GRID_W) / GRID_H }}
      role="img"
      aria-label={`${charId} character`}
    >
      <svg viewBox={`0 0 ${GRID_W} ${GRID_H}`} width="100%" height="100%" shapeRendering="crispEdges">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
        ))}
      </svg>
      <div className="pixel-avatar__shadow" />
    </div>
  );
}