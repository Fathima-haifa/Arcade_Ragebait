import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import '../styles/freefall.css';

interface FreeFallTransitionProps {
  onComplete: () => void;
  playerName?: string;
  /** Your selected character (an <img>, SVG, or component). A cyan silhouette is used if omitted. */
  character?: ReactNode;
  /** Pass true to force the simple fade (e.g. your Motion setting is OFF). */
  reducedMotion?: boolean;
  duration?: number;
}

const RING_COUNT = 8;
const TOWERS = [18, 30, 22, 40, 26, 34, 20, 44, 24, 32, 19];

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function Faller() {
  return (
    <svg className="ff-faller" viewBox="0 0 120 160" aria-hidden="true">
      <circle cx="60" cy="30" r="16" />
      <path d="M60 46 L60 100" />
      <path d="M60 58 L28 28" />
      <path d="M60 58 L92 28" />
      <path d="M60 100 L40 142" />
      <path d="M60 100 L82 138" />
    </svg>
  );
}

export default function FreeFallTransition({
  onComplete,
  playerName,
  character,
  reducedMotion = false,
  duration = 5200,
}: FreeFallTransitionProps) {
  const [calm] = useState(() => reducedMotion || prefersReducedMotion());
  const total = calm ? 1400 : duration;
  const doneRef = useRef(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  });

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    completeRef.current();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(finish, total);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish, total]);

  const streaks = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        '--a': `${i * 12 + (i % 3) * 3}deg`,
        '--d': `${0.8 + (i % 5) * 0.18}s`,
        '--dl': `${-((i * 0.37) % 1.6)}s`,
      })) as CSSProperties[],
    [],
  );

  const sparks = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        '--x': `${(i * 29 + 7) % 100}%`,
        '--s': `${2 + (i % 4)}px`,
        '--d': `${1.4 + (i % 6) * 0.35}s`,
        '--dl': `${-((i * 0.53) % 2.4)}s`,
        '--dx': `${((i % 7) - 3) * 14}px`,
      })) as CSSProperties[],
    [],
  );

  const rootStyle = { '--ff-dur': `${total}ms` } as CSSProperties;

  if (calm) {
    return (
      <div className="ff ff--calm" style={rootStyle} role="status" aria-live="polite">
        <p className="ff-calm-text">ENTERING RAGE ARCADE</p>
      </div>
    );
  }

  return (
    <div className="ff" style={rootStyle} role="status" aria-live="polite" aria-label="Entering the arcade">
      <div className="ff-cam" aria-hidden="true">
        <div className="ff-bg" />

        <div className="ff-world">
          <div className="ff-glow" />
          <div className="ff-towers">
            {TOWERS.map((h, i) => (
              <span key={i} className="ff-tower" style={{ '--h': `${h}%` } as CSSProperties} />
            ))}
          </div>
          <div className="ff-grid" />
        </div>

        <div className="ff-tunnel">
          {Array.from({ length: RING_COUNT }, (_, i) => (
            <span key={i} className="ff-ring" style={{ '--i': i } as CSSProperties} />
          ))}
        </div>

        <div className="ff-streaks">
          {streaks.map((s, i) => (
            <span key={i} className="ff-streak" style={s} />
          ))}
        </div>

        <div className="ff-sparks">
          {sparks.map((s, i) => (
            <span key={i} className="ff-spark" style={s} />
          ))}
        </div>

        <div className="ff-hero">
          {character ?? <Faller />}
          <p className="ff-name">{playerName ? `PLAYER ${playerName.toUpperCase()}` : 'PLAYER'}</p>
        </div>
      </div>

      <p className="ff-hud" aria-hidden="true">
        FREE FALL // ENTERING RAGE ARCADE
      </p>
      <div className="ff-bar" aria-hidden="true" />
      <div className="ff-flash" aria-hidden="true" />
      <button type="button" className="ff-skip" onClick={finish}>
        SKIP
      </button>
    </div>
  );
}