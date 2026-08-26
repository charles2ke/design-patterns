import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { bestPractices } from '../best-practices';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const skillsDir = path.join(repoRoot, '.github', 'skills');

const skills = [
  'frontend-best-practices',
  'backend-best-practices',
  'database-design-best-practices',
  'ai-first-best-practices',
];

function readSkill(skill: string): string {
  return readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
}

describe('best-practice skills', () => {
  it.each(skills)('%s exists with valid frontmatter and a checklist', (skill) => {
    const content = readSkill(skill);

    expect(content.startsWith('---\n')).toBe(true);
    const frontmatter = content.slice(4, content.indexOf('\n---', 4));
    expect(frontmatter).toContain(`name: ${skill}`);
    expect(frontmatter).toMatch(/description: \S/);
    expect(content).toContain('## Checklist');
  });

  it('frontend skill covers every practice on the site', () => {
    const content = readSkill('frontend-best-practices');
    const covers = /<!-- covers: (.+?) -->/.exec(content);

    expect(covers).not.toBeNull();
    const covered = covers![1].split(',').map((slug) => slug.trim());

    expect([...covered].sort()).toEqual(bestPractices.map((p) => p.slug).sort());
  });
});
