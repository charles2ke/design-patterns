import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SolidPrinciplesPage } from '../SolidPrinciplesPage';

describe('SolidPrinciplesPage', () => {
  it('renders heading and core sections', () => {
    render(<SolidPrinciplesPage />);

    expect(
      screen.getByRole('heading', { name: 'SOLID Principles', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Single responsibility', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Open/closed', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Liskov substitution', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Interface segregation', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Dependency inversion', level: 2 }),
    ).toBeInTheDocument();
  });

  it('links to the SOLID principles Copilot skill', () => {
    render(<SolidPrinciplesPage />);

    expect(screen.getByTestId('skill-link-solid-principles')).toHaveAttribute(
      'href',
      'https://github.com/charles2ke/design-patterns/blob/main/.github/skills/solid-principles/SKILL.md',
    );
  });
});
