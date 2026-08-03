import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryFilterBar } from '../CategoryFilterBar';

describe('CategoryFilterBar', () => {
  it('renders one button per category plus "All"', () => {
    render(<CategoryFilterBar value="All" onChange={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'All',
      'Creational',
      'Structural',
      'Behavioral',
    ]);
  });

  it('marks the selected category as pressed', () => {
    render(<CategoryFilterBar value="Structural" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Structural' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('notifies the parent when a category is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CategoryFilterBar value="All" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Behavioral' }));

    expect(onChange).toHaveBeenCalledWith('Behavioral');
  });
});
