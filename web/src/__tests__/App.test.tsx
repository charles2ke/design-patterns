import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('renders the index page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
  });
});
