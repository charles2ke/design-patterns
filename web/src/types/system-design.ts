export type SystemDesignDifficulty = 'Easy' | 'Medium' | 'Hard';

export const SYSTEM_DESIGN_DIFFICULTIES: readonly SystemDesignDifficulty[] = [
  'Easy',
  'Medium',
  'Hard',
];

/** Companies with their own filter button; every other company is grouped under "Other". */
export const FEATURED_COMPANIES = [
  'Google',
  'Amazon',
  'Microsoft',
  'Meta',
  'OpenAI',
  'Anthropic',
  'Apple',
] as const;

export type FeaturedCompany = (typeof FEATURED_COMPANIES)[number];

export type OtherCompany =
  | 'Airbnb'
  | 'Dropbox'
  | 'LinkedIn'
  | 'Lyft'
  | 'Netflix'
  | 'Stripe'
  | 'Uber';

export type Company = FeaturedCompany | OtherCompany;

export type CodeLanguage = 'TypeScript';

export interface DesignSection {
  heading: string;
  points: string[];
}

export interface TradeOff {
  decision: string;
  choice: string;
  rationale: string;
}

export interface FollowUp {
  question: string;
  answer: string;
}

export interface SystemDesignCodeSample {
  label: string;
  language: CodeLanguage;
  code: string;
}

export interface SystemDesignQuestion {
  slug: string;
  title: string;
  difficulty: SystemDesignDifficulty;
  /** Companies where candidates have publicly reported this prompt (or a close variant). */
  companies: Company[];
  /** The prompt as an interviewer would state it. */
  prompt: string;
  /** What the interviewer is actually evaluating. */
  signals: string[];
  requirements: {
    functional: string[];
    nonFunctional: string[];
    outOfScope: string[];
  };
  /** Back-of-the-envelope capacity estimates. */
  estimates: string[];
  api: string;
  dataModel: string;
  architecture: {
    /** Monospace diagram; the flow steps are its text alternative. */
    diagram: string;
    flow: string[];
  };
  deepDives: DesignSection[];
  tradeOffs: TradeOff[];
  failureModes: string[];
  code: SystemDesignCodeSample;
  followUps: FollowUp[];
}
