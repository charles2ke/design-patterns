import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CodeExamples } from '../CodeExamples';
import type { PatternExample } from '../../data/pattern-examples';

const example: PatternExample = {
  slug: 'demo',
  snippets: {
    csharp: 'var csharp = 1;',
    java: 'int java = 1;',
    react: 'const react = 1;',
    python: 'python = 1',
    go: 'go := 1',
    rust: 'let rust = 1;',
  },
};

describe('CodeExamples', () => {
  it('shows the first language by default', () => {
    render(<CodeExamples example={example} />);

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('C#');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('var csharp = 1;');
  });

  it('switches the snippet when another language is selected', async () => {
    const user = userEvent.setup();
    render(<CodeExamples example={example} />);

    await user.click(screen.getByRole('tab', { name: 'Rust' }));

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(
      'Rust',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('let rust = 1;');
    expect(screen.getByRole('tab', { name: 'Rust' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('tab', { name: 'Go' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });
});
