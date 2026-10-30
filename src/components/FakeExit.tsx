import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type Phase = 'idle' | 'confirm' | 'glitch' | 'error' | 'shutdown' | 'taunt';

// glitch (1.2s) -> fake error (1.5s) -> shutdown screen (1.6s) -> taunt
const STEPS: Partial<Record<Phase, { to: Phase; ms: number }>> = {
  glitch: { to: 'error', ms: 1200 },
  error: { to: 'shutdown', ms: 1500 },
  shutdown: { to: 'taunt', ms: 1600 },
};

const COOLDOWN_MS = 6000;

// Index 0 is always used for the very first attempt.
const TAUNTS = [
  "Resignation denied. You're contractually obligated to suffer.",
  'Exit not found. Neither is your skill.',
  'Nice try. The door was painted on.',
  'The exit is purely decorative. Like your strategy.',
  'Quitters get a participation trophy. You do not qualify.',
  'Your request has been forwarded to the Department of No.',
  'Even a goldfish has a better escape plan.',
  'Rage quit detected. Rage quit rejected.',
  'Leaving already? The suffering was just getting personal.',
  'Error 404: Mercy not found.',
  'The Mad Master reviewed your escape attempt and laughed. Twice.',
  'You pressed EXIT like it was ever going to work. Adorable.',
];

const JOKES = [
  'Escape attempt recorded. Dignity not found.',
  "Your attempt has been filed under 'Cute'.",
  'Exit button usage: 100%. Success rate: 0%.',
  'Logged to your permanent record. It is a short, sad record.',
  'Suffering uptime: 99.9%. Your escape: 0.0%.',
  'The real way out is earned, not clicked.',
  'Escape attempt recorded. Hope not found.',
];

interface Deck {
  cards: number[];
  last: number;
}

// Shuffled draw pile: no repeats until every line has been used.
function draw(deck: Deck, size: number): number {
  if (deck.cards.length === 0) {
    const order = Array.from({ length: size }, (_, i) => i);
    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    if (size > 1 && order[order.length - 1] === deck.last) {
      order.unshift(order.pop() as number);
    }
    deck.cards = order;
  }
  const next = deck.cards.pop() as number;
  deck.last = next;
  return next;
}

interface Props {
  /** Render only on arcade hub screens. Hidden = nothing on screen. */
  visible: boolean;
}

export default function FakeExit({ visible }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempts, setAttempts] = useState(0);
  const [line, setLine] = useState({ taunt: TAUNTS[0], joke: JOKES[0] });
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tauntDeck = useRef<Deck>({ cards: [], last: -1 });
  const jokeDeck = useRef<Deck>({ cards: [], last: -1 });

  // Advance the fake shutdown sequence.
  useEffect(() => {
    const step = STEPS[phase];
    if (!step) return;
    const id = window.setTimeout(() => setPhase(step.to), step.ms);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Cooldown countdown.
  useEffect(() => {
    if (cooldownUntil === 0) return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((cooldownUntil - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left === 0) window.clearInterval(id);
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  // Move focus into whichever overlay step is showing.
  useEffect(() => {
    if (phase !== 'idle') primaryRef.current?.focus();
  }, [phase]);

  const open = () => {
    if (phase !== 'idle') return;
    if (secondsLeft > 0 || Date.now() < cooldownUntil) return;
    setPhase('confirm');
  };

  const cancel = () => {
    setPhase('idle');
    triggerRef.current?.focus();
  };

  const proceed = () => {
    if (attempts === 0) {
      tauntDeck.current.last = 0;
      jokeDeck.current.last = 0;
      setLine({ taunt: TAUNTS[0], joke: JOKES[0] });
    } else {
      setLine({
        taunt: TAUNTS[draw(tauntDeck.current, TAUNTS.length)],
        joke: JOKES[draw(jokeDeck.current, JOKES.length)],
      });
    }
    setAttempts((n) => n + 1);
    setPhase('glitch');
  };

  const skip = () => setPhase('taunt');

  const finish = () => {
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    setSecondsLeft(Math.ceil(COOLDOWN_MS / 1000));
    setPhase('idle');
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (phase === 'confirm') cancel();
      else if (phase === 'taunt') finish();
      else skip();
      return;
    }
    if (e.key === 'Tab') {
      const items = overlayRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled])'
      );
      if (!items || items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!visible) return null;

  const cooling = secondsLeft > 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`fe-trigger${cooling ? ' is-cooling' : ''}`}
        aria-disabled={cooling}
        aria-haspopup="dialog"
        onClick={open}
      >
        <svg
          className="fe-trigger-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M12 3v9M6.3 6.8a8 8 0 1 0 11.4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <span>{cooling ? `Rebooting… ${secondsLeft}s` : 'Exit Arcade'}</span>
      </button>

      {phase !== 'idle' && (
        <div
          ref={overlayRef}
          className={`fe-overlay fe-phase-${phase}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fe-title"
          aria-describedby={phase === 'taunt' ? 'fe-desc' : undefined}
          onKeyDown={onKeyDown}
        >
          {phase === 'confirm' && (
            <div className="fe-panel">
              <p className="fe-kicker">Exit request</p>
              <h2 id="fe-title" className="fe-title">
                Are you sure you want to escape the suffering?
              </h2>
              <div className="fe-actions">
                <button
                  ref={primaryRef}
                  type="button"
                  className="fe-btn fe-btn-primary"
                  onClick={cancel}
                >
                  No, I&apos;ll stay
                </button>
                <button
                  type="button"
                  className="fe-btn fe-btn-ghost"
                  onClick={proceed}
                >
                  Yes, let me out
                </button>
              </div>
            </div>
          )}

          {phase === 'glitch' && (
            <div className="fe-stage fe-glitch">
              <div className="fe-slices" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <h2 id="fe-title" className="fe-glitch-text">
                SIGNAL LOST
              </h2>
              <button
                ref={primaryRef}
                type="button"
                className="fe-skip"
                onClick={skip}
              >
                Skip
              </button>
            </div>
          )}

          {phase === 'error' && (
            <div className="fe-stage fe-error">
              <div className="fe-window" role="alert">
                <div className="fe-window-bar">
                  <span>ARCADE.EXE</span>
                  <span aria-hidden="true">_ &#9633; &times;</span>
                </div>
                <div className="fe-window-body">
                  <h2 id="fe-title" className="fe-err-title">
                    Fatal error 0x5UFF3R
                  </h2>
                  <p>Exit module not found.</p>
                  <p>Mercy.dll failed to load.</p>
                  <div className="fe-progress" aria-hidden="true">
                    <span />
                  </div>
                  <p className="fe-fail">Escape sequence: DENIED</p>
                </div>
              </div>
              <button
                ref={primaryRef}
                type="button"
                className="fe-skip"
                onClick={skip}
              >
                Skip
              </button>
            </div>
          )}

          {phase === 'shutdown' && (
            <div className="fe-stage fe-shutdown">
              <h2 id="fe-title" className="fe-sr-only">
                Shutting down
              </h2>
              <ul className="fe-log">
                <li>Closing arcade...</li>
                <li>Saving your suffering... done</li>
                <li>Rage Points preserved. Sadly.</li>
                <li>
                  Powering off
                  <span className="fe-cursor" aria-hidden="true" />
                </li>
              </ul>
              <button
                ref={primaryRef}
                type="button"
                className="fe-skip"
                onClick={skip}
              >
                Skip
              </button>
            </div>
          )}

          {phase === 'taunt' && (
            <div className="fe-panel fe-panel-taunt">
              <p className="fe-kicker">The Mad Master says</p>
              <h2 id="fe-title" className="fe-taunt">
                {line.taunt}
              </h2>
              <p id="fe-desc" className="fe-joke">
                {line.joke}
              </p>
              <p className="fe-note">
                Totally harmless. Your progress and Rage Points are untouched.
              </p>
              <div className="fe-actions">
                <button
                  ref={primaryRef}
                  type="button"
                  className="fe-btn fe-btn-primary"
                  onClick={finish}
                >
                  Back to suffering
                </button>
              </div>
              <p className="fe-count">Escape attempts recorded: {attempts}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}