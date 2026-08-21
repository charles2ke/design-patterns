export type PatternCategory = 'Creational' | 'Structural' | 'Behavioral';

export interface Pattern {
  /** Position of the pattern in the classic Gang of Four catalog (1-23). */
  id: number;
  /** URL/DOM friendly identifier. */
  slug: string;
  name: string;
  category: PatternCategory;
  intent: string;
  useWhen: string;
  /** Ordered steps showing the pattern's typical collaboration flow. */
  flow: string[];
}

export const PATTERN_CATEGORIES: PatternCategory[] = [
  'Creational',
  'Structural',
  'Behavioral',
];
