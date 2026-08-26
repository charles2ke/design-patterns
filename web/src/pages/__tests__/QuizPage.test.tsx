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

  it('awards the top prize when all answers are correct', async () => {
    const user = userEvent.setup();
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
});
