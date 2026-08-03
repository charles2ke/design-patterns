import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PatternList } from '../PatternList';
import { patterns } from '../../data/patterns';

describe('PatternList', () => {
  it('renders a card per pattern', () => {
    render(<PatternList patterns={patterns.slice(0, 3)} onReset={vi.fn()} />);

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(
      screen.getByRole('region', { name: 'Design patterns' }),
    ).toBeInTheDocument();
  });

  it('renders the empty state when there is nothing to show', () => {
    render(<PatternList patterns={[]} onReset={vi.fn()} />);

    expect(
      screen.getByText('No patterns match your filters.'),
    ).toBeInTheDocument();
  });
});
