import { describe, expect, it } from 'vitest';
import { findPatternDetail, patternDetails } from '../pattern-details';
import { patterns } from '../patterns';

describe('pattern details dataset', () => {
  it('covers every pattern exactly once', () => {
    expect(patternDetails).toHaveLength(patterns.length);
    expect(patternDetails.map((detail) => detail.slug).sort()).toEqual(
      patterns.map((pattern) => pattern.slug).sort(),
    );
  });

  it('provides usage guidance and participants for every pattern', () => {
    for (const detail of patternDetails) {
      expect(detail.realWorld.length).toBeGreaterThan(0);
      expect(detail.whenNotToUse.length).toBeGreaterThan(0);
      expect(detail.participants.length).toBeGreaterThan(0);
      for (const participant of detail.participants) {
        expect(participant.name.length).toBeGreaterThan(0);
        expect(participant.role.length).toBeGreaterThan(0);
      }
    }
  });

  it('lists trade-offs and pitfalls for every pattern', () => {
    for (const detail of patternDetails) {
      expect(detail.pros.length).toBeGreaterThan(0);
      expect(detail.cons.length).toBeGreaterThan(0);
      expect(detail.pitfalls.length).toBeGreaterThan(0);
    }
  });

  it('only links related patterns that exist and are not self references', () => {
    const slugs = new Set(patterns.map((pattern) => pattern.slug));

    for (const detail of patternDetails) {
      expect(detail.related.length).toBeGreaterThan(0);
      for (const related of detail.related) {
        expect(slugs.has(related)).toBe(true);
        expect(related).not.toBe(detail.slug);
      }
    }
  });

  it('looks details up by slug', () => {
    expect(findPatternDetail('strategy')?.related).toContain('state');
    expect(findPatternDetail('unknown')).toBeUndefined();
  });
});
