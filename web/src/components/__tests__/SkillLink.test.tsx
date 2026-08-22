import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SKILLS_BASE_URL, SkillLink } from '../SkillLink';

describe('SkillLink', () => {
  it('links to the matching SKILL.md file', () => {
    render(<SkillLink skill="backend-best-practices" />);

    const link = screen.getByRole('link', {
      name: 'Copilot skill on GitHub',
    });

    expect(link).toHaveAttribute(
      'href',
      `${SKILLS_BASE_URL}/backend-best-practices/SKILL.md`,
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
