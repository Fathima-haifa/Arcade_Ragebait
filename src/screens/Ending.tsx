import { useEffect, useState } from 'react';
import '../games/madmaster/madmaster.css';
import ArcadeButton from '../components/ArcadeButton';
import ConfirmDialog from '../components/ConfirmDialog';
import CharacterAvatar from '../components/CharacterAvatar';
import { BossSprite } from '../games/madmaster/MadMaster';
import { useProgress } from '../state/ProgressContext';
import type { CharacterId } from '../state/character';

type Stage = 'victory' | 'escape' | 'complete' | 'credits';

interface Props {
  character: CharacterId;
  onPlayAgain: () => void;
  onBackToArcade: () => void;
}

export default function Ending({ character, onPlayAgain, onBackToArcade }: Props) {
  const { newGame } = useProgress();
  const [stage, setStage] = useState<Stage>('victory');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (stage === 'victory') {
      const t = window.setTimeout(() => setStage('escape'), 6000);
      return () => window.clearTimeout(t);
    }
    if (stage === 'escape') {
      const t = window.setTimeout(() => setStage('complete'), 7500);
      return () => window.clearTimeout(t);
    }
  }, [stage]);

  if (stage === 'victory') {
    return (
      <section className="end">
        <div className="end-boss-fall"><BossSprite phase={3} /></div>
        <h1 className="end-title">YOU DEFEATED THE MAD MASTER!</h1>
        <p className="end-quote">
          “The arcade is free. Your sanity remains under investigation.”
        </p>
        <ArcadeButton variant="primary" onClick={() => setStage('escape')}>CONTINUE</ArcadeButton>
      </section>
    );
  }

  if (stage === 'escape') {
    return (
      <section className="end end-escape" aria-live="polite">
        <div className="end-world" />
        <p className="end-caption">YOU FINALLY ESCAPED THE RAGE ARCADE!</p>
        <div className="end-portal" />
        <div className="end-hero">
          <CharacterAvatar id={character} size={120} animated={false} />
        </div>
        <div className="end-fade" />
        <div className="end-skip">
          <ArcadeButton variant="ghost" onClick={() => setStage('complete')}>Skip</ArcadeButton>
        </div>
      </section>
    );
  }

  if (stage === 'credits') {
    return (
      <section className="end end-complete">
        <h1 className="end-title">THANK YOU FOR PLAYING</h1>
        <p className="end-credits">
          MAD HACKS: RAGE ARCADE<br />
          Built with React, TypeScript and Vite.<br />
          Made by the Rage Arcade team. Progress is saved in this browser.
        </p>
        <ArcadeButton variant="primary" onClick={onBackToArcade}>BACK TO ARCADE</ArcadeButton>
      </section>
    );
  }

  return (
    <section className="end end-complete">
      <h1 className="end-title">PROJECT COMPLETE.<br />THANKS FOR PLAYING!</h1>
      <div className="end-buttons">
        <ArcadeButton variant="primary" onClick={() => setConfirming(true)}>PLAY AGAIN</ArcadeButton>
        <ArcadeButton onClick={() => setStage('credits')}>EXIT GAME</ArcadeButton>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Start a new game?"
        message="This erases your Rage Points, completed games and achievements. Settings are kept."
        confirmLabel="Erase and start"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          newGame();
          setConfirming(false);
          onPlayAgain();
        }}
      />
    </section>
  );
}