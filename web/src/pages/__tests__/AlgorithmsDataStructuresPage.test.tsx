import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlgorithmsDataStructuresPage } from '../AlgorithmsDataStructuresPage';

describe('AlgorithmsDataStructuresPage', () => {
  it('renders heading, overview, and core sections', () => {
    render(<AlgorithmsDataStructuresPage />);

    expect(
      screen.getByRole('heading', { name: 'Algorithms and Data Structures', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Core algorithm concepts', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Common data structures', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Algorithmic complexity (Big O)', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Searching', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sorting', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recursion', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Graphs and trees', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Practical guidance', level: 2 }),
    ).toBeInTheDocument();
  });
});
