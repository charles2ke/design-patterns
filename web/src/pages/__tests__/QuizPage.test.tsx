import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuizPage } from '../QuizPage';

const identityShuffle = <T,>(items: readonly T[]): T[] => [...items];
const shuffleMock = vi.hoisted(() => ({
  impl: <T,>(items: readonly T[]): T[] => [...items],
}));

vi.mock('../../utils/shuffle', () => ({
  shuffle: <T,>(items: readonly T[]): T[] => shuffleMock.impl(items),
}));

describe('QuizPage', () => {
  afterEach(() => {
    shuffleMock.impl = identityShuffle;
  });

  it('renders the millionaire-style quiz shell', () => {
    render(<QuizPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be a Pattern Architect?',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prize Ladder', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock answer' })).toBeInTheDocument();
  });

  it('advances to the next question when the correct answer is locked', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /decorator/i,
      }),
    ).toBeInTheDocument();
  });

  it('ends the game on a wrong answer and allows restart', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: /builder/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByRole('heading', { name: 'Game over!', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('You leave with $0.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
  });

  it('keeps previously won money when losing after a correct answer', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /bridge/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('You leave with $100.')).toBeInTheDocument();
  });

  it('awards the top prize when all answers are correct', async () => {    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /decorator/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /chain of responsibility/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /strategy/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /memento/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /builder/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /adapter/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /observer/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /facade/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /prototype/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /bridge/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /proxy/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /flyweight/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /template method/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: /visitor/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(
      screen.getByRole('heading', { name: 'You won the top prize!', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('You leave with $1,000,000.')).toBeInTheDocument();
    expect(
      screen.getByText('Congratulations, Pattern Architect!'),
    ).toBeInTheDocument();
    expect(document.querySelector('.quiz-celebration')).not.toBeNull();
  });

  it('removes two wrong answers when the 50:50 lifeline is used', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: '50:50' }));

    expect(screen.getByRole('button', { name: /singleton/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /builder/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decorator/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mediator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50:50' })).toBeDisabled();
  });

  it('keeps a valid selection when 50:50 removes the selected option', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: /builder/i }));
    await user.click(screen.getByRole('button', { name: '50:50' }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
  });

  it('reveals a hint once per game and resets 50:50 removals per question', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: 'Hint' }));

    expect(
      screen.getByText(/guards its own single instance/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(
      screen.queryByText(/guards its own single instance/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hint' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /facade|decorator|flyweight|bridge/i })).toHaveLength(4);
  });

  it('shuffles the question order for each new game', async () => {
    const user = userEvent.setup();
    shuffleMock.impl = <T,>(items: readonly T[]): T[] => [...items].reverse();
    render(<QuizPage />);

    expect(
      screen.getByText(/adds new operations to an object structure/i),
    ).toBeInTheDocument();

    shuffleMock.impl = identityShuffle;
    await user.click(screen.getByRole('button', { name: /observer/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: 'Play again' }));

    expect(
      screen.getByText(/ensures only one object instance exists/i),
    ).toBeInTheDocument();
  });

  it('counts down and ends the game when the 30 second timer expires', async () => {
    vi.useFakeTimers();
    try {
      render(<QuizPage />);

      expect(screen.getByRole('timer')).toHaveTextContent('30s');

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('timer')).toHaveTextContent('29s');

      await act(async () => {
        vi.advanceTimersByTime(29_000);
      });

      expect(
        screen.getByRole('heading', { name: 'Game over!', level: 2 }),
      ).toBeInTheDocument();
      expect(screen.getByText('Time ran out on that question.')).toBeInTheDocument();
      expect(screen.getByText('You leave with $0.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('restarts the countdown for each new question', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    expect(screen.getByRole('timer')).toHaveTextContent('30s');

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('30s');
  });

  it('restores both lifelines after restarting the game', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: '50:50' }));
    await user.click(screen.getByRole('button', { name: 'Hint' }));
    await user.click(screen.getByRole('button', { name: /mediator/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: 'Play again' }));

    expect(screen.getByRole('button', { name: '50:50' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Hint' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /builder/i })).toBeInTheDocument();
  });
});
