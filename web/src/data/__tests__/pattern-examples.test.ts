import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_LANGUAGES,
  findPatternExample,
  patternExamples,
} from '../pattern-examples';
import { patterns } from '../patterns';

describe('pattern examples dataset', () => {
  it('references known patterns only', () => {
    const slugs = new Set(patterns.map((pattern) => pattern.slug));

    for (const example of patternExamples) {
      expect(slugs.has(example.slug)).toBe(true);
    }
  });

  it('provides a snippet for every supported language', () => {
    for (const example of patternExamples) {
      for (const language of EXAMPLE_LANGUAGES) {
        expect(example.snippets[language.id].length).toBeGreaterThan(0);
      }
    }
  });

  it('describes each language with a label and Markdown fence', () => {
    for (const language of EXAMPLE_LANGUAGES) {
      expect(language.label.length).toBeGreaterThan(0);
      expect(language.fence.length).toBeGreaterThan(0);
    }
  });

  it('looks examples up by slug', () => {
    expect(findPatternExample('observer')?.snippets.python).toContain(
      'class Subject',
    );
    expect(findPatternExample('singleton')).toBeUndefined();
  });
});
