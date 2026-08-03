import { describe, expect, it } from 'vitest';
import { bestPractices } from '../best-practices';
import { BEST_PRACTICE_CATEGORIES } from '../../types/best-practice';

describe('bestPractices dataset', () => {
  it('contains 15 best practices', () => {
    expect(bestPractices).toHaveLength(15);
  });

  it('uses sequential ids from 1 to 15', () => {
    expect(bestPractices.map((p) => p.id)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
  });

  it('has unique slugs and titles', () => {
    expect(new Set(bestPractices.map((p) => p.slug)).size).toBe(15);
    expect(new Set(bestPractices.map((p) => p.title)).size).toBe(15);
  });

  it('only uses known categories', () => {
    for (const practice of bestPractices) {
      expect(BEST_PRACTICE_CATEGORIES).toContain(practice.category);
    }
  });

  it('provides non-empty summary and why fields', () => {
    for (const practice of bestPractices) {
      expect(practice.summary.length).toBeGreaterThan(0);
      expect(practice.why.length).toBeGreaterThan(0);
    }
  });
});
