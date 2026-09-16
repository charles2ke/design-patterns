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

  it('moves focus and selection with ArrowRight, ArrowLeft, Home, and End', async () => {
    const user = userEvent.setup();
    render(<CodeExamples example={example} />);

    const csharpTab = screen.getByRole('tab', { name: 'C#' });
    csharpTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Rust' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Rust' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Rust' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Rust' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('a');
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'C#' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
