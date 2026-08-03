<<<<<<< HEAD
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
=======
import { render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
>>>>>>> origin/main
import { App } from '../App';

afterEach(() => {
  window.location.hash = '';
});

describe('App', () => {
<<<<<<< HEAD
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the index page', () => {
=======
  let originalPathname = '/';

  beforeEach(() => {
    originalPathname = window.location.pathname;
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalPathname);
  });

  it('renders the index page on the root path', () => {
    window.history.replaceState({}, '', '/');
>>>>>>> origin/main
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
    ).toBeInTheDocument();
  });

<<<<<<< HEAD
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
      window.dispatchEvent(new Event('hashchange'));
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'Backend Code Best Practices',
          level: 1,
        }),
      ).toBeInTheDocument();
    });
=======
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
>>>>>>> origin/main
  });
});
