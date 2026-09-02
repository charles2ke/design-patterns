import { useEffect, useMemo, useState } from 'react';
import { Header } from './Header';
import { shuffle } from '../utils/shuffle';

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
  hint: string;
  correctOptionId: string;
}

export interface QuizGameProps {
  title: string;
  subtitle: string;
  ariaLabel: string;
  cheer: string;
  questions: QuizQuestion[];
}

const PRIZES = [
  '$100',
  '$200',
  '$300',
  '$500',
  '$1,000',
  '$2,000',
  '$4,000',
  '$8,000',
  '$16,000',
  '$32,000',
  '$64,000',
  '$125,000',
  '$250,000',
  '$500,000',
  '$1,000,000',
];

const QUESTION_SECONDS = 30;

const TIMER_CIRCUMFERENCE = 2 * Math.PI * 17;

const CONFETTI_PIECES = Array.from({ length: 20 }, (_, index) => index);

function validateQuestions(questions: QuizQuestion[]): void {
  if (questions.length === 0) {
    throw new Error('QuizGame requires at least one question.');
  }

  const questionWithoutOptions = questions.find((question) => question.options.length === 0);
  if (questionWithoutOptions) {
    throw new Error(
      `QuizGame question ${questionWithoutOptions.id} requires at least one option.`,
    );
  }

  if (questions.length !== PRIZES.length) {
    throw new Error(`QuizGame requires exactly ${PRIZES.length} questions.`);
  }
}

function winningsForLoss(questionIndex: number): string {
  if (questionIndex === 0) return '$0';
  return PRIZES[questionIndex - 1];
}

function removedByFiftyFifty(question: QuizQuestion): string[] {
  return question.options
    .filter((option) => option.id !== question.correctOptionId)
    .slice(0, 2)
    .map((option) => option.id);
}

export function QuizGame({
  title,
  subtitle,
  ariaLabel,
  cheer,
  questions: questionBank,
}: QuizGameProps) {
  validateQuestions(questionBank);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    shuffle(questionBank),
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    () => questions[0].options[0].id,
  );
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [winnings, setWinnings] = useState('$0');
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [removedOptionIds, setRemovedOptionIds] = useState<string[]>([]);
  const [hintVisible, setHintVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [timedOut, setTimedOut] = useState(false);

  const question = questions[questionIndex];
  const questionLabel = useMemo(
    () => `Question ${questionIndex + 1} of ${questions.length}`,
    [questionIndex, questions.length],
  );
  const visibleOptions = question.options.filter(
    (option) => !removedOptionIds.includes(option.id),
  );

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setSecondsLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, questionIndex]);

  useEffect(() => {
    if (gameState !== 'playing' || secondsLeft > 0) return;

    setWinnings(winningsForLoss(questionIndex));
    setTimedOut(true);
    setGameState('lost');
  }, [gameState, questionIndex, secondsLeft]);

  function handleFiftyFifty() {
    const removed = removedByFiftyFifty(question);
    const remaining = question.options.filter(
      (option) => !removed.includes(option.id),
    );
    setRemovedOptionIds(removed);
    setFiftyFiftyUsed(true);
    if (removed.includes(selectedOptionId)) {
      setSelectedOptionId(remaining[0].id);
    }
  }

  function handleHint() {
    setHintUsed(true);
    setHintVisible(true);
  }

  function handleLockAnswer() {
    const isCorrect = selectedOptionId === question.correctOptionId;
    if (isCorrect && questionIndex === questions.length - 1) {
      setWinnings(PRIZES[questionIndex]);
      setGameState('won');
      return;
    }

    if (isCorrect) {
      const nextQuestionIndex = questionIndex + 1;
      setQuestionIndex(nextQuestionIndex);
      setSelectedOptionId(questions[nextQuestionIndex].options[0].id);
      setWinnings(PRIZES[questionIndex]);
      setRemovedOptionIds([]);
      setHintVisible(false);
      setSecondsLeft(QUESTION_SECONDS);
      return;
    }

    setWinnings(winningsForLoss(questionIndex));
    setGameState('lost');
  }

  function restartGame() {
    const reshuffled = shuffle(questionBank);
    setQuestionIndex(0);
    setQuestions(reshuffled);
    setSelectedOptionId(reshuffled[0].options[0].id);
    setGameState('playing');
    setWinnings('$0');
    setFiftyFiftyUsed(false);
    setHintUsed(false);
    setRemovedOptionIds([]);
    setHintVisible(false);
    setSecondsLeft(QUESTION_SECONDS);
    setTimedOut(false);
  }

  return (
    <main className="quiz-page">
      <Header title={title} subtitle={subtitle} />
      <section className="quiz-layout" aria-label={ariaLabel}>
        <article className="quiz-card" aria-live="polite">
          <p className="quiz-card__meta">
            {gameState === 'playing' ? questionLabel : 'Final result'}
          </p>
          {gameState === 'playing' ? (
            <>
              <h2 className="quiz-card__question">{question.prompt}</h2>
              <div
                className={
                  secondsLeft <= 5
                    ? 'quiz-timer quiz-timer--urgent'
                    : 'quiz-timer'
                }
                role="timer"
                aria-label="Time remaining for this question"
              >
                <svg className="quiz-timer__clock" viewBox="0 0 40 40" aria-hidden="true">
                  <circle className="quiz-timer__track" cx="20" cy="20" r="17" />
                  <circle
                    className="quiz-timer__progress"
                    cx="20"
                    cy="20"
                    r="17"
                    style={{
                      strokeDasharray: TIMER_CIRCUMFERENCE,
                      strokeDashoffset:
                        TIMER_CIRCUMFERENCE *
                        (1 - secondsLeft / QUESTION_SECONDS),
                    }}
                  />
                  <line className="quiz-timer__hand" x1="20" y1="20" x2="20" y2="9" />
                </svg>
                <span className="quiz-timer__value">{secondsLeft}s</span>
              </div>
              <div className="quiz-lifelines" aria-label="Lifelines">
                <button
                  type="button"
                  className="quiz-lifeline"
                  onClick={handleFiftyFifty}
                  disabled={fiftyFiftyUsed}
                >
                  50:50
                </button>
                <button
                  type="button"
                  className="quiz-lifeline"
                  onClick={handleHint}
                  disabled={hintUsed}
                >
                  Hint
                </button>
              </div>
              {hintVisible ? (
                <p className="quiz-hint">Hint: {question.hint}</p>
              ) : null}
              <ul className="quiz-options" aria-label="Answer options">
                {visibleOptions.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className="quiz-option"
                      aria-pressed={selectedOptionId === option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                    >
                      <span className="quiz-option__letter">{option.id.toUpperCase()}</span>
                      <span>{option.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="quiz-lock-button"
                onClick={handleLockAnswer}
              >
                Lock answer
              </button>
            </>
          ) : (
            <div
              className={
                gameState === 'won' ? 'quiz-result quiz-result--won' : 'quiz-result'
              }
            >
              {gameState === 'won' ? (
                <div className="quiz-celebration" aria-hidden="true">
                  {CONFETTI_PIECES.map((piece) => (
                    <span
                      key={piece}
                      className="quiz-celebration__piece"
                      style={{
                        left: `${(piece * 100) / CONFETTI_PIECES.length}%`,
                        animationDelay: `${(piece % 5) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <h2>{gameState === 'won' ? 'You won the top prize!' : 'Game over!'}</h2>
              {timedOut ? <p>Time ran out on that question.</p> : null}
              {gameState === 'won' ? (
                <p className="quiz-result__cheer">{cheer}</p>
              ) : null}
              <p>You leave with {winnings}.</p>
              <button type="button" className="quiz-lock-button" onClick={restartGame}>
                Play again
              </button>
            </div>
          )}
        </article>
        <aside className="quiz-ladder" aria-label="Prize ladder">
          <h2>Prize Ladder</h2>
          <ol>
            {PRIZES.map((prize, index) => {
              const isCurrent = questionIndex === index && gameState === 'playing';
              const isReached = index < questionIndex || (gameState === 'won' && index <= questionIndex);
              return (
                <li
                  key={prize}
                  className={
                    isCurrent
                      ? 'quiz-ladder__item quiz-ladder__item--current'
                      : isReached
                        ? 'quiz-ladder__item quiz-ladder__item--reached'
                        : 'quiz-ladder__item'
                  }
                >
                  <span>Q{index + 1}</span>
                  <strong>{prize}</strong>
                </li>
              );
            })}
          </ol>
        </aside>
      </section>
    </main>
  );
}
