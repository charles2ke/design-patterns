export type BestPracticeCategory =
  | 'Clarity'
  | 'Architecture'
  | 'Testing'
  | 'Collaboration'
  | 'Safety';

export interface BestPractice {
  id: number;
  slug: string;
  title: string;
  category: BestPracticeCategory;
  description: string;
  rationale: string;
}

export const BEST_PRACTICE_CATEGORIES: BestPracticeCategory[] = [
  'Clarity',
  'Architecture',
  'Testing',
  'Collaboration',
  'Safety',
];
