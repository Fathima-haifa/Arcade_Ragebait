const fs = require('fs');
const path = require('path');

const files = [
  // shared types
  'src/types/game.ts',

  // state and systems
  'src/state/ProgressContext.tsx',
  'src/state/storage.ts',
  'src/state/achievements.ts',
  'src/state/settings.ts',
  'src/systems/audio.ts',
  'src/systems/rewards.ts',
  'src/systems/useKeyboard.ts',

  // shared components
  'src/components/ArcadeButton.tsx',
  'src/components/RageCounter.tsx',
  'src/components/ResultModal.tsx',
  'src/components/ConfirmDialog.tsx',
  'src/components/TouchControls.tsx',
  'src/components/ProgressBar.tsx',

  // flow screens
  'src/screens/Landing.tsx',
  'src/screens/FakeAd.tsx',
  'src/screens/Login.tsx',
  'src/screens/CharacterSelect.tsx',
  'src/screens/Freefall.tsx',
  'src/screens/CommandDeck.tsx',
  'src/screens/GameSelect.tsx',
  'src/screens/Achievements.tsx',
  'src/screens/Settings.tsx',
  'src/screens/FakeExit.tsx',
  'src/screens/Ending.tsx',

  // core games
  'src/games/football/FootballRage.tsx',
  'src/games/football/logic.ts',
  'src/games/football/football.css',
  'src/games/heavenhell/AfterlifeTrial.tsx',
  'src/games/heavenhell/cases.ts',
  'src/games/heavenhell/logic.ts',
  'src/games/heavenhell/heavenhell.css',
  'src/games/wronganswer/WrongAnswer.tsx',
  'src/games/wronganswer/questions.ts',
  'src/games/wronganswer/logic.ts',
  'src/games/wronganswer/wronganswer.css',
  'src/games/ghosthole/GhostHole.tsx',
  'src/games/ghosthole/logic.ts',
  'src/games/ghosthole/ghosthole.css',

  // final boss
  'src/games/madmaster/MadMaster.tsx',
  'src/games/madmaster/combat.ts',
  'src/games/madmaster/madmaster.css',

  // bonus games
  'src/games/betrayal/BetrayalPlatformer.tsx',
  'src/games/betrayal/logic.ts',
  'src/games/betrayal/betrayal.css',
  'src/games/genius/GeniusTrial.tsx',
  'src/games/genius/puzzles.ts',
  'src/games/genius/genius.css',

  // styles
  'src/styles/global.css',
  'src/styles/arcade.css',
];

for (const f of files) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, '');
}
console.log('Done: ' + files.length + ' files created');