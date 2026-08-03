import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the index page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the backend best practices page from hash routing', () => {
    window.location.hash = '#backend-best-practices';
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Backend Code Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });

  it('switches pages after hash changes', async () => {
    render(<App />);

    act(() => {
      window.location.hash = '#backend-best-practices';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'Backend Code Best Practices',
          level: 1,
        }),
      ).toBeInTheDocument();
    });
  });
});
