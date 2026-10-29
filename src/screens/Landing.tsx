import { useState } from 'react';
import ArcadeButton from '../components/ArcadeButton';
import ConfirmDialog from '../components/ConfirmDialog';
import { useProgress } from '../state/ProgressContext';

interface Props {
  onStart: () => void;
  onAchievements: () => void;
  onSettings: () => void;
}

export default function Landing({ onStart, onAchievements, onSettings }: Props) {
  const { progress, newGame } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const hasProgress =
    progress.ragePoints > 0 || progress.completedGames.length > 0 || progress.losses > 0;

  return (
    <section className="landing">
      <h1 className="title">MAD HACKS: RAGE ARCADE</h1>
      <p className="tagline">
        Where the game is against you, the rules are questionable, and rage is part of the reward.
      </p>
      <p className="intro">
        Welcome to an arcade that is unfair in personality, not broken in implementation.
        Expect betrayals. Expect lies. Expect to try again.
      </p>

      <div className="menu">
        <ArcadeButton variant="primary" onClick={onStart}>
          {hasProgress ? 'Continue Playing' : 'Start Playing'}
        </ArcadeButton>
        <ArcadeButton variant="danger" onClick={() => setConfirming(true)}>
          New Game
        </ArcadeButton>
        <ArcadeButton onClick={onAchievements}>Achievements</ArcadeButton>
        <ArcadeButton onClick={onSettings}>Settings</ArcadeButton>
      </div>

      <p className="note">
        Progress is saved in this browser only. It does not sync across devices.
      </p>

      <ConfirmDialog
        open={confirming}
        title="Start a new game?"
        message="This erases your Rage Points, completed games and achievements. Settings are kept."
        confirmLabel="Erase and start"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          newGame();
          setConfirming(false);
          onStart();
        }}
      />
    </section>
  );
}