import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../App';

afterEach(() => {
  window.location.hash = '';
});

describe('App', () => {
  it('renders the index page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the best practices page when hash is #/best-practices', () => {
    window.location.hash = '#/best-practices';
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Front-End Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });

  it('switches to the best practices page on hashchange', () => {
    render(<App />);

    act(() => {
      window.location.hash = '#/best-practices';
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(
      screen.getByRole('heading', { name: 'Front-End Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });
});
