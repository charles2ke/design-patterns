import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('explains that nothing matched', () => {
    render(<EmptyState onReset={vi.fn()} />);

    expect(
      screen.getByText('No patterns match your filters.'),
    ).toBeInTheDocument();
  });

  it('calls onReset when the clear button is clicked', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<EmptyState onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
