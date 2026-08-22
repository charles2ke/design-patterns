import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PatternCard } from '../PatternCard';
import type { Pattern } from '../../types/pattern';

const pattern: Pattern = {
  id: 12,
  slug: 'proxy',
  name: 'Proxy',
  category: 'Structural',
  intent: 'Provide a surrogate to control access to another object.',
  useWhen: 'You need lazy loading or access control.',
  flow: [
    'Client calls proxy',
    'Proxy controls access or lifecycle',
    'Real subject handles allowed request',
  ],
};

describe('PatternCard', () => {
  it('renders the pattern details', () => {
    render(<PatternCard pattern={pattern} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '12. Proxy',
    );
    expect(screen.getByText('Structural')).toBeInTheDocument();
    expect(screen.getByText(pattern.intent)).toBeInTheDocument();
    expect(screen.getByText(pattern.useWhen)).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'Visual flow' }),
    ).toBeInTheDocument();
    for (const step of pattern.flow) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.getByTestId('pattern-proxy')).toHaveAttribute(
      'id',
      'pattern-proxy',
    );
  });
});
