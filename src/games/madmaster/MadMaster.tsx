import { useEffect, useRef, useState } from 'react';
import './madmaster.css';
import ArcadeButton from '../../components/ArcadeButton';
import CharacterAvatar from '../../components/CharacterAvatar';
import { CHARACTERS } from '../../state/character';
import type { CharacterId } from '../../state/character';
import { useProgress } from '../../state/ProgressContext';
import {
  PLAYER_MAX, BOSS_MAX, ENERGY_CAP, SPECIAL_COST,
  newFight, tick, playerAttack, playerSpecial, playerDefend,
  type Fight, type Phase,
} from './combat';

export function BossSprite({ phase = 1, className = '' }: { phase?: Phase; className?: string }) {
  const eye = phase === 3 ? '#ffffff' : '#19e3ff';
  return (
    <svg className={`mm-sprite ${className}`} viewBox="0 0 24 30" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" fill="#0b1a3a" />
      <rect x="6" y="6" width="12" height="6" fill="#0b1a3a" />
      <rect x="8" y="7" width="8" height="4" fill="#000" />
      <rect x="9" y="8" width="2" height="2" fill={eye} />
      <rect x="13" y="8" width="2" height="2" fill={eye} />
      <rect x="4" y="12" width="16" height="14" fill="#0b1a3a" />
      <rect x="4" y="12" width="16" height="1" fill="#19e3ff" />
      <rect x="11" y="16" width="2" height="2" fill="#19e3ff" />
      <rect x="2" y="24" width="3" height="4" fill="#0b1a3a" />
      <rect x="19" y="24" width="3" height="4" fill="#0b1a3a" />
      <rect x="0" y="15" width="5" height="3" fill="#0b1a3a" />
      <rect x="0" y="17" width="6" height="4" fill="#030814" stroke="#e8f6ff" strokeWidth=".5" />
      <rect x="1.5" y="18.2" width="2" height=".8" fill="#19e3ff" />
      <rect x="6" y="26" width="4" height="4" fill="#061230" />
      <rect x="14" y="26" width="4" height="4" fill="#061230" />
    </svg>
  );
}

interface Props {
  character: CharacterId;
  onBack: () => void;
  onVictory: () => void;
}

export default function MadMaster({ character, onBack, onVictory }: Props) {
  const { progress, award, completeGame, unlock } = useProgress();
  const [stage, setStage] = useState<'intro' | 'fight'>('intro');
  const fRef = useRef<Fight>(newFight(progress.ragePoints));
  const [fight, setFight] = useState<Fight>(fRef.current);
  const rewarded = useRef(false);

  const hero = CHARACTERS.find((c) => c.id === character) ?? CHARACTERS[0];

  const commit = (f: Fight) => {
    fRef.current = f;
    setFight(f);
  };

  const start = () => {
    unlock('boss-challenger');
    rewarded.current = false;
    commit(newFight(progress.ragePoints));
    setStage('fight');
  };

  // Battle loop
  useEffect(() => {
    if (stage !== 'fight') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(100, now - last);
      last = now;
      if (fRef.current.status !== 'fighting') return;
      const next = tick(fRef.current, dt);
      fRef.current = next;
      setFight(next);
    }, 50);
    return () => clearInterval(id);
  }, [stage]);

  // Rewards: recorded once only
  useEffect(() => {
    if (fight.status !== 'won' || rewarded.current) return;
    rewarded.current = true;
    award('madmaster-win', 300);
    completeGame('madmaster');
    unlock('first-rage');
    unlock('arcade-legend');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fight.status]);

  // Move on to the ending after a short victory pause
  useEffect(() => {
    if (fight.status !== 'won') return;
    const t = window.setTimeout(() => onVictory(), 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fight.status]);

  if (stage === 'intro') {
    return (
      <section className="mm">
        <h2 className="screen-title">THE MAD MASTER</h2>
        <p className="mm-msg">
          {hero.name} versus the Mad Master. He has snacks. He does not share.
        </p>
        <p className="mm-tip">
          ATTACK to hit him and charge energy. SPECIAL ATTACK hits hard and spends energy.
          DEFEND when you see INCOMING. If you fall, the arcade gives you a second wind.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ArcadeButton variant="danger" onClick={start}>FIGHT!</ArcadeButton>
          <ArcadeButton onClick={onBack}>Back</ArcadeButton>
        </div>
      </section>
    );
  }

  const tele = fight.telegraph > 0;

  return (
    <section className="mm">
      <div className="mm-hud">
        <div className="mm-side">
          <div className="mm-name">{hero.name.toUpperCase()}</div>
          <div className="mm-track" role="progressbar" aria-label="Your health"
            aria-valuemin={0} aria-valuemax={PLAYER_MAX} aria-valuenow={fight.playerHp}>
            <div className="mm-fill p" style={{ width: `${(fight.playerHp / PLAYER_MAX) * 100}%` }} />
          </div>
          <div className="mm-track" role="progressbar" aria-label="Battle energy"
            aria-valuemin={0} aria-valuemax={ENERGY_CAP} aria-valuenow={fight.energy}>
            <div className="mm-fill e" style={{ width: `${(fight.energy / ENERGY_CAP) * 100}%` }} />
          </div>
          <div className="mm-small">HP {fight.playerHp} | ENERGY {fight.energy}/{ENERGY_CAP}</div>
        </div>

        <div className="mm-mid">
          FINAL ROUND
          <b>PHASE {fight.phase}</b>
          RAGE {progress.ragePoints}
        </div>

        <div className="mm-side right">
          <div className="mm-name">THE MAD MASTER</div>
          <div className="mm-track" role="progressbar" aria-label="Boss health"
            aria-valuemin={0} aria-valuemax={BOSS_MAX} aria-valuenow={fight.bossHp}>
            <div className="mm-fill b" style={{ width: `${(fight.bossHp / BOSS_MAX) * 100}%` }} />
          </div>
          <div className="mm-small">HP {fight.bossHp}</div>
        </div>
      </div>

      <div className="mm-arena">
        <div className="mm-player">
          <CharacterAvatar id={character} size={150} animated={false} />
          {fight.shield > 0 && <div className="mm-shield" />}
        </div>
        <div className={`mm-boss p${fight.phase} ${tele ? 'tele' : ''}`}>
          <BossSprite phase={fight.phase} />
        </div>
        <div key={fight.fxId} className={`mm-fx ${fight.fx}`} />
      </div>

      {tele && <div className="mm-warn">!! INCOMING: TAP DEFEND !!</div>}
      <div className="mm-msg" aria-live="polite">{fight.msg}</div>

      <div className="mm-controls">
        <ArcadeButton variant="primary" onClick={() => commit(playerAttack(fRef.current))}>
          ATTACK
        </ArcadeButton>
        <ArcadeButton
          variant="danger"
          disabled={fight.energy < SPECIAL_COST}
          onClick={() => commit(playerSpecial(fRef.current))}
        >
          SPECIAL ATTACK
        </ArcadeButton>
        <ArcadeButton disabled={fight.shieldCd > 0} onClick={() => commit(playerDefend(fRef.current))}>
          DEFEND
        </ArcadeButton>
      </div>
    </section>
  );
}