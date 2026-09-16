/** A collaborator that takes part in a pattern's structure. */
export interface PatternParticipant {
  name: string;
  role: string;
}

/** Deep-dive content rendered on a pattern detail page. */
export interface PatternDetail {
  /** Slug of the pattern in `data/patterns.ts` this detail belongs to. */
  slug: string;
  /** Concrete situation where the pattern pays off. */
  realWorld: string;
  /** Situations where the pattern adds cost without value. */
  whenNotToUse: string;
  participants: PatternParticipant[];
  /** Benefits the pattern buys you. */
  pros: string[];
  /** Costs the pattern charges you. */
  cons: string[];
  /** Common mistakes seen in real codebases. */
  pitfalls: string[];
  /** Slugs of patterns that are frequently combined or confused with this one. */
  related: string[];
}
