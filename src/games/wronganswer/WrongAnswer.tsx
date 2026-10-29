import { useRef, useState } from 'react';
import './wronganswer.css';
import ArcadeButton from '../../components/ArcadeButton';
import ResultModal from '../../components/ResultModal';
import { useProgress } from '../../state/ProgressContext';
import { achievementName } from '../../state/achievements';
import { QUESTIONS, PASS_SCORE } from './questions';
import { isAccepted, feedbackFor } from './logic';

interface Result {
  won: boolean;
  message: string;
  points: number;
  reason: string;
  achievement?: string;
}

export default function WrongAnswer({ onBack }: { onBack: () => void }) {
  const { progress, award, completeGame, recordLoss, unlock } = useProgress();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const finished = useRef(false);

  const q = QUESTIONS[index];
  const answered = picked !== null;
  const accepted = answered ? isAccepted(q, picked) : false;
  const isLast = index === QUESTIONS.length - 1;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (isAccepted(q, i)) {
      setScore((s) => s + 1);
      if (q.mode === 'reverse' && i === q.absurd) unlock('rule-breaker');
    }
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const won = score >= PASS_SCORE;
    if (won) {
      const gave = award('wronganswer-win', 100);
      completeGame('wronganswer');
      const isNew = !progress.achievements.includes('first-rage');
      unlock('first-rage');
      setResult({
        won,
        message: `You scored ${score}/${QUESTIONS.length}. The host is furious that you figured it out.`,
        points: gave ? 100 : 0,
        reason: gave ? 'first win' : 'already claimed',
        achievement: isNew ? achievementName('first-rage') : undefined,
      });
    } else {
      const gave = award('wronganswer-try', 10);
      recordLoss();
      const isNew = progress.losses + 1 >= 3 && !progress.achievements.includes('certified-victim');
      if (progress.losses + 1 >= 3) unlock('certified-victim');
      setResult({
        won,
        message: `You scored ${score}/${QUESTIONS.length}. Your confidence has been recorded. Hint: the host loves absurd answers.`,
        points: gave ? 10 : 0,
        reason: gave ? 'participation' : 'already claimed',
        achievement: isNew ? achievementName('certified-victim') : undefined,
      });
    }
  };

  const next = () => (isLast ? finish() : (setIndex(index + 1), setPicked(null)));

  const replay = () => {
    finished.current = false;
    setIndex(0);
    setPicked(null);
    setScore(0);
    setResult(null);
  };

  const hostSays = !answered
    ? q.mode === 'honest'
      ? 'Be careful. I may be telling the truth.'
      : 'Choose wisely. Or confidently. Confidence is worse.'
    : feedbackFor(q, accepted, index);

  return (
    <section className="wa">
      <div className="wa-top">
        <span>Question {index + 1}/{QUESTIONS.length}</span>
        <span>Score {score}</span>
      </div>

      <div className="wa-host">
        <span className="face" aria-hidden="true">🎩</span>
        <div className="says" aria-live="polite">{hostSays}</div>
      </div>

      {q.mode === 'honest' && (
        <div className="wa-rule">⚠ RULE CHANGE: the host is suddenly honest.</div>
      )}

      <p className="wa-question">{q.text}</p>

      <div className="wa-answers">
        {q.answers.map((a, i) => {
          let cls = 'wa-answer';
          let mark = '';
          if (answered && i === picked) {
            cls += accepted ? ' good' : ' bad';
            mark = accepted ? ' ✔' : ' ✖';
          }
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => choose(i)}>
              {a}{mark}
            </button>
          );
        })}
      </div>

      <div className="wa-actions">
        {answered && (
          <ArcadeButton variant="primary" onClick={next}>
            {isLast ? 'See Results' : 'Next Question'}
          </ArcadeButton>
        )}
      </div>

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