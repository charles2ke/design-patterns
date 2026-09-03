import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlgorithmsQuizPage } from '../AlgorithmsQuizPage';

vi.mock('../../utils/shuffle', () => ({
  shuffle: <T,>(items: readonly T[]): T[] => [...items],
}));

describe('AlgorithmsQuizPage', () => {
  it('renders the algorithms quiz shell', () => {
    render(<AlgorithmsQuizPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be an Algorithms Ace?',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lock answer' }),
    ).toBeInTheDocument();
  });

  it('advances when the correct answer is locked', async () => {
    const user = userEvent.setup();
    render(<AlgorithmsQuizPage />);

    expect(
      screen.getByText(/average time complexity of binary search/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /O\(log n\)/ }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(screen.getByText(/last-in, first-out order/i)).toBeInTheDocument();
  });

  it('ends the game on a wrong answer', async () => {
    const user = userEvent.setup();
    render(<AlgorithmsQuizPage />);

    await user.click(screen.getByText('O(n)'));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(
      screen.getByRole('heading', { name: 'Game over!', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('You leave with $0.')).toBeInTheDocument();
  });

  it('reveals an algorithms specific hint', async () => {
    const user = userEvent.setup();
    render(<AlgorithmsQuizPage />);

    await user.click(screen.getByRole('button', { name: 'Hint' }));

    expect(
      screen.getByText(/halves the remaining search space/i),
    ).toBeInTheDocument();
  });
});
