import ArcadeButton from './ArcadeButton';

interface Props {
  open: boolean;
  won: boolean;
  message: string;
  points: number;
  reason?: string;
  achievement?: string;
  onReplay: () => void;
  onBack: () => void;
}

export default function ResultModal({
  open, won, message, points, reason, achievement, onReplay, onBack,
}: Props) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true">
        <h2>{won ? '✔ VICTORY' : '✖ DEFEAT'}</h2>
        <p>{message}</p>
        <p className="badge">
          {points > 0 ? `+${points} Rage Points` : 'No new points this time'}
          {reason ? ` (${reason})` : ''}
        </p>
        {achievement && <p className="badge">🏆 Achievement: {achievement}</p>}
        <div className="modal-actions">
          <ArcadeButton variant="primary" onClick={onReplay}>Replay</ArcadeButton>
          <ArcadeButton onClick={onBack}>Arcade</ArcadeButton>
        </div>
      </div>
    </div>
  );
}