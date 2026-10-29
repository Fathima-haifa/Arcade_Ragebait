import { useEffect, useRef, useState } from 'react';
import './madmaster.css';
import ArcadeButton from '../../components/ArcadeButton';
import ResultModal from '../../components/ResultModal';
import { useProgress } from '../../state/ProgressContext';
import { achievementName } from '../../state/achievements';
import {
  PLAYER_MAX, BOSS_MAX, PARRY_MS, newFight, tick, playerAttack, playerSpecial,
  type Fight,
} from './combat';

interface Result {
  won: boolean;
  message: string;
  points: number;
  reason: string;
  achievement?: string;
}

export default function MadMaster({ onBack }: { onBack: () => void }) {
  const { progress, award, completeGame, recordLoss, unlock } = useProgress();
  const [stage, setStage] = useState<'intro' | 'fight'>('intro');
  const fRef = useRef<Fight>(newFight());
  const [fight, setFight] = useState<Fight>(fRef.current);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const heldRef = useRef(false);
  const finished = useRef(false);

  const pity = Math.min(attempts, 4);

  const commit = (f: Fight) => {
    fRef.current = f;
    setFight(f);
  };
  const doAttack = () => commit(playerAttack(fRef.current));
  const doSpecial = () => commit(playerSpecial(fRef.current));

  // Game loop
  useEffect(() => {
    if (stage !== 'fight') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(100, now - last);
      last = now;
      if (fRef.current.status !== 'fighting') return;
      const next = tick(fRef.current, dt, heldRef.current, pity);
      fRef.current = next;
      setFight(next);
    }, 50);
    return () => clearInterval(id);
  }, [stage, pity]);

  // Keyboard: J attack, K / Space defend (hold), L special
  useEffect(() => {
    if (stage !== 'fight') return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'j' || k === 'z') doAttack();
      else if (k === 'l' || k === 'x') doSpecial();
      else if (k === 'k' || k === ' ') {
        e.preventDefault();
        heldRef.current = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'k' || k === ' ') {
        e.preventDefault();
        heldRef.current = false;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [stage]);

  // Fight ended: give rewards once
  useEffect(() => {
    if (stage !== 'fight' || fight.status === 'fighting' || finished.current) return;
    finished.current = true;
    heldRef.current = false;

    if (fight.status === 'won') {
      const gave = award('madmaster-win', 300);
      completeGame('madmaster');
      const isNew = !progress.achievements.includes('arcade-legend');
      unlock('arcade-legend');
      unlock('first-rage');
      setResult({
        won: true,
        message: 'The Mad Master is defeated! He demands a rematch. The arcade bows to you.',
        points: gave ? 300 : 0,
        reason: gave ? 'first boss victory' : 'already claimed',
        achievement: isNew ? achievementName('arcade-legend') : undefined,
      });
    } else {
      const gave = award('madmaster-try', 10);
      recordLoss();
      setAttempts((a) => a + 1);
      const isNew = progress.losses + 1 >= 3 && !progress.achievements.includes('certified-victim');
      if (progress.losses + 1 >= 3) unlock('certified-victim');
      setResult({
        won: false,
        message: `${fight.msg} Tip: start defending in the last half-second of his wind-up to PARRY.`,
        points: gave ? 10 : 0,
        reason: gave ? 'participation' : 'already claimed',
        achievement: isNew ? achievementName('certified-victim') : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fight.status, stage]);

  const start = () => {
    unlock('boss-challenger');
    finished.current = false;
    heldRef.current = false;
    commit(newFight());
    setResult(null);
    setStage('fight');
  };

  const replay = () => start();

  const pPct = (fight.playerHp / PLAYER_MAX) * 100;
  const bPct = (fight.bossHp / BOSS_MAX) * 100;
  const tele = fight.phase === 'telegraph';
  const telePct = tele ? (1 - fight.phaseLeft / fight.phaseTotal) * 100 : 0;
  const cue = tele && fight.phaseLeft <= PARRY_MS + 100;

  let stateText = 'He is thinking about violence...';
  if (tele) stateText = fight.kind === 'heavy' ? '!! HEAVY ATTACK !!' : '! ATTACK !';
  if (fight.phase === 'recover') stateText = 'RECOVERING: he is open, hit him!';
  if (fight.phase === 'stunned') stateText = 'STUNNED: free hits!';
  if (cue) stateText = 'PARRY NOW! (hold Defend)';

  if (stage === 'intro') {
    return (
      <section className="mm">
        <h2 className="screen-title">THE MAD MASTER</h2>
        <p className="mm-msg">
          He has been waiting. He has snacks. He does not share.
        </p>
        <p className="mm-tip">
          Attack to chip him. Hold Defend to block. Start defending in the LAST HALF-SECOND of his
          wind-up to PARRY and stun him. Every 4th move is a bluff (a feint). Fill the meter for a
          Special.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ArcadeButton variant="danger" onClick={start}>FIGHT!</ArcadeButton>
          <ArcadeButton onClick={onBack}>Back</ArcadeButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mm">
      <div className="mm-top">
        <span>THE MAD MASTER</span>
        <span className="mm-timer">⏱ {Math.ceil(fight.timeLeft / 1000)}s</span>
      </div>

      <div className="mm-bars">
        <div>
          <div className="mm-label"><span>YOU</span><span>{fight.playerHp} HP</span></div>
          <div className="mm-track" role="progressbar" aria-label="Your health"
            aria-valuemin={0} aria-valuemax={PLAYER_MAX} aria-valuenow={fight.playerHp}>
            <div className="mm-fill p" style={{ width: `${pPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mm-label"><span>MAD MASTER</span><span>{fight.bossHp} HP</span></div>
          <div className="mm-track" role="progressbar" aria-label="Boss health"
            aria-valuemin={0} aria-valuemax={BOSS_MAX} aria-valuenow={fight.bossHp}>
            <div className="mm-fill b" style={{ width: `${bPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mm-label"><span>SPECIAL</span><span>{fight.meter >= 100 ? 'READY!' : `${fight.meter}%`}</span></div>
          <div className="mm-track"><div className="mm-fill s" style={{ width: `${fight.meter}%` }} /></div>
        </div>
      </div>

      <div className="mm-arena" aria-hidden="true">
        <span className={`mm-fighter player ${fight.defending ? 'defending' : ''}`}>🥋</span>
        <span className={`mm-fighter boss ${tele ? 'telegraph' : ''}`}>👺</span>
        <div key={fight.fxId} className={`mm-fx ${fight.fx}`} />
      </div>

      <div className={`mm-state ${cue ? 'cue' : ''}`}>{stateText}</div>
      <div className="mm-tele"><div className="mm-tele-fill" style={{ width: `${telePct}%` }} /></div>
      <div className="mm-msg" aria-live="polite">{fight.msg}</div>

      <div className="mm-controls">
        <ArcadeButton variant="primary" onClick={doAttack}>⚔ ATTACK</ArcadeButton>
        <ArcadeButton
          onPointerDown={() => { heldRef.current = true; }}
          onPointerUp={() => { heldRef.current = false; }}
          onPointerLeave={() => { heldRef.current = false; }}
          onPointerCancel={() => { heldRef.current = false; }}
          onContextMenu={(e) => e.preventDefault()}
        >
          🛡 DEFEND (hold)
        </ArcadeButton>
        <ArcadeButton variant="danger" disabled={fight.meter < 100} onClick={doSpecial}>
          ⚡ SPECIAL
        </ArcadeButton>
      </div>

      <p className="mm-tip">Keys: J = attack, K or Space (hold) = defend, L = special.</p>

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