import {
  FEATURED_COMPANIES,
  SYSTEM_DESIGN_DIFFICULTIES,
  type Company,
  type FeaturedCompany,
  type SystemDesignDifficulty,
  type SystemDesignQuestion,
} from '../types/system-design';

export type DifficultyFilter = SystemDesignDifficulty | 'All';

/** `'Other'` matches any company without its own featured filter button. */
export type CompanyFilter = FeaturedCompany | 'Other' | 'All';

export const DIFFICULTY_FILTERS: readonly DifficultyFilter[] = [
  'All',
  ...SYSTEM_DESIGN_DIFFICULTIES,
];

export const COMPANY_FILTERS: readonly CompanyFilter[] = [
  'All',
  ...FEATURED_COMPANIES,
  'Other',
];

function isFeaturedCompany(company: Company): company is FeaturedCompany {
  return FEATURED_COMPANIES.some((featured) => featured === company);
}

/** Narrows an untrusted value (e.g. from the URL) to a difficulty filter, defaulting to `'All'`. */
export function toDifficultyFilter(value: string): DifficultyFilter {
  return DIFFICULTY_FILTERS.find((filter) => filter === value) ?? 'All';
}

/** Narrows an untrusted value (e.g. from the URL) to a company filter, defaulting to `'All'`. */
export function toCompanyFilter(value: string): CompanyFilter {
  return COMPANY_FILTERS.find((filter) => filter === value) ?? 'All';
}

export function matchesCompany(
  question: SystemDesignQuestion,
  company: CompanyFilter,
): boolean {
  if (company === 'All') {
    return true;
  }
  if (company === 'Other') {
    return question.companies.some((tagged) => !isFeaturedCompany(tagged));
  }
  return question.companies.includes(company);
}

/** Filters questions by difficulty and by the company that reportedly asked them. */
export function filterSystemDesignQuestions(
  source: readonly SystemDesignQuestion[],
  difficulty: DifficultyFilter,
  company: CompanyFilter,
): SystemDesignQuestion[] {
  return source.filter(
    (question) =>
      (difficulty === 'All' || question.difficulty === difficulty) &&
      matchesCompany(question, company),
  );
}
