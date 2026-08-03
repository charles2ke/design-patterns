import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BestPracticeCard } from '../BestPracticeCard';
import type { BestPractice } from '../../types/best-practice';

const mockPractice: BestPractice = {
  id: 1,
  slug: 'semantic-html',
  title: 'Use Semantic HTML',
  category: 'Accessibility',
  summary: 'Prefer elements that carry meaning.',
  why: 'Screen readers rely on semantic markup.',
};

describe('BestPracticeCard', () => {
  it('renders the title and id', () => {
    render(<BestPracticeCard practice={mockPractice} />);

    expect(
      screen.getByRole('heading', { name: '1. Use Semantic HTML', level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders the category', () => {
    render(<BestPracticeCard practice={mockPractice} />);

    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  it('renders the summary and why sections', () => {
    render(<BestPracticeCard practice={mockPractice} />);

    expect(
      screen.getByText(/Prefer elements that carry meaning/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Screen readers rely on semantic markup/),
    ).toBeInTheDocument();
  });

  it('sets correct id and data-testid attributes', () => {
    render(<BestPracticeCard practice={mockPractice} />);

    const article = screen.getByTestId('practice-semantic-html');
    expect(article).toHaveAttribute('id', 'practice-semantic-html');
  });
});
