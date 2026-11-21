import { describe, expect, it } from 'vitest';
import { urlShortener } from '../../data/system-design/url-shortener';
import type { Company, SystemDesignDifficulty } from '../../types/system-design';
import {
  filterSystemDesignQuestions,
  toCompanyFilter,
  toDifficultyFilter,
  type CompanyFilter,
  type DifficultyFilter,
} from '../filterSystemDesignQuestions';

function question(slug: string, difficulty: SystemDesignDifficulty, companies: Company[]) {
  return { ...urlShortener, slug, difficulty, companies };
}

const source = [
  question('easy-google', 'Easy', ['Google']),
  question('hard-google-stripe', 'Hard', ['Google', 'Stripe']),
  question('hard-openai', 'Hard', ['OpenAI']),
];

function slugs(difficulty: DifficultyFilter, company: CompanyFilter) {
  return filterSystemDesignQuestions(source, difficulty, company).map(({ slug }) => slug);
}

describe('filterSystemDesignQuestions', () => {
  it('combines the difficulty and company filters', () => {
    expect(slugs('All', 'All')).toEqual(['easy-google', 'hard-google-stripe', 'hard-openai']);
    expect(slugs('Hard', 'All')).toEqual(['hard-google-stripe', 'hard-openai']);
    expect(slugs('Hard', 'Google')).toEqual(['hard-google-stripe']);
    expect(slugs('Easy', 'OpenAI')).toEqual([]);
  });

  it('matches "Other" against companies without their own filter', () => {
    expect(slugs('All', 'Other')).toEqual(['hard-google-stripe']);
  });

  it('falls back to "All" for unknown filter values', () => {
    expect(toDifficultyFilter('Hard')).toBe('Hard');
    expect(toDifficultyFilter('Impossible')).toBe('All');
    expect(toCompanyFilter('Other')).toBe('Other');
    expect(toCompanyFilter('Initech')).toBe('All');
  });
});
