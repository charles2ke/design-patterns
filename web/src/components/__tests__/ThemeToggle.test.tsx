import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('announces and applies the opposite theme', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole('button', { name: 'Switch to light theme' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
