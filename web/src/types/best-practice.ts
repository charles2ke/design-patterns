export type BestPracticeCategory =
  | 'Performance'
  | 'Accessibility'
  | 'Code Quality'
  | 'Security'
  | 'Architecture';

export interface BestPractice {
  id: number;
  slug: string;
  title: string;
  category: BestPracticeCategory;
  summary: string;
  why: string;
}

export const BEST_PRACTICE_CATEGORIES: BestPracticeCategory[] = [
  'Performance',
  'Accessibility',
  'Code Quality',
  'Security',
  'Architecture',
];
