import { useState } from 'react';
import './styles/arcade.css';
import type { GameId } from './types/game';
import Landing from './screens/Landing';
import GameSelect from './screens/GameSelect';
import RageCounter from './components/RageCounter';
import ArcadeButton from './components/ArcadeButton';
import WrongAnswer from './games/wronganswer/WrongAnswer';
import FootballRage from './games/football/FootballRage';
import AfterlifeTrial from './games/heavenhell/AfterlifeTrial';
import GhostHole from './games/ghosthole/GhostHole';

type Screen = 'landing' | 'select' | 'achievements' | 'settings' | GameId;

function Placeholder({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <section className="landing">
      <h2 className="screen-title">{name}</h2>
      <p className="intro">This screen is built in a later batch.</p>
      <ArcadeButton onClick={onBack}>Back</ArcadeButton>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const back = () => setScreen('select');
  const built: Screen[] = [
    'landing',
    'select',
    'wronganswer',
    'football',
    'heavenhell',
    'ghosthole',
  ];

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
        {screen === 'wronganswer' && <WrongAnswer onBack={back} />}
        {screen === 'football' && <FootballRage onBack={back} />}
        {screen === 'heavenhell' && <AfterlifeTrial onBack={back} />}
        {screen === 'ghosthole' && <GhostHole onBack={back} />}
        {!built.includes(screen) && <Placeholder name={screen} onBack={back} />}
      </main>
    </div>
  );
}