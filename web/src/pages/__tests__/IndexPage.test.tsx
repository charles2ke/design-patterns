import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { IndexPage } from '../IndexPage';
import { patterns } from '../../data/patterns';

describe('IndexPage', () => {
  it('lists the whole catalog by default', () => {
    render(<IndexPage />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(patterns.length);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing 23 of 23 patterns',
    );
  });

  it('supports an injected pattern source', () => {
    render(<IndexPage source={patterns.slice(0, 2)} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing 2 of 2 patterns',
    );
  });

  describe('scenario: an engineer looks for a pattern', () => {
    it('filters the catalog while typing and shows a single match', async () => {
      const user = userEvent.setup();
      render(<IndexPage />);

      await user.type(screen.getByLabelText('Search patterns'), 'visitor');

      const list = screen.getByRole('region', { name: 'Design patterns' });
      expect(within(list).getAllByRole('article')).toHaveLength(1);
      expect(screen.getByTestId('pattern-visitor')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Showing 1 of 23 patterns',
      );
    });

    it('combines a category filter with a search term', async () => {
      const user = userEvent.setup();
      render(<IndexPage />);

      await user.click(screen.getByRole('button', { name: 'Creational' }));
      expect(screen.getByRole('status')).toHaveTextContent(
        'Showing 5 of 23 patterns',
      );

      await user.type(screen.getByLabelText('Search patterns'), 'clon');
      expect(screen.getByTestId('pattern-prototype')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(1);
    });

    it('shows the empty state and recovers via "Clear filters"', async () => {
      const user = userEvent.setup();
      render(<IndexPage />);

      await user.type(screen.getByLabelText('Search patterns'), 'graphql');
      expect(
        screen.getByText('No patterns match your filters.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Showing 0 of 23 patterns',
      );

      await user.click(screen.getByRole('button', { name: 'Clear filters' }));

      expect(screen.getByLabelText('Search patterns')).toHaveValue('');
      expect(screen.getAllByRole('article')).toHaveLength(patterns.length);
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('switches between categories', async () => {
      const user = userEvent.setup();
      render(<IndexPage />);

      await user.click(screen.getByRole('button', { name: 'Structural' }));
      expect(screen.getAllByRole('article')).toHaveLength(7);

      await user.click(screen.getByRole('button', { name: 'Behavioral' }));
      expect(screen.getAllByRole('article')).toHaveLength(11);

      await user.click(screen.getByRole('button', { name: 'All' }));
      expect(screen.getAllByRole('article')).toHaveLength(23);
    });
  });
});
