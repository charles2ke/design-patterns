import { describe, expect, it } from 'vitest';
import { patterns } from '../patterns';
import { PATTERN_CATEGORIES } from '../../types/pattern';

describe('patterns dataset', () => {
  it('contains the 23 Gang of Four patterns', () => {
    expect(patterns).toHaveLength(23);
  });

  it('uses sequential ids from 1 to 23', () => {
    expect(patterns.map((pattern) => pattern.id)).toEqual(
      Array.from({ length: 23 }, (_, index) => index + 1),
    );
  });

  it('has unique slugs and names', () => {
    expect(new Set(patterns.map((p) => p.slug)).size).toBe(23);
    expect(new Set(patterns.map((p) => p.name)).size).toBe(23);
  });

  it('only uses known categories with the expected distribution', () => {
    for (const pattern of patterns) {
      expect(PATTERN_CATEGORIES).toContain(pattern.category);
    }
    expect(patterns.filter((p) => p.category === 'Creational')).toHaveLength(5);
    expect(patterns.filter((p) => p.category === 'Structural')).toHaveLength(7);
    expect(patterns.filter((p) => p.category === 'Behavioral')).toHaveLength(11);
  });

  it('provides non-empty intent and usage guidance', () => {
    for (const pattern of patterns) {
      expect(pattern.intent.length).toBeGreaterThan(0);
      expect(pattern.useWhen.length).toBeGreaterThan(0);
    }
  });

  it('provides visual flow steps for every pattern', () => {
    for (const pattern of patterns) {
      expect(pattern.flow).toHaveLength(3);
      for (const step of pattern.flow) {
        expect(step.length).toBeGreaterThan(0);
      }
    }
  });
});
