import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuizGame, type QuizGameProps, type QuizQuestion } from '../QuizGame';

const props: QuizGameProps = {
  title: 'Quiz',
  subtitle: 'Test your knowledge',
  ariaLabel: 'Quiz game',
  cheer: 'Well done!',
  questions: [],
};

describe('QuizGame', () => {
  it('rejects an empty question bank with a clear error', () => {
    expect(() => render(<QuizGame {...props} />)).toThrow(
      'QuizGame requires at least one question.',
    );
  });

  it('rejects questions without options with a clear error', () => {
    const question: QuizQuestion = {
      id: 1,
      prompt: 'Question?',
      options: [],
      hint: 'Hint',
      correctOptionId: 'a',
    };

    expect(() => render(<QuizGame {...props} questions={[question]} />)).toThrow(
      'QuizGame question 1 requires at least one option.',
    );
  });

  it('rejects a question bank that does not match the prize ladder', () => {
    const question: QuizQuestion = {
      id: 1,
      prompt: 'Question?',
      options: [{ id: 'a', label: 'Answer' }],
      hint: 'Hint',
      correctOptionId: 'a',
    };

    expect(() => render(<QuizGame {...props} questions={[question]} />)).toThrow(
      'QuizGame requires exactly 15 questions.',
    );
  });
});
