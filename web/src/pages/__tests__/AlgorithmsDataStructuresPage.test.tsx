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

  it('renders a code example for every data structure and algorithm', () => {
    const { container } = render(<AlgorithmsDataStructuresPage />);

    const labels = Array.from(
      container.querySelectorAll('.algorithms-page__example-label'),
    ).map((element) => element.textContent ?? '');

    for (const expected of [
      'Example: array',
      'Example: singly linked list',
      'Example: stack (LIFO) and queue (FIFO)',
      'Example: map and set',
      'Example: binary search tree insert',
      'Example: graph as an adjacency list',
      'Example: linear search',
      'Example: binary search',
      'Example: hash-based lookup',
      'Example: insertion sort',
      'Example: merge sort',
      'Example: quicksort',
      'Example: recursion with a base case',
      'Example: memoized recursion',
      'Example: depth-first search',
      'Example: breadth-first search',
      "Example: Dijkstra's shortest distances",
    ]) {
      expect(labels).toContain(expected);
    }

    expect(container.querySelectorAll('.algorithms-page__example pre code').length).toBe(
      labels.length,
    );
  });
});
