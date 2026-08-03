import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from '../Header';

describe('Header', () => {
  it('renders the title and subtitle', () => {
    render(<Header title="Design Patterns Index" subtitle="23 patterns" />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('23 patterns')).toBeInTheDocument();
  });
});
