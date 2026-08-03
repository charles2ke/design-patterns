import type { BestPractice } from '../types/best-practice';

/**
 * A curated set of front-end best practices covering performance,
 * accessibility, code quality, security, and architecture.
 */
export const bestPractices: BestPractice[] = [
  {
    id: 1,
    slug: 'semantic-html',
    title: 'Use Semantic HTML',
    category: 'Accessibility',
    summary:
      'Prefer elements that carry meaning (<nav>, <main>, <article>, <button>) over generic <div> and <span>.',
    why: 'Screen readers and search engines rely on semantic markup to understand page structure. Semantic HTML also reduces the need for ARIA attributes.',
  },
  {
    id: 2,
    slug: 'keyboard-navigation',
    title: 'Ensure Full Keyboard Navigation',
    category: 'Accessibility',
    summary:
      'Every interactive element must be reachable and operable with a keyboard alone, with a visible focus indicator.',
    why: 'Users who rely on keyboards, switch controls, or screen readers depend on logical tab order and clear focus styles to navigate your UI.',
  },
  {
    id: 3,
    slug: 'color-contrast',
    title: 'Meet WCAG Colour Contrast Ratios',
    category: 'Accessibility',
    summary:
      'Normal text must have a contrast ratio of at least 4.5:1 and large text at least 3:1 against its background.',
    why: 'Insufficient contrast makes text unreadable for users with low vision or colour blindness and is a WCAG 2.1 AA requirement.',
  },
  {
    id: 4,
    slug: 'lazy-loading',
    title: 'Lazy-Load Off-Screen Resources',
    category: 'Performance',
    summary:
      'Defer loading images, iframes, and non-critical scripts until they are close to entering the viewport.',
    why: "Lazy loading reduces the amount of data transferred on initial page load, improving Time to Interactive and Core Web Vitals scores.",
  },
  {
    id: 5,
    slug: 'code-splitting',
    title: 'Split Bundles by Route',
    category: 'Performance',
    summary:
      'Use dynamic imports (import()) to split your JavaScript bundle so each route only downloads the code it needs.',
    why: 'Smaller initial bundles lower parse and execution time, directly improving First Contentful Paint and Largest Contentful Paint.',
  },
  {
    id: 6,
    slug: 'image-formats',
    title: 'Serve Modern Image Formats',
    category: 'Performance',
    summary:
      'Use WebP or AVIF with appropriate <picture> fallbacks instead of serving only JPEG or PNG.',
    why: 'Modern formats deliver comparable quality at 25-50% smaller file sizes, reducing bandwidth and improving load times, especially on mobile.',
  },
  {
    id: 7,
    slug: 'content-security-policy',
    title: 'Set a Content Security Policy',
    category: 'Security',
    summary:
      "Deliver a Content-Security-Policy header that restricts script, style, and resource origins to your app's trusted sources.",
    why: 'A strict CSP is the most effective mitigation against Cross-Site Scripting (XSS) attacks by preventing execution of injected scripts.',
  },
  {
    id: 8,
    slug: 'sanitise-user-input',
    title: 'Sanitise All User-Supplied Content',
    category: 'Security',
    summary:
      'Never insert raw user input into the DOM via innerHTML or dangerouslySetInnerHTML without first sanitising it with a trusted library.',
    why: 'Unsanitised HTML is the primary vector for stored and reflected XSS attacks, which can lead to session hijacking and data theft.',
  },
  {
    id: 9,
    slug: 'https-only',
    title: 'Serve Over HTTPS and Use HSTS',
    category: 'Security',
    summary:
      'Enforce HTTPS for all traffic and set a Strict-Transport-Security header with a long max-age.',
    why: 'HTTPS prevents man-in-the-middle attacks and protects cookies, tokens, and sensitive data in transit. HSTS prevents protocol downgrade attacks.',
  },
  {
    id: 10,
    slug: 'small-components',
    title: 'Keep Components Small and Focused',
    category: 'Code Quality',
    summary:
      'Each component should do one thing. If it grows beyond ~150 lines, consider splitting it into smaller composable pieces.',
    why: 'Small components are easier to test, reason about, and reuse. They reduce the blast radius of changes and improve readability.',
  },
  {
    id: 11,
    slug: 'colocate-tests',
    title: 'Colocate Unit Tests with Source Files',
    category: 'Code Quality',
    summary:
      'Place test files adjacent to the source files they cover (e.g., Button.tsx and Button.test.tsx in the same folder).',
    why: 'Colocation makes tests easy to discover and maintain, and visually signals when a file is missing coverage.',
  },
  {
    id: 12,
    slug: 'avoid-prop-drilling',
    title: 'Avoid Deep Prop Drilling',
    category: 'Architecture',
    summary:
      "Don't pass props through more than two or three levels. Use React Context, a store, or component composition instead.",
    why: "Prop drilling creates brittle component trees where every intermediate component must know about data it doesn't use, making refactoring painful.",
  },
  {
    id: 13,
    slug: 'single-source-of-truth',
    title: 'Keep a Single Source of Truth for State',
    category: 'Architecture',
    summary:
      "Derive displayed values from one canonical state location rather than duplicating state across components.",
    why: 'Duplicated state falls out of sync and causes hard-to-reproduce bugs. A single source of truth ensures consistency and simplifies debugging.',
  },
  {
    id: 14,
    slug: 'error-boundaries',
    title: 'Wrap Sections in Error Boundaries',
    category: 'Architecture',
    summary:
      'Use React Error Boundaries (or equivalent) to isolate rendering failures so one broken widget does not crash the whole page.',
    why: 'Unhandled render errors propagate up and unmount the entire tree. Error boundaries provide graceful degradation and improve resilience.',
  },
  {
    id: 15,
    slug: 'responsive-mobile-first',
    title: 'Design Mobile-First and Responsively',
    category: 'Code Quality',
    summary:
      'Start with styles for the smallest viewport and use min-width media queries to progressively enhance for larger screens.',
    why: 'Mobile-first ensures a baseline usable experience on constrained devices. Progressive enhancement is easier than overriding desktop-only styles.',
  },
];
