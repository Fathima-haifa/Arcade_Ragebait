import { useEffect, useState } from 'react';

import './styles/arcade.css';
import './styles/screens.css';
import './styles/character.css';
import './styles/fakeexit.css';

import type { GameId } from './types/game';
import { useProgress } from './state/ProgressContext';

import Login from './screens/Login';
import CharacterSelect from './screens/CharacterSelect';
import Landing from './screens/Landing';
import GameSelect from './screens/GameSelect';
import Achievements from './screens/Achievements';
import Settings from './screens/Settings';
import Ending from './screens/Ending';

import FreeFallTransition from './components/FreeFallTransition';
import CharacterAvatar from './components/CharacterAvatar';
import RageCounter from './components/RageCounter';
import ArcadeButton from './components/ArcadeButton';
import FakeExit from './components/FakeExit';

import { loadCharacter, saveCharacter } from './state/character';
import type { CharacterId } from './state/character';

import WrongAnswer from './games/wronganswer/WrongAnswer';
import FootballRage from './games/football/FootballRage';
import AfterlifeTrial from './games/heavenhell/AfterlifeTrial';
import GhostHole from './games/ghosthole/GhostHole';
import MadMaster from './games/madmaster/MadMaster';

type Screen =
  | 'login'
  | 'character'
  | 'landing'
  | 'select'
  | 'achievements'
  | 'settings'
  | 'ending'
  | GameId;

const CORE = [
  'football',
  'heavenhell',
  'wronganswer',
  'ghosthole',
];

const asList = (x: unknown): string[] =>
  Array.isArray(x) ? (x as string[]) : [];

function Placeholder({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  return (
    <section className="landing">
      <h2 className="screen-title">{name}</h2>
      <p className="intro">
        This screen is built in a later batch.
      </p>
      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  );
}

function Locked({ onBack }: { onBack: () => void }) {
  return (
    <section className="landing">
      <h2 className="screen-title">LOCKED</h2>
      <p className="intro">
        Complete any 3 of the 4 games to face The Mad Master.
      </p>
      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [falling, setFalling] = useState(false);
  const [playerName, setPlayerName] = useState('');

  const [character, setCharacter] =
    useState<CharacterId>(() => loadCharacter());

  const { progress, bossUnlocked, unlock } = useProgress();

  const back = () => setScreen('select');

  const built: Screen[] = [
    'login',
    'character',
    'landing',
    'select',
    'achievements',
    'settings',
    'ending',
    'wronganswer',
    'football',
    'heavenhell',
    'ghosthole',
    'madmaster',
  ];

  // Respect the user's motion setting.
  useEffect(() => {
    document.documentElement.classList.toggle(
      'no-motion',
      !progress.settings.motion
    );
  }, [progress.settings.motion]);

  // Keep existing achievement logic.
  useEffect(() => {
    const has = (id: string) =>
      asList(progress.achievements).includes(id);

    const done = asList(progress.completedGames);

    const coreDone = CORE.filter((game) =>
      done.includes(game)
    ).length;

    if (coreDone >= 3 && !has('survivor')) {
      unlock('survivor');
    }

    if (done.includes('madmaster') && !has('arcade-legend')) {
      unlock('arcade-legend');
    }
  }, [
    progress.achievements,
    progress.completedGames,
    unlock,
  ]);

  // STEP 1: Login.
  if (screen === 'login') {
    return (
      <Login
        onEnter={(name) => {
          setPlayerName(name);
          setScreen('character');
        }}
      />
    );
  }

  // STEP 2: Choose a character.
  if (screen === 'character') {
    return (
      <CharacterSelect
        initial={character}
        onConfirm={(id) => {
          saveCharacter(id);
          setCharacter(id);
          setFalling(true);
          setScreen('landing');
        }}
      />
    );
  }

  // STEP 3: Fall into the arcade world.
  if (falling) {
    return (
      <FreeFallTransition
        playerName={playerName}
        character={<CharacterAvatar id={character} size={200} animated={false} />}
        reducedMotion={!progress.settings.motion}
        onComplete={() => setFalling(false)}
      />
    );
  }

  // TRUE ENDING (full screen, after the boss)
  if (screen === 'ending') {
    return (
      <Ending
        character={character}
        onPlayAgain={() => setScreen('landing')}
        onBackToArcade={() => setScreen('landing')}
      />
    );
  }

  // STEP 4: Existing arcade and games.
  return (
    <div className="app">
      <FakeExit visible={screen === 'landing' || screen === 'select'} />

      {screen !== 'landing' && (
        <header className="topbar">
          <ArcadeButton
            variant="ghost"
            onClick={() => setScreen('landing')}
          >
            ⌂ Home
          </ArcadeButton>

          <RageCounter />
        </header>
      )}

      <main>
        {screen === 'landing' && (
          <Landing
            onStart={() => setScreen('select')}
            onAchievements={() =>
              setScreen('achievements')
            }
            onSettings={() => setScreen('settings')}
          />
        )}

        {screen === 'select' && (
          <GameSelect
            onPlay={(id) => setScreen(id)}
          />
        )}

        {screen === 'achievements' && (
          <Achievements
            onBack={() => setScreen('landing')}
          />
        )}

        {screen === 'settings' && (
          <Settings
            onBack={() => setScreen('landing')}
            onReset={() => setScreen('landing')}
          />
        )}

        {screen === 'wronganswer' && (
          <WrongAnswer onBack={back} />
        )}

        {screen === 'football' && (
          <FootballRage onBack={back} />
        )}

        {screen === 'heavenhell' && (
          <AfterlifeTrial onBack={back} />
        )}

        {screen === 'ghosthole' && (
          <GhostHole onBack={back} />
        )}

        {screen === 'madmaster' &&
          (bossUnlocked ? (
            <MadMaster
              character={character}
              onBack={back}
              onVictory={() => setScreen('ending')}
            />
          ) : (
            <Locked onBack={back} />
          ))}

        {!built.includes(screen) && (
          <Placeholder
            name={screen}
            onBack={back}
          />
        )}
      </main>
    </div>
  );
}