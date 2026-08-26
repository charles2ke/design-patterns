import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { shuffle } from '../utils/shuffle';

interface QuizOption {
  id: string;
  label: string;
}

interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
  hint: string;
  correctOptionId: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt:
      'Which pattern ensures only one object instance exists and provides global access to it?',
    options: [
      { id: 'a', label: 'Singleton' },
      { id: 'b', label: 'Builder' },
      { id: 'c', label: 'Decorator' },
      { id: 'd', label: 'Mediator' },
    ],
    hint:
      'Think about a class that guards its own single instance behind a static accessor.',
    correctOptionId: 'a',
  },
  {
    id: 2,
    prompt:
      'Which structural pattern wraps an object to add behavior dynamically at runtime?',
    options: [
      { id: 'a', label: 'Facade' },
      { id: 'b', label: 'Decorator' },
      { id: 'c', label: 'Flyweight' },
      { id: 'd', label: 'Bridge' },
    ],
    hint:
      'It wraps the original object and shares its interface, layering behavior on top.',
    correctOptionId: 'b',
  },
  {
    id: 3,
    prompt:
      'Which behavioral pattern lets multiple handlers process a request in sequence?',
    options: [
      { id: 'a', label: 'Observer' },
      { id: 'b', label: 'Strategy' },
      { id: 'c', label: 'Chain of Responsibility' },
      { id: 'd', label: 'Template Method' },
    ],
    hint:
      'Each handler either handles the request or passes it to the next link.',
    correctOptionId: 'c',
  },
  {
    id: 4,
    prompt:
      'When you need interchangeable algorithms selected at runtime, which pattern fits best?',
    options: [
      { id: 'a', label: 'Prototype' },
      { id: 'b', label: 'Strategy' },
      { id: 'c', label: 'Proxy' },
      { id: 'd', label: 'Visitor' },
    ],
    hint:
      'The algorithm is swapped by composing a different implementation object.',
    correctOptionId: 'b',
  },
  {
    id: 5,
    prompt:
      'Which pattern captures and restores object state to support undo/rollback?',
    options: [
      { id: 'a', label: 'Memento' },
      { id: 'b', label: 'Interpreter' },
      { id: 'c', label: 'Adapter' },
      { id: 'd', label: 'Factory Method' },
    ],
    hint:
      'Its name comes from the idea of keeping a souvenir of a past state.',
    correctOptionId: 'a',
  },
  {
    id: 6,
    prompt:
      'Which creational pattern separates the construction of a complex object from its representation?',
    options: [
      { id: 'a', label: 'Builder' },
      { id: 'b', label: 'Singleton' },
      { id: 'c', label: 'Observer' },
      { id: 'd', label: 'Composite' },
    ],
    hint:
      'It uses a step-by-step director to assemble parts of an object.',
    correctOptionId: 'a',
  },
  {
    id: 7,
    prompt:
      'Which pattern converts the interface of a class into another interface clients expect?',
    options: [
      { id: 'a', label: 'Proxy' },
      { id: 'b', label: 'Adapter' },
      { id: 'c', label: 'Command' },
      { id: 'd', label: 'State' },
    ],
    hint:
      'Think of a power plug converter between incompatible sockets.',
    correctOptionId: 'b',
  },
  {
    id: 8,
    prompt:
      'Which pattern notifies dependent objects automatically whenever the subject changes state?',
    options: [
      { id: 'a', label: 'Iterator' },
      { id: 'b', label: 'Abstract Factory' },
      { id: 'c', label: 'Observer' },
      { id: 'd', label: 'Facade' },
    ],
    hint:
      'Subscribers register with a subject and are notified on change.',
    correctOptionId: 'c',
  },
  {
    id: 9,
    prompt:
      'Which structural pattern offers a simplified entry point to a complex subsystem?',
    options: [
      { id: 'a', label: 'Bridge' },
      { id: 'b', label: 'Facade' },
      { id: 'c', label: 'Mediator' },
      { id: 'd', label: 'Prototype' },
    ],
    hint:
      'It hides subsystem complexity behind one friendly interface.',
    correctOptionId: 'b',
  },
  {
    id: 10,
    prompt:
      'Which creational pattern builds new objects by cloning an existing instance?',
    options: [
      { id: 'a', label: 'Prototype' },
      { id: 'b', label: 'Factory Method' },
      { id: 'c', label: 'Flyweight' },
      { id: 'd', label: 'Strategy' },
    ],
    hint:
      'It copies an existing object instead of constructing one from scratch.',
    correctOptionId: 'a',
  },
  {
    id: 11,
    prompt:
      'Which structural pattern decouples an abstraction from its implementation so both can vary independently?',
    options: [
      { id: 'a', label: 'Decorator' },
      { id: 'b', label: 'Composite' },
      { id: 'c', label: 'Bridge' },
      { id: 'd', label: 'Memento' },
    ],
    hint:
      'It uses composition, not inheritance, to pair two class hierarchies.',
    correctOptionId: 'c',
  },
  {
    id: 12,
    prompt:
      'Which pattern supplies a placeholder that controls access to another object?',
    options: [
      { id: 'a', label: 'Proxy' },
      { id: 'b', label: 'Adapter' },
      { id: 'c', label: 'Builder' },
      { id: 'd', label: 'Interpreter' },
    ],
    hint:
      'It stands in for the real object and can add lazy loading or access checks.',
    correctOptionId: 'a',
  },
  {
    id: 13,
    prompt:
      'Which pattern reduces memory use by sharing intrinsic state across many similar objects?',
    options: [
      { id: 'a', label: 'Singleton' },
      { id: 'b', label: 'Flyweight' },
      { id: 'c', label: 'Command' },
      { id: 'd', label: 'Visitor' },
    ],
    hint:
      'It shares immutable state between many fine-grained objects.',
    correctOptionId: 'b',
  },
  {
    id: 14,
    prompt:
      'Which behavioral pattern defines an algorithm skeleton in a base class and defers steps to subclasses?',
    options: [
      { id: 'a', label: 'State' },
      { id: 'b', label: 'Iterator' },
      { id: 'c', label: 'Mediator' },
      { id: 'd', label: 'Template Method' },
    ],
    hint:
      'The base class fixes the order of steps; subclasses fill in the blanks.',
    correctOptionId: 'd',
  },
  {
    id: 15,
    prompt:
      'Which behavioral pattern adds new operations to an object structure without modifying its classes?',
    options: [
      { id: 'a', label: 'Visitor' },
      { id: 'b', label: 'Observer' },
      { id: 'c', label: 'Chain of Responsibility' },
      { id: 'd', label: 'Decorator' },
    ],
    hint:
      'Operations move out of the element classes into a separate traversing class.',
    correctOptionId: 'a',
  },
];

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

export function QuizPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    shuffle(QUESTIONS),
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
    const reshuffled = shuffle(QUESTIONS);
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
      <Header
        title="Who Wants to Be a Pattern Architect?"
        subtitle="A modern millionaire-style challenge about design patterns."
      />
      <section className="quiz-layout" aria-label="Design patterns quiz">
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
                <p className="quiz-result__cheer">Congratulations, Pattern Architect!</p>
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
