import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BestPracticesQuizPage } from '../BestPracticesQuizPage';

vi.mock('../../utils/shuffle', () => ({
  shuffle: <T,>(items: readonly T[]): T[] => [...items],
}));

describe('BestPracticesQuizPage', () => {
  it('renders the best practices quiz shell', () => {
    render(<BestPracticesQuizPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be a Best Practices Pro?',
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
    render(<BestPracticesQuizPage />);

    expect(
      screen.getByText(/only one reason to change/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /single responsibility principle/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(screen.getByText(/depend on abstractions/i)).toBeInTheDocument();
  });

  it('ends the game on a wrong answer', async () => {
    const user = userEvent.setup();
    render(<BestPracticesQuizPage />);

    await user.click(
      screen.getByRole('button', { name: /open\/closed principle/i }),
    );
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(
      screen.getByRole('heading', { name: 'Game over!', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('You leave with $0.')).toBeInTheDocument();
  });

  it('reveals a best practices specific hint', async () => {
    const user = userEvent.setup();
    render(<BestPracticesQuizPage />);

    await user.click(screen.getByRole('button', { name: 'Hint' }));

    expect(
      screen.getByText(/how many jobs a class should have/i),
    ).toBeInTheDocument();
  });
});
