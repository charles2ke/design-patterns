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
      screen.getByRole('heading', { name: 'Design Patterns', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the best practices page when hash is #/best-practices', () => {
    window.location.hash = '#/best-practices';
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Front-End Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });

  it('renders the quiz page when hash is #/quiz', () => {
    window.location.hash = '#/quiz';
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be a Pattern Architect?',
        level: 1,
      }),
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

  it('renders the backend best practices section from hash routing', () => {
    window.location.hash = '#/best-practices/backend';
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Backend Code Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });

  it('switches to the backend best practices section on hashchange', () => {
    render(<App />);

    act(() => {
      window.location.hash = '#/best-practices/backend';
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(
      screen.getByRole('heading', {
        name: 'Backend Code Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the database design best practices section from hash routing', () => {
    window.location.hash = '#/best-practices/database-design';
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the AI first best practices section from hash routing', () => {
    window.location.hash = '#/best-practices/ai-first';
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'AI First Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('switches to the quiz page on hashchange', () => {
    render(<App />);

    act(() => {
      window.location.hash = '#/quiz';
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be a Pattern Architect?',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the algorithms quiz when hash is #/quiz/algorithms-data-structures', () => {
    window.location.hash = '#/quiz/algorithms-data-structures';
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be an Algorithms Ace?',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the best practices quiz when hash is #/quiz/best-practices', () => {
    window.location.hash = '#/quiz/best-practices';
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Who Wants to Be a Best Practices Pro?',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('renders the algorithms and data structures page when hash is #/algorithms-data-structures', () => {
    window.location.hash = '#/algorithms-data-structures';
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Algorithms and Data Structures',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('switches to the algorithms and data structures page on hashchange', () => {
    render(<App />);

    act(() => {
      window.location.hash = '#/algorithms-data-structures';
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(
      screen.getByRole('heading', {
        name: 'Algorithms and Data Structures',
        level: 1,
      }),
    ).toBeInTheDocument();
  });
});
