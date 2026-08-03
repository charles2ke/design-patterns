import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableOfContents } from '../TableOfContents';
import type { Pattern } from '../../types/pattern';

const patterns: Pattern[] = [
  {
    id: 1,
    slug: 'singleton',
    name: 'Singleton',
    category: 'Creational',
    intent: 'Ensure a class has only one instance.',
    useWhen: 'You need a shared instance.',
  },
  {
    id: 2,
    slug: 'adapter',
    name: 'Adapter',
    category: 'Structural',
    intent: 'Convert one interface into another.',
    useWhen: 'You need to connect incompatible APIs.',
  },
  {
    id: 3,
    slug: 'builder',
    name: 'Builder',
    category: 'Creational',
    intent: 'Separate construction from representation.',
    useWhen: 'You have many optional configuration steps.',
  },
];

describe('TableOfContents', () => {
  it('renders grouped links for each visible pattern', () => {
    render(<TableOfContents patterns={patterns} />);

    const navigation = screen.getByRole('navigation', {
      name: 'Table of contents',
    });
    const creationalGroup = within(navigation).getByRole('heading', {
      level: 3,
      name: 'Creational',
    });
    const structuralGroup = within(navigation).getByRole('heading', {
      level: 3,
      name: 'Structural',
    });

    expect(creationalGroup).toBeInTheDocument();
    expect(structuralGroup).toBeInTheDocument();
    expect(
      within(navigation).getByRole('link', { name: '1. Singleton' }),
    ).toHaveAttribute('href', '#pattern-singleton');
    expect(
      within(navigation).getByRole('link', { name: '2. Adapter' }),
    ).toHaveAttribute('href', '#pattern-adapter');
    expect(
      within(navigation).getByRole('link', { name: '3. Builder' }),
    ).toHaveAttribute('href', '#pattern-builder');
  });

  it('renders nothing when there are no visible patterns', () => {
    const { container } = render(<TableOfContents patterns={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
