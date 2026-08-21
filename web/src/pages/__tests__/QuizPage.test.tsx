import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QuizPage } from '../QuizPage';

describe('QuizPage', () => {
  it('renders the millionaire-style quiz shell', () => {
    render(<QuizPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be a Pattern Architect?',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prize Ladder', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lock answer' })).toBeInTheDocument();
  });

  it('advances to the next question when the correct answer is locked', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /b decorator/i,
      }),
    ).toBeInTheDocument();
  });

  it('ends the game on a wrong answer and allows restart', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: /b builder/i }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(screen.getByRole('heading', { name: 'Game over!', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('You leave with $0.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });

  it('awards the top prize when all answers are correct', async () => {
    const user = userEvent.setup();
    render(<QuizPage />);

    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));
    await user.click(screen.getByRole('button', { name: 'Lock answer' }));

    expect(
      screen.getByRole('heading', { name: 'You won the top prize!', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('You leave with $10,000.')).toBeInTheDocument();
  });
});
