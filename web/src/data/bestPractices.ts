import type { BestPractice } from '../types/bestPractice';

/**
 * Best practices for AI-first code development, covering clarity, architecture,
 * testing, collaboration, and safety.
 */
export const bestPractices: BestPractice[] = [
  {
    id: 1,
    slug: 'explicit-intent',
    title: 'Write explicit intent over clever code',
    category: 'Clarity',
    description:
      'Prefer straightforward, self-documenting code over terse or clever constructs. Name variables, functions, and types to reflect what they represent and why they exist.',
    rationale:
      'AI models generate and review code by pattern-matching context. Explicit naming and structure dramatically improves the quality of suggestions, reduces ambiguity in prompts, and makes AI-generated diffs easier to review.',
  },
  {
    id: 2,
    slug: 'strong-types',
    title: 'Use strong types and schemas as living documentation',
    category: 'Clarity',
    description:
      'Define precise types, interfaces, and validation schemas for all data boundaries. Avoid `any`, untyped objects, or implicit coercions at module edges.',
    rationale:
      'Types are machine-readable specifications. AI assistants use them as grounding context when completing or refactoring code, making outputs safer and more consistent with your domain model.',
  },
  {
    id: 3,
    slug: 'small-focused-modules',
    title: 'Keep modules small and single-purpose',
    category: 'Architecture',
    description:
      'Each file or module should do one thing well. Aim for short files with a clear, stated responsibility. Large files should be split along natural seams.',
    rationale:
      'AI context windows have limits. Focused modules ensure the entire relevant context fits in a single prompt, yielding more accurate completions and easier automated refactors.',
  },
  {
    id: 4,
    slug: 'stable-interfaces',
    title: 'Design stable, narrow public interfaces',
    category: 'Architecture',
    description:
      'Expose the minimum surface area needed. Hide implementation details behind well-defined interfaces, and version breaking changes explicitly.',
    rationale:
      'Narrow interfaces give AI tools a smaller, more predictable contract to reason about. They reduce the blast radius of AI-suggested changes and make automated migrations safer.',
  },
  {
    id: 5,
    slug: 'co-locate-context',
    title: 'Co-locate context with the code it describes',
    category: 'Clarity',
    description:
      'Keep comments, tests, type definitions, and usage examples close to the code they relate to. Avoid scattering context across distant files or external wikis.',
    rationale:
      'AI assistants rely on nearby tokens for context. Co-locating documentation, types, and tests means the model sees the full picture in one pass, producing higher-quality and more accurate outputs.',
  },
  {
    id: 6,
    slug: 'test-first',
    title: 'Write tests before accepting AI-generated code',
    category: 'Testing',
    description:
      'Define the expected behavior in a failing test before prompting an AI to implement it. Treat the test as the authoritative specification the AI must satisfy.',
    rationale:
      'Tests provide an objective, automated gate. They prevent AI-generated code from silently shipping subtle behavioral bugs and give the model a concrete target to hit during iterative refinement.',
  },
  {
    id: 7,
    slug: 'test-edge-cases',
    title: 'Explicitly test edge cases and failure modes',
    category: 'Testing',
    description:
      'AI models tend to generate the happy path. Complement generated tests with manual cases that cover nulls, empty inputs, boundary values, and error states.',
    rationale:
      'Edge cases are exactly where AI suggestions are most likely to fail silently. Explicit tests for these scenarios act as a safety net that catches regressions introduced by future AI-assisted refactors.',
  },
  {
    id: 8,
    slug: 'prompt-as-code',
    title: 'Treat prompts and AI instructions as code',
    category: 'Collaboration',
    description:
      'Store prompts, agent instructions, and AI configuration files in version control alongside the code they affect. Review and evolve them with the same rigor as source files.',
    rationale:
      'Prompts encode logic and intent. Versioning them creates an audit trail, enables code review, and ensures the whole team benefits from iterative improvements rather than siloed prompt engineering.',
  },
  {
    id: 9,
    slug: 'human-review-gate',
    title: 'Always require human review before merging AI changes',
    category: 'Safety',
    description:
      'No AI-generated change should land in production without a human reading, understanding, and approving it. Use pull requests, code review policies, and CI gates as enforcement.',
    rationale:
      'AI tools optimize for plausibility, not correctness. Human review catches security issues, logic errors, and design misalignments that automated checks miss. Skipping review compounds risk over time.',
  },
  {
    id: 10,
    slug: 'iterative-small-changes',
    title: 'Prefer small, incremental AI-assisted changes',
    category: 'Safety',
    description:
      'Break large tasks into small, reviewable steps. Request one logical change at a time and verify before proceeding. Avoid accepting large sweeping rewrites in a single prompt.',
    rationale:
      'Small diffs are easier to review, easier to revert, and have a smaller blast radius when something goes wrong. Incremental changes also allow the AI to course-correct based on feedback at each step.',
  },
  {
    id: 11,
    slug: 'dependency-hygiene',
    title: 'Audit AI-suggested dependencies before adding them',
    category: 'Safety',
    description:
      'Treat every library an AI recommends as untrusted until verified. Check the package for known vulnerabilities, maintenance status, license compatibility, and download provenance.',
    rationale:
      'AI models are trained on historical data and may suggest deprecated, abandoned, or vulnerable packages. Dependency hygiene prevents supply-chain risks introduced by blindly accepting suggestions.',
  },
  {
    id: 12,
    slug: 'document-ai-boundaries',
    title: 'Document where AI was used and why',
    category: 'Collaboration',
    description:
      'Leave lightweight notes in commit messages, PRs, or inline comments when a significant section was AI-generated or AI-refactored. Record the intent behind the prompt.',
    rationale:
      'Traceability helps future contributors understand unconventional code choices, re-run or adjust prompts when requirements change, and audit AI involvement during incidents or security reviews.',
  },
];
