import { useProgress } from '../state/ProgressContext';

export default function RageCounter() {
  const { progress } = useProgress();
  return (
    <div className="rage-counter" aria-live="polite">
      🔥 RAGE {String(progress.ragePoints).padStart(5, '0')}
    </div>
  );
}