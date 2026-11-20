import { describe, expect, it } from 'vitest';
import { systemDesignQuestions } from '../system-design-questions';
import {
  FEATURED_COMPANIES,
  SYSTEM_DESIGN_DIFFICULTIES,
  type Company,
} from '../../types/system-design';

const COMPANY_ORDER: readonly Company[] = [
  ...FEATURED_COMPANIES,
  'Airbnb',
  'Dropbox',
  'LinkedIn',
  'Lyft',
  'Netflix',
  'Stripe',
  'Uber',
];

function expectUnique(values: readonly string[], context: string) {
  expect(new Set(values).size, context).toBe(values.length);
}

describe('system design questions data', () => {
  it('uses unique slugs and titles', () => {
    expectUnique(
      systemDesignQuestions.map(({ slug }) => slug),
      'slugs',
    );
    expectUnique(
      systemDesignQuestions.map(({ title }) => title),
      'titles',
    );
  });

  it('offers several questions at every difficulty', () => {
    for (const level of SYSTEM_DESIGN_DIFFICULTIES) {
      expect(
        systemDesignQuestions.filter(({ difficulty }) => difficulty === level).length,
        level,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it('tags every featured company on at least one question', () => {
    for (const company of FEATURED_COMPANIES) {
      expect(
        systemDesignQuestions.some(({ companies }) => companies.includes(company)),
        company,
      ).toBe(true);
    }
  });

  it('lists each question’s companies once, in a consistent order', () => {
    for (const { slug, companies } of systemDesignQuestions) {
      expect(companies.length, slug).toBeGreaterThan(0);
      expect(companies, slug).toEqual(
        [...new Set(companies)].sort((a, b) => COMPANY_ORDER.indexOf(a) - COMPANY_ORDER.indexOf(b)),
      );
    }
  });

  it('keeps list entries unique because they double as React keys', () => {
    for (const question of systemDesignQuestions) {
      const lists: Record<string, readonly string[]> = {
        signals: question.signals,
        functional: question.requirements.functional,
        nonFunctional: question.requirements.nonFunctional,
        outOfScope: question.requirements.outOfScope,
        estimates: question.estimates,
        flow: question.architecture.flow,
        deepDives: question.deepDives.map(({ heading }) => heading),
        tradeOffs: question.tradeOffs.map(({ decision }) => decision),
        failureModes: question.failureModes,
        followUps: question.followUps.map(({ question: followUp }) => followUp),
        ...Object.fromEntries(
          question.deepDives.map(({ heading, points }) => [`deep dive "${heading}"`, points]),
        ),
      };
      for (const [name, values] of Object.entries(lists)) {
        expect(values.length, `${question.slug} ${name}`).toBeGreaterThan(0);
        expectUnique(values, `${question.slug} ${name}`);
      }
    }
  });

  it('keeps diagrams to printable ASCII so the monospace layout lines up', () => {
    for (const { slug, architecture } of systemDesignQuestions) {
      expect(architecture.diagram, slug).toMatch(/^[\x20-\x7e\n]+$/);
    }
  });
});
