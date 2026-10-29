import { useEffect, useRef, useState } from 'react';
import './football.css';
import ArcadeButton from '../../components/ArcadeButton';
import ResultModal from '../../components/ResultModal';
import { useProgress } from '../../state/ProgressContext';
import { achievementName } from '../../state/achievements';
import {
  DIR_NAMES, KICKS, WIN_GOALS, OUTCOME_LABEL,
  goalMoved, hasDecoys, keeperSpots, resolveKick, hintFor,
  zoneWidth, meterStep, randomZoneCenter,
  type Dir, type KickResult, type Outcome,
} from './logic';

interface Result {
  won: boolean;
  message: string;
  points: number;
  reason: string;
  achievement?: string;
}

interface Fail {
  message: string;
  points: number;
  reason: string;
  achievement?: string;
}

type Challenge =
  | { kind: 'confess'; text: string; button: string }
  | { kind: 'choice'; text: string; options: string[] }
  | { kind: 'tap'; text: string; icon: string; taps: number };

type Phase = 'aim' | 'shuffle' | 'pick' | 'done';

const X = [30, 50, 70];
const DECOY_X = [34, 50, 66];
const DIVE = ['left', 'center', 'right'] as const;

const rnd = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const REACTIONS: Record<Outcome, string[]> = {
  goal: [
    '🎉 The crowd goes wild. Your mum is crying.',
    '🐐 Somebody call the Ballon d\'Or committee!',
    '😳 Even the keeper clapped. Awkward.',
  ],
  saved: [
    '🧤 The keeper blew you a kiss.',
    '😭 So close. Not close at all, actually.',
    '📉 Your confidence dropped 40%.',
  ],
  wide: [
    '🚗 Your ball is now on a motorway.',
    '🛰️ Houston, we have a wide shot.',
  ],
  miss: [
    '🌌 The ball is now a satellite.',
    '🙈 The cameraman looked away out of pity.',
    '💨 That was less a shot, more a suggestion.',
  ],
  var: [
    '📺 VAR is laughing at you in 4K.',
    '🧐 The referee is consulting a horoscope.',
  ],
  decoy: [
    '🤡 You trusted the wrong ball. Classic.',
    '🔮 That ball was a lie. They all are.',
  ],
};

const CHALLENGES: Challenge[] = [
  { kind: 'confess', text: 'Admit it, you\'re not Cristiano Ronaldo.', button: 'Fine, I\'m not CR7 😭' },
  { kind: 'confess', text: 'The goalkeeper owns you. Admit defeat.', button: 'He\'s my landlord now 💀' },
  {
    kind: 'choice',
    text: 'Give us your official excuse.',
    options: ['The ball moved first', 'The goalkeeper cheated', 'The goal was too far away'],
  },
  { kind: 'confess', text: 'Say it with me: the needle was fine, I was the problem.', button: 'The needle was fine 😔' },
  { kind: 'confess', text: 'Sign the official surrender form.', button: 'I surrender (with dignity) 🏳️' },
  { kind: 'choice', text: 'Who should we blame today?', options: ['The wind', 'The grass', 'My thumb'] },
  { kind: 'choice', text: 'Rate your performance.', options: ['10/10 no notes', 'Aura: -500', 'Messi is shaking'] },
  { kind: 'tap', text: 'Apologize to the ball. Tap it 8 times.', icon: '⚽', taps: 8 },
  { kind: 'tap', text: 'Boost the keeper\'s ego. Tap the trophy 10 times.', icon: '🏆', taps: 10 },
  { kind: 'confess', text: 'Promise to blame the referee, not yourself.', button: 'VAR did this 😤' },
  {
    kind: 'choice',
    text: 'Pick your new career.',
    options: ['Goalkeeper\'s assistant', 'Professional ball fetcher', 'Commentator who is always wrong'],
  },
  { kind: 'confess', text: 'Confess your biggest football crime.', button: 'I passed to the other team 🙈' },
  { kind: 'tap', text: 'Charge your excuse battery. Tap it 12 times.', icon: '⚡', taps: 12 },
  {
    kind: 'choice',
    text: 'Choose your walk-off music.',
    options: ['Sad violin', 'Dramatic sigh', 'Silence (it hurts more)'],
  },
  { kind: 'confess', text: 'Wave at the goalkeeper. He earned it.', button: '👋 Hi, boss' },
  {
    kind: 'choice',
    text: 'What did the ball say to you?',
    options: ['Nothing, it ghosted me', 'Skill issue', 'I\'m leaving'],
  },
  { kind: 'tap', text: 'Polish the keeper\'s gloves. Tap them 7 times.', icon: '🧤', taps: 7 },
];

const CHALLENGE_DONE = [
  'Challenge complete. Your dignity has left the building.',
  'The goalkeeper accepted your apology. He did not mean it.',
  'Noted. This has been filed under "Embarrassing".',
  'Honesty detected. The referee is shocked.',
  'Respect. Losing with style is a skill.',
  'The crowd gave you a polite, sad clap. 👏',
];

function Keeper({ dive }: { dive: 'none' | 'left' | 'center' | 'right' }) {
  return (
    <svg className={`keeper-svg dive-${dive}`} viewBox="0 0 48 64" width="44" height="58" aria-hidden="true">
      <path d="M15 20 L4 8" stroke="#ffd54a" strokeWidth="6" strokeLinecap="round" />
      <path d="M33 20 L44 8" stroke="#ffd54a" strokeWidth="6" strokeLinecap="round" />
      <circle cx="4" cy="8" r="5" fill="#ff6a00" stroke="#000" strokeWidth="1.5" />
      <circle cx="44" cy="8" r="5" fill="#ff6a00" stroke="#000" strokeWidth="1.5" />
      <rect x="15" y="17" width="18" height="20" rx="4" fill="#ffd54a" stroke="#000" strokeWidth="1.5" />
      <text x="24" y="31" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#000">1</text>
      <circle cx="24" cy="9" r="7" fill="#f2c9a0" stroke="#000" strokeWidth="1.5" />
      <path d="M17 7 Q24 -1 31 7" fill="#3a2410" />
      <rect x="15" y="37" width="18" height="9" fill="#111" />
      <path d="M19 46 L18 58" stroke="#f2c9a0" strokeWidth="5" strokeLinecap="round" />
      <path d="M29 46 L30 58" stroke="#f2c9a0" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="17" cy="60" rx="5" ry="3" fill="#000" />
      <ellipse cx="31" cy="60" rx="5" ry="3" fill="#000" />
    </svg>
  );
}

function swapRandom(o: number[]): number[] {
  const a = Math.floor(Math.random() * 3);
  let b = Math.floor(Math.random() * 3);
  while (b === a) b = Math.floor(Math.random() * 3);
  return o.map((p) => (p === a ? b : p === b ? a : p));
}

interface FootballProps {
  onBack: () => void;
  /** Called after a skip challenge is completed. Defaults to onBack. */
  onComplete?: () => void;
}

export default function FootballRage({ onBack, onComplete }: FootballProps) {
  const { progress, award, completeGame, recordLoss, unlock } = useProgress();
  const [kick, setKick] = useState(0);
  const [score, setScore] = useState(0);
  const [aim, setAim] = useState<Dir>(1);
  const [phase, setPhase] = useState<Phase>('aim');
  const [shot, setShot] = useState<{ dir: Dir; res: KickResult } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [fail, setFail] = useState<Fail | null>(null);
  const [ch, setCh] = useState<Challenge | null>(null);
  const [chDone, setChDone] = useState(false);
  const [chReact, setChReact] = useState('');
  const [taps, setTaps] = useState(0);
  const [reaction, setReaction] = useState('');
  const [pos, setPos] = useState(0);
  const [zoneCenter, setZoneCenter] = useState(randomZoneCenter);
  const [attempts, setAttempts] = useState(0);
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [realId, setRealId] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const hitRef = useRef(false);
  const finished = useRef(false);
  const skipDone = useRef(false);
  const lastCh = useRef(-1);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const pity = Math.max(0, Math.min(attempts - 2, 5));
  const width = zoneWidth(kick, pity);
  const running = phase === 'aim' && result === null && fail === null;
  const isLast = kick === KICKS - 1;
  const moved = goalMoved(kick);
  const spots = keeperSpots(kick);
  const decoys = hasDecoys(kick);

  // The swinging needle
  useEffect(() => {
    if (!running) return;
    const step = meterStep(kick, pity);
    const id = setInterval(() => {
      let p = posRef.current + dirRef.current * step;
      if (p >= 100) { p = 100; dirRef.current = -1; }
      else if (p <= 0) { p = 0; dirRef.current = 1; }
      posRef.current = p;
      setPos(p);
    }, 20);
    return () => clearInterval(id);
  }, [running, kick, pity]);

  // The decoy-ball shell game
  useEffect(() => {
    if (phase !== 'shuffle') return;
    const timers: number[] = [];
    setRevealing(true);
    timers.push(window.setTimeout(() => setRevealing(false), 1000));
    const swaps = Math.max(5, 9 + kick - pity);
    const gap = 220 + pity * 40;
    for (let i = 0; i < swaps; i++) {
      timers.push(window.setTimeout(() => setOrder((o) => swapRandom(o)), 1200 + i * gap));
    }
    timers.push(window.setTimeout(() => setPhase('pick'), 1200 + swaps * gap + 300));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, kick, pity]);

  const resolve = (ballOk: boolean, d: Dir = aim) => {
    const res = resolveKick(kick, d, hitRef.current, pity, ballOk);
    setShot({ dir: d, res });
    setReaction(rnd(REACTIONS[res.outcome]));
    setPhase('done');
    if (res.outcome === 'goal') setScore((s) => s + 1);
    if (res.outcome === 'wide' || res.outcome === 'var' || res.outcome === 'decoy') {
      unlock('rule-breaker');
    }
  };

  // dir is given by a swipe; the SHOOT button and Space pass nothing
  const shoot = (dir?: Dir) => {
    if (phase !== 'aim' || result || fail) return;
    const d = dir ?? aim;
    setAim(d);
    hitRef.current = Math.abs(posRef.current - zoneCenter) <= width / 2;
    if (decoys) {
      setRealId(Math.floor(Math.random() * 3));
      setOrder([0, 1, 2]);
      setPhase('shuffle');
    } else {
      resolve(true, d);
    }
  };

  const pickBall = (id: number) => {
    if (phase !== 'pick') return;
    resolve(id === realId);
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const won = score >= WIN_GOALS;
    if (won) {
      const gave = award('football-win', 100);
      completeGame('football');
      const isNew = !progress.achievements.includes('first-rage');
      unlock('first-rage');
      setResult({
        won,
        message: `${score}/${KICKS} goals. The referee is still investigating.`,
        points: gave ? 100 : 0,
        reason: gave ? 'first win' : 'already claimed',
        achievement: isNew ? achievementName('first-rage') : undefined,
      });
    } else {
      const gave = award('football-try', 10);
      recordLoss();
      setAttempts((a) => a + 1);
      const isNew = progress.losses + 1 >= 3 && !progress.achievements.includes('certified-victim');
      if (progress.losses + 1 >= 3) unlock('certified-victim');
      setFail({
        message: `${score}/${KICKS} goals. The game has pity on you and made things slightly easier. Don't tell anyone.`,
        points: gave ? 10 : 0,
        reason: gave ? 'participation' : 'already claimed',
        achievement: isNew ? achievementName('certified-victim') : undefined,
      });
    }
  };

  const resetMeter = () => {
    posRef.current = 0;
    dirRef.current = 1;
    setPos(0);
    setZoneCenter(randomZoneCenter());
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setKick(kick + 1);
      setShot(null);
      setReaction('');
      setPhase('aim');
      resetMeter();
    }
  };

  const replay = () => {
    finished.current = false;
    skipDone.current = false;
    setKick(0);
    setScore(0);
    setAim(1);
    setShot(null);
    setReaction('');
    setPhase('aim');
    setResult(null);
    setFail(null);
    setCh(null);
    setChDone(false);
    setTaps(0);
    resetMeter();
  };

  // ---- Skip challenges ----
  const openChallenge = () => {
    let i = Math.floor(Math.random() * CHALLENGES.length);
    while (i === lastCh.current && CHALLENGES.length > 1) {
      i = Math.floor(Math.random() * CHALLENGES.length);
    }
    lastCh.current = i;
    setCh(CHALLENGES[i]);
    setChDone(false);
    setTaps(0);
  };

  const completeChallenge = () => {
    setChReact(rnd(CHALLENGE_DONE));
    setChDone(true);
  };

  const tapIcon = () => {
    if (!ch || ch.kind !== 'tap' || chDone) return;
    const n = taps + 1;
    setTaps(n);
    if (n >= ch.taps) completeChallenge();
  };

  const finishChallenge = () => {
    if (skipDone.current) return;
    skipDone.current = true;
    award('football-skip', 10); // one-time, so no double rewards
    completeGame('football');
    (onComplete ?? onBack)();
  };

  // ---- Swipe to shoot: swipe up on the pitch, left/right to aim ----
  const swipeDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const swipeUp = (e: React.PointerEvent) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (dy < -40) {
      const d: Dir = dx < -35 ? 0 : dx > 35 ? 2 : 1;
      shoot(d);
    }
  };

  // Keyboard: arrows or A/S/D to aim, Space to shoot
  const shootRef = useRef(shoot);
  shootRef.current = shoot;
  const liveRef = useRef(running);
  liveRef.current = running;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!liveRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') setAim(0);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 's') setAim(1);
      else if (e.key === 'ArrowRight' || e.key === 'd') setAim(2);
      else if (e.key === ' ') { e.preventDefault(); shootRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const keepers: Dir[] = shot ? shot.res.keepers : spots;
  const ballX = X[shot ? shot.dir : aim];
  const ballBottom = shot
    ? shot.res.outcome === 'miss' ? 280
      : shot.res.outcome === 'wide' ? 250
      : shot.res.outcome === 'decoy' ? 40
      : 170
    : 24;

  const warnings: string[] = [];
  if (moved) warnings.push('The goal has moved. It says this is legal.');
  if (spots.length === 2) warnings.push('Two goalkeepers. Aim at the gap.');
  if (decoys) warnings.push('Decoy balls incoming.');

  const message = shot
    ? `${OUTCOME_LABEL[shot.res.outcome]} ${shot.res.message}`
    : phase === 'shuffle'
      ? revealing ? 'THIS is the real ball (it glows). Memorize it!' : 'Keep your eyes on it...'
      : phase === 'pick'
        ? 'Which one is real? Tap it!'
        : hintFor(kick);

  return (
    <section className="fb">
      <div className="fb-top">
        <span>Kick {kick + 1}/{KICKS}</span>
        <span className="fb-board">GOALS {score} (need {WIN_GOALS})</span>
      </div>

      {warnings.length > 0 && phase === 'aim' && !fail && (
        <div className="fb-banner">⚠ {warnings.join(' ')}</div>
      )}

      <div className="fb-pitch" aria-label="Football pitch">
        <div className={`fb-goal ${moved ? 'moved' : ''}`} />

        {keepers.map((d, i) => (
          <div className="fb-keeper" key={i} style={{ left: `${X[d]}%` }}>
            <Keeper dive={shot ? DIVE[d] : 'none'} />
          </div>
        ))}

        <div className="fb-spot" />

        {phase === 'shuffle' || phase === 'pick' ? (
          [0, 1, 2].map((id) => (
            <button
              key={id}
              className={`fb-ball fb-decoy ${revealing && id === realId ? 'glow' : ''}`}
              style={{ left: `${DECOY_X[order[id]]}%`, bottom: 24 }}
              disabled={phase !== 'pick'}
              onClick={() => pickBall(id)}
              aria-label={`Ball ${id + 1}`}
            >
              ⚽
            </button>
          ))
        ) : (
          <div className="fb-ball" style={{ left: `${ballX}%`, bottom: ballBottom }} aria-hidden="true">⚽</div>
        )}

        {running && (
          <div
            className="fb-swipe"
            onPointerDown={swipeDown}
            onPointerUp={swipeUp}
            onPointerCancel={() => { swipeStart.current = null; }}
            aria-hidden="true"
          >
            <span>⬆ SWIPE UP TO SHOOT</span>
          </div>
        )}
      </div>

      <div className="fb-msg" aria-live="polite">
        {message}
        {shot && reaction && <div className="fb-react">{reaction}</div>}
      </div>

      {!fail && (
        <>
          <div className="fb-meter" aria-label="Timing meter">
            <div className="fb-zone" style={{ left: `${zoneCenter - width / 2}%`, width: `${width}%` }} />
            <div className="fb-needle" style={{ left: `${pos}%` }} />
          </div>

          <div className="fb-aim">
            {([0, 1, 2] as Dir[]).map((d) => (
              <ArcadeButton
                key={d}
                variant={aim === d ? 'primary' : 'normal'}
                disabled={phase !== 'aim'}
                onClick={() => setAim(d)}
              >
                {DIR_NAMES[d]}
              </ArcadeButton>
            ))}
          </div>

          {phase === 'aim' && (
            <ArcadeButton variant="danger" onClick={() => shoot()}>SHOOT!</ArcadeButton>
          )}
          {phase === 'done' && (
            <ArcadeButton onClick={next}>{isLast ? 'See Results' : 'Next Kick'}</ArcadeButton>
          )}

          <p className="fb-tip">
            Swipe up on the pitch to shoot (swipe up-left or up-right to aim), or pick a side and press SHOOT
            (or Space) when the needle is inside the green zone. Keys: Left / Up / Right or A / S / D.
          </p>
        </>
      )}

      {fail && !ch && (
        <div className="fb-fail" role="alert">
          <h3>💀 YOU FAILED</h3>
          <p>{fail.message}</p>
          <p className="fb-fail-pts">
            +{fail.points} Rage Points ({fail.reason})
            {fail.achievement && <> · 🏅 {fail.achievement}</>}
          </p>
          <div className="fb-fail-actions">
            <ArcadeButton variant="primary" onClick={replay}>TRY AGAIN</ArcadeButton>
            <ArcadeButton variant="ghost" onClick={openChallenge}>SKIP CHALLENGE</ArcadeButton>
          </div>
        </div>
      )}

      {fail && ch && (
        <div className="fb-challenge">
          <h3>😈 SKIP CHALLENGE</h3>
          <p className="fb-ch-text">{ch.text}</p>

          {!chDone && ch.kind === 'confess' && (
            <ArcadeButton variant="danger" onClick={completeChallenge}>{ch.button}</ArcadeButton>
          )}

          {!chDone && ch.kind === 'choice' && (
            <div className="fb-choices">
              {ch.options.map((o) => (
                <ArcadeButton key={o} variant="normal" onClick={completeChallenge}>{o}</ArcadeButton>
              ))}
            </div>
          )}

          {!chDone && ch.kind === 'tap' && (
            <div className="fb-tapzone">
              <button className="fb-tapbtn" onClick={tapIcon} aria-label="Tap">{ch.icon}</button>
              <div className="fb-tapcount">{taps}/{ch.taps}</div>
            </div>
          )}

          {chDone && (
            <>
              <p className="fb-ch-react">{chReact}</p>
              <p className="fb-fail-pts">+10 Rage Points (first skip only)</p>
              <ArcadeButton variant="primary" onClick={finishChallenge}>CONTINUE</ArcadeButton>
            </>
          )}
        </div>
      )}

      <ResultModal
        open={result !== null}
        won={result?.won ?? false}
        message={result?.message ?? ''}
        points={result?.points ?? 0}
        reason={result?.reason}
        achievement={result?.achievement}
        onReplay={replay}
        onBack={onBack}
      />
    </section>
  );
}