import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PatternDetailPage } from '../PatternDetailPage';
import { findPatternDetail } from '../../data/pattern-details';

describe('PatternDetailPage', () => {
  it('renders the deep dive for a known pattern', () => {
    const detail = findPatternDetail('observer');
    render(<PatternDetailPage slug="observer" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Observer',
    );
    expect(screen.getByText('Behavioral')).toBeInTheDocument();
    expect(screen.getByText(detail!.whenNotToUse)).toBeInTheDocument();
    expect(screen.getByText(detail!.realWorld)).toBeInTheDocument();
    for (const participant of detail!.participants) {
      expect(screen.getByText(participant.role)).toBeInTheDocument();
    }
    for (const item of [...detail!.pros, ...detail!.cons, ...detail!.pitfalls]) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it('links to related patterns', () => {
    render(<PatternDetailPage slug="observer" />);

    expect(screen.getByRole('link', { name: 'Mediator' })).toHaveAttribute(
      'href',
      '#/patterns/mediator',
    );
  });

  it('renders code examples when snippets exist', () => {
    render(<PatternDetailPage slug="observer" />);

    expect(
      screen.getByRole('heading', { name: 'Code examples' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('omits the examples section for patterns without snippets', () => {
    render(<PatternDetailPage slug="singleton" />);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('shows a not-found message for unknown slugs', () => {
    render(<PatternDetailPage slug="not-a-pattern" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pattern not found',
    );
    expect(
      screen.getByRole('link', { name: 'Back to all patterns' }),
    ).toHaveAttribute('href', '#/');
  });

  it('shows a not-found message when detail content is missing', () => {
    render(
      <PatternDetailPage
        slug="ghost"
        source={[
          {
            id: 99,
            slug: 'ghost',
            name: 'Ghost',
            category: 'Structural',
            intent: 'Intent',
            useWhen: 'Use when',
            flow: ['One'],
          },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pattern not found',
    );
  });

  it('skips related patterns missing from the catalog', () => {
    render(
      <PatternDetailPage
        slug="observer"
        source={[
          {
            id: 19,
            slug: 'observer',
            name: 'Observer',
            category: 'Behavioral',
            intent: 'Intent',
            useWhen: 'Use when',
            flow: ['One'],
          },
        ]}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Mediator' })).toBeNull();
  });
});
