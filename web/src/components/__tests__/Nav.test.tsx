import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Nav } from '../Nav';

describe('Nav', () => {
  it('renders both navigation links', () => {
    render(<Nav currentPage="index" />);

    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Algorithms & Data Structures' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quiz' })).toBeInTheDocument();
  });

  it('marks the index link as current when on the index page', () => {
    render(<Nav currentPage="index" />);

    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the best-practices link as current when on the best practices page', () => {
    render(<Nav currentPage="best-practices" />);

    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the quiz link as current when on the quiz page', () => {
    render(<Nav currentPage="quiz" />);

    expect(screen.getByRole('link', { name: 'Quiz' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the algorithms & data structures link as current when on that page', () => {
    render(<Nav currentPage="algorithms-data-structures" />);

    expect(
      screen.getByRole('link', { name: 'Algorithms & Data Structures' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).not.toHaveAttribute('aria-current');
  });
});
