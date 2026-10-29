import ArcadeButton from '../components/ArcadeButton';
import { useProgress } from '../state/ProgressContext';
import type { GameId } from '../types/game';
import { UNLOCK_TARGET } from '../types/game';

const GAMES: { id: GameId; name: string; blurb: string; icon: string }[] = [
  { id: 'wronganswer', name: 'The Wrong Answer', blurb: 'A quiz show where confidence is dangerous.', icon: '📺' },
  { id: 'football', name: 'Football Rage', blurb: 'Penalty kicks. The goal has opinions.', icon: '⚽' },
  { id: 'heavenhell', name: 'Heaven vs Hell', blurb: 'Survive a trial in the afterlife.', icon: '⚖️' },
  { id: 'ghosthole', name: 'Ghost Hole My Brain', blurb: 'Ghosts, a black hole, and bad decisions.', icon: '👻' },
];

interface Props {
  onPlay: (id: GameId) => void;
}

export default function GameSelect({ onPlay }: Props) {
  const { progress, coreCompleted, bossUnlocked } = useProgress();
  const shown = Math.min(coreCompleted, UNLOCK_TARGET);
  const pct = (shown / UNLOCK_TARGET) * 100;

  return (
    <section>
      <h2 className="screen-title">Choose Your Suffering</h2>
      <p className="progress-text">
        Core Games Completed: {shown}/{UNLOCK_TARGET} to unlock the Final Boss
      </p>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={UNLOCK_TARGET}
        aria-valuenow={shown}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="cards">
        {GAMES.map((g) => (
          <div className="card" key={g.id}>
            <span className="icon" aria-hidden="true">{g.icon}</span>
            <h3>{g.name}</h3>
            <p>{g.blurb}</p>
            {progress.completedGames.includes(g.id) && (
              <span className="badge">✔ Completed</span>
            )}
            <ArcadeButton variant="primary" onClick={() => onPlay(g.id)}>
              {progress.completedGames.includes(g.id) ? 'Play Again' : 'Play'}
            </ArcadeButton>
          </div>
        ))}

        <div className={`card boss ${bossUnlocked ? '' : 'locked'}`}>
          <span className="icon" aria-hidden="true">{bossUnlocked ? '🥋' : '🔒'}</span>
          <h3>The Mad Master</h3>
          <p>
            {bossUnlocked
              ? 'The final boss awaits.'
              : `Locked: complete ${UNLOCK_TARGET} core games.`}
          </p>
          <ArcadeButton
            variant="danger"
            disabled={!bossUnlocked}
            onClick={() => onPlay('madmaster')}
          >
            {bossUnlocked ? 'Fight!' : 'Locked'}
          </ArcadeButton>
        </div>
      </div>
    </section>
  );
}