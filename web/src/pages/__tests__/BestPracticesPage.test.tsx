import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BestPracticesPage } from '../BestPracticesPage';
import { bestPractices } from '../../data/best-practices';

describe('BestPracticesPage', () => {
  it('renders the heading and subtitle', () => {
    render(<BestPracticesPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Front-End Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('lists all best practices by default', () => {
    render(<BestPracticesPage />);

    expect(screen.getAllByRole('article')).toHaveLength(bestPractices.length);
    expect(screen.getByRole('status')).toHaveTextContent(
      `${bestPractices.length} of ${bestPractices.length} best practices`,
    );
  });

  it('supports an injected source', () => {
    render(<BestPracticesPage source={bestPractices.slice(0, 3)} />);

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('3 of 3 best practices');
  });

  it('renders a card for each best practice', () => {
    render(<BestPracticesPage source={bestPractices.slice(0, 2)} />);

    expect(
      screen.getByTestId(`practice-${bestPractices[0].slug}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`practice-${bestPractices[1].slug}`),
    ).toBeInTheDocument();
  });

  it('renders an accessible search bar for practices', () => {
    render(<BestPracticesPage />);

    expect(screen.getByLabelText('Search practices')).toBeInTheDocument();
  });
});
