import { render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';

afterEach(() => {
  window.location.hash = '';
});

describe('App', () => {
  let originalPathname = '/';

  beforeEach(() => {
    originalPathname = window.location.pathname;
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalPathname);
  });

  it('renders the index page on the root path', () => {
    window.history.replaceState({}, '', '/');
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

  it('renders the database design page on its path', () => {
    window.history.replaceState({}, '', '/database-design-best-practices');
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the database design page under a base path', () => {
    window.history.replaceState(
      {},
      '',
      '/design-patterns/database-design-best-practices',
    );
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });
});
