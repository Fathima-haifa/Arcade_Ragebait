import { useEffect, useRef, useState } from 'react';
import './heavenhell.css';
import ArcadeButton from '../../components/ArcadeButton';
import ResultModal from '../../components/ResultModal';
import { useProgress } from '../../state/ProgressContext';
import { achievementName } from '../../state/achievements';
import { CASES } from './cases';
import {
  STEPS, CHALLENGE_SECONDS, TIMEOUT_VALUE, VERDICTS,
  applyRule, timeLimit, tapsNeeded, getVerdict,
} from './logic';

interface Result {
  won: boolean;
  message: string;
  points: number;
  reason: string;
  achievement?: string;
}

type Phase = 'intro' | 'case' | 'challenge' | 'feedback';

export default function AfterlifeTrial({ onBack }: { onBack: () => void }) {
  const { progress, award, completeGame, recordLoss, unlock } = useProgress();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [net, setNet] = useState(0);
  const [timeouts, setTimeouts] = useState(0);
  const [challengeOk, setChallengeOk] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [taps, setTaps] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const finished = useRef(false);

  const pity = Math.min(attempts, 4);
  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const trialCase = current.kind === 'case' ? CASES[current.index] : null;
  const needed = tapsNeeded(pity);

  const startStep = (s: number) => {
    const st = STEPS[s];
    setStep(s);
    setTaps(0);
    if (st.kind === 'case') {
      setPhase('case');
      setTimeLeft(timeLimit(s, pity));
    } else {
      setPhase('challenge');
      setTimeLeft(CHALLENGE_SECONDS);
    }
  };

  // One-second countdown for cases and the challenge
  useEffect(() => {
    if (phase !== 'case' && phase !== 'challenge') return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, step]);

  const answer = (optionIndex: number | null) => {
    if (phase !== 'case' || !trialCase) return;
    if (optionIndex === null) {
      setNet((n) => n + TIMEOUT_VALUE);
      setTimeouts((t) => t + 1);
      setFeedback("Time's up. The paperwork gained a little sentience.");
    } else {
      const opt = trialCase.options[optionIndex];
      setNet((n) => n + applyRule(trialCase.rule, opt.value));
      setFeedback(opt.reply);
      if (trialCase.rule === 'reverse') unlock('rule-breaker');
    }
    setPhase('feedback');
  };

  // Case timer ran out
  useEffect(() => {
    if (phase === 'case' && timeLeft <= 0) answer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Challenge timer ran out
  useEffect(() => {
    if (phase === 'challenge' && timeLeft <= 0) {
      const ok = taps >= needed;
      setChallengeOk(ok);
      setFeedback(
        ok
          ? 'The paperwork is signed. The paperwork seems... impressed.'
          : `Only ${taps} signatures. The paperwork is disappointed.`
      );
      setPhase('feedback');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const verdict = getVerdict(net, timeouts, challengeOk);
    const info = VERDICTS[verdict];
    const text = `${info.title}. ${info.message}`;
    if (info.won) {
      const gave = award('heavenhell-win', 100);
      completeGame('heavenhell');
      const isNew = !progress.achievements.includes('first-rage');
      unlock('first-rage');
      setResult({
        won: true,
        message: text,
        points: gave ? 100 : 0,
        reason: gave ? 'first win' : 'already claimed',
        achievement: isNew ? achievementName('first-rage') : undefined,
      });
    } else {
      const gave = award('heavenhell-try', 10);
      recordLoss();
      setAttempts((a) => a + 1);
      const isNew = progress.losses + 1 >= 3 && !progress.achievements.includes('certified-victim');
      if (progress.losses + 1 >= 3) unlock('certified-victim');
      setResult({
        won: false,
        message: `${text} Tip: read the rule banner, and do not ignore the clock.`,
        points: gave ? 10 : 0,
        reason: gave ? 'participation' : 'already claimed',
        achievement: isNew ? achievementName('certified-victim') : undefined,
      });
    }
  };

  const nextStep = () => (isLastStep ? finish() : startStep(step + 1));

  const replay = () => {
    finished.current = false;
    setNet(0);
    setTimeouts(0);
    setChallengeOk(false);
    setResult(null);
    setFeedback('');
    setPhase('intro');
    setStep(0);
  };

  const pinLeft = Math.max(5, Math.min(95, 50 + net * 5));

  return (
    <section className="hh">
      <div className="hh-top">
        <span>{phase === 'intro' ? 'The Afterlife Trial' : `Step ${step + 1}/${STEPS.length}`}</span>
        {(phase === 'case' || phase === 'challenge') && (
          <span className={`hh-timer ${timeLeft <= 3 ? 'low' : ''}`}>⏱ {Math.max(0, timeLeft)}s</span>
        )}
      </div>

      <div className="hh-scale" aria-label="Verdict scale">
        <span aria-hidden="true">☁️</span>
        <div className="hh-bar"><div className="hh-pin" style={{ left: `${pinLeft}%` }} /></div>
        <span aria-hidden="true">🔥</span>
      </div>

      <div className="hh-cast" aria-hidden="true">
        <span className="hh-char">😇</span>
        <span className="hh-char">👨‍⚖️</span>
        <span className="hh-char">😈</span>
      </div>

      {phase === 'intro' && (
        <div>
          <p className="hh-title">You have died. Congratulations?</p>
          <div className="hh-box">
            The judge will hear 4 cases and one paperwork challenge. Answer before the clock runs out.
            The rules may change without warning. The angel and the devil both give advice.
            Neither is legally qualified.
          </div>
          <ArcadeButton variant="primary" onClick={() => startStep(0)}>Begin Trial</ArcadeButton>
        </div>
      )}

      {phase === 'case' && trialCase && (
        <div>
          <p className="hh-title">{trialCase.title}</p>
          <div className="hh-box">
            <strong>Accusation:</strong> {trialCase.accusation}
            <br />
            <em>{trialCase.evidence}</em>
          </div>
          <div className="hh-rule">⚠ {trialCase.ruleText}</div>
          <p className="hh-advice">{trialCase.angel}<br />{trialCase.devil}</p>
          <div className="hh-options">
            {trialCase.options.map((o, i) => (
              <button key={i} className="hh-opt" onClick={() => answer(i)}>{o.text}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'challenge' && (
        <div>
          <p className="hh-title">Sign the Paperwork!</p>
          <div className="hh-box">
            Tap SIGN {needed} times before the clock hits zero. Signatures: {taps}/{needed}
          </div>
          <button className="hh-opt hh-big" onClick={() => setTaps((t) => t + 1)}>✍ SIGN ({taps})</button>
        </div>
      )}

      {phase === 'feedback' && (
        <div>
          <div className="hh-box" aria-live="polite">{feedback}</div>
          <ArcadeButton variant="primary" onClick={nextStep}>
            {isLastStep ? 'Hear the Verdict' : 'Next'}
          </ArcadeButton>
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