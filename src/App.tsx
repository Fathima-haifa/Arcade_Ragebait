import { useEffect, useState } from 'react';
import './styles/arcade.css';
import './styles/screens.css';
import type { GameId } from './types/game';
import { useProgress } from './state/ProgressContext';
import Login from './screens/Login';
import Landing from './screens/Landing';
import GameSelect from './screens/GameSelect';
import Achievements from './screens/Achievements';
import Settings from './screens/Settings';
import RageCounter from './components/RageCounter';
import ArcadeButton from './components/ArcadeButton';
import WrongAnswer from './games/wronganswer/WrongAnswer';
import FootballRage from './games/football/FootballRage';
import AfterlifeTrial from './games/heavenhell/AfterlifeTrial';
import GhostHole from './games/ghosthole/GhostHole';
import MadMaster from './games/madmaster/MadMaster';

type Screen = 'login' | 'landing' | 'select' | 'achievements' | 'settings' | GameId; // CHANGED: added 'login'

const CORE = ['football', 'heavenhell', 'wronganswer', 'ghosthole'];
const asList = (x: unknown): string[] => (Array.isArray(x) ? (x as string[]) : []);

function Placeholder({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <section className="landing">
      <h2 className="screen-title">{name}</h2>
      <p className="intro">This screen is built in a later batch.</p>
      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  );
}

function Locked({ onBack }: { onBack: () => void }) {
  return (
    <section className="landing">
      <h2 className="screen-title">LOCKED</h2>
      <p className="intro">Complete any 3 of the 4 games to face The Mad Master.</p>
      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login'); // CHANGED: starts on 'login'
  const { progress, bossUnlocked, unlock } = useProgress();
  const back = () => setScreen('select');
  const built: Screen[] = [
    'login', // NEW
    'landing',
    'select',
    'achievements',
    'settings',
    'wronganswer',
    'football',
    'heavenhell',
    'ghosthole',
    'madmaster',
  ];

  // Settings: Motion OFF really switches animations off everywhere
  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', !progress.settings.motion);
  }, [progress.settings.motion]);

  // Achievements that depend on overall progress
  useEffect(() => {
    const has = (id: string) => asList(progress.achievements).includes(id);
    const done = asList(progress.completedGames);
    const coreDone = CORE.filter((g) => done.includes(g)).length;
    if (coreDone >= 3 && !has('survivor')) unlock('survivor');
    if (coreDone >= 4 && done.includes('madmaster') && !has('arcade-legend')) {
      unlock('arcade-legend');
    }
  }, [progress.achievements, progress.completedGames, unlock]);

  // NEW: show the login page first; after login or guest, go to the landing page
  if (screen === 'login') {
    return <Login onEnter={() => setScreen('landing')} />;
  }

  return (
    <div className="app">
      {screen !== 'landing' && (
        <header className="topbar">
          <ArcadeButton variant="ghost" onClick={() => setScreen('landing')}>
            ⌂ Home
          </ArcadeButton>
          <RageCounter />
        </header>
      )}
      <main>
        {screen === 'landing' && (
          <Landing
            onStart={() => setScreen('select')}
            onAchievements={() => setScreen('achievements')}
            onSettings={() => setScreen('settings')}
          />
        )}
        {screen === 'select' && <GameSelect onPlay={(id) => setScreen(id)} />}
        {screen === 'achievements' && <Achievements onBack={() => setScreen('landing')} />}
        {screen === 'settings' && (
          <Settings onBack={() => setScreen('landing')} onReset={() => setScreen('landing')} />
        )}
        {screen === 'wronganswer' && <WrongAnswer onBack={back} />}
        {screen === 'football' && <FootballRage onBack={back} />}
        {screen === 'heavenhell' && <AfterlifeTrial onBack={back} />}
        {screen === 'ghosthole' && <GhostHole onBack={back} />}
        {screen === 'madmaster' &&
          (bossUnlocked ? <MadMaster onBack={back} /> : <Locked onBack={back} />)}
        {!built.includes(screen) && <Placeholder name={screen} onBack={back} />}
      </main>
    </div>
  );
}