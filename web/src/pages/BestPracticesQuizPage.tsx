import { QuizGame, type QuizQuestion } from '../components/QuizGame';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: 'Which SOLID principle says a class should have only one reason to change?',
    options: [
      { id: 'a', label: 'Single responsibility principle' },
      { id: 'b', label: 'Open/closed principle' },
      { id: 'c', label: 'Interface segregation principle' },
      { id: 'd', label: 'Dependency inversion principle' },
    ],
    hint: 'Its name states exactly how many jobs a class should have.',
    correctOptionId: 'a',
  },
  {
    id: 2,
    prompt: 'Which SOLID principle asks modules to depend on abstractions rather than concrete implementations?',
    options: [
      { id: 'a', label: 'Liskov substitution principle' },
      { id: 'b', label: 'Dependency inversion principle' },
      { id: 'c', label: 'Single responsibility principle' },
      { id: 'd', label: 'Open/closed principle' },
    ],
    hint: 'High-level policy should not depend on low-level details.',
    correctOptionId: 'b',
  },
  {
    id: 3,
    prompt: 'What is the recommended way to make interactive web UI accessible?',
    options: [
      { id: 'a', label: 'Add ARIA roles to every element' },
      { id: 'b', label: 'Use div elements with click handlers' },
      { id: 'c', label: 'Use semantic HTML elements first, ARIA only when needed' },
      { id: 'd', label: 'Rely on browser defaults and skip labels' },
    ],
    hint: 'The first rule of ARIA is to not use ARIA when HTML already works.',
    correctOptionId: 'c',
  },
  {
    id: 4,
    prompt: 'How should user-supplied values be handled when building SQL queries?',
    options: [
      { id: 'a', label: 'Escape quotes manually before concatenating' },
      { id: 'b', label: 'Use parameterized queries or prepared statements' },
      { id: 'c', label: 'Validate on the client and interpolate on the server' },
      { id: 'd', label: 'Strip suspicious keywords from the input string' },
    ],
    hint: 'Keep data out of the query text so injection is impossible.',
    correctOptionId: 'b',
  },
  {
    id: 5,
    prompt: 'What is the safest way to store user passwords in a database?',
    options: [
      { id: 'a', label: 'Encrypted with a reversible symmetric key' },
      { id: 'b', label: 'Hashed with a fast hash such as MD5' },
      { id: 'c', label: 'In plain text behind a firewall' },
      { id: 'd', label: 'Hashed with a slow, salted algorithm such as bcrypt or Argon2' },
    ],
    hint: 'The algorithm should be deliberately slow and salted per user.',
    correctOptionId: 'd',
  },
  {
    id: 6,
    prompt: 'Which practice makes a retried API request safe to repeat?',
    options: [
      { id: 'a', label: 'Idempotency keys on write endpoints' },
      { id: 'b', label: 'Longer client timeouts' },
      { id: 'c', label: 'Disabling retries entirely' },
      { id: 'd', label: 'Caching every response' },
    ],
    hint: 'The server must recognize a duplicate request and return the first result.',
    correctOptionId: 'a',
  },
  {
    id: 7,
    prompt: 'Which retry strategy best avoids overwhelming a struggling downstream service?',
    options: [
      { id: 'a', label: 'Immediate retries in a tight loop' },
      { id: 'b', label: 'Exponential backoff with jitter' },
      { id: 'c', label: 'A fixed one-second delay for all clients' },
      { id: 'd', label: 'Retrying only after a manual restart' },
    ],
    hint: 'Randomized, growing delays keep clients from retrying in lockstep.',
    correctOptionId: 'b',
  },
  {
    id: 8,
    prompt: 'What is the main purpose of a circuit breaker in a distributed system?',
    options: [
      { id: 'a', label: 'To load balance traffic across replicas' },
      { id: 'b', label: 'To compress payloads between services' },
      { id: 'c', label: 'To stop calling a failing dependency and fail fast' },
      { id: 'd', label: 'To encrypt service-to-service traffic' },
    ],
    hint: 'It trips open after repeated failures, then probes for recovery.',
    correctOptionId: 'c',
  },
  {
    id: 9,
    prompt: 'How should database schema changes be applied to a production system?',
    options: [
      { id: 'a', label: 'Manual SQL run by an administrator' },
      { id: 'b', label: 'Automatic schema sync from the ORM models' },
      { id: 'c', label: 'A snapshot restore of the desired schema' },
      { id: 'd', label: 'Versioned, reviewed migrations applied in order' },
    ],
    hint: 'Changes should be repeatable, ordered, and stored in version control.',
    correctOptionId: 'd',
  },
  {
    id: 10,
    prompt: 'Which practice best protects data integrity in a relational database?',
    options: [
      { id: 'a', label: 'Enforcing constraints such as NOT NULL, unique, and foreign keys' },
      { id: 'b', label: 'Validating only in the application layer' },
      { id: 'c', label: 'Storing every column as nullable text' },
      { id: 'd', label: 'Adding an index to every column' },
    ],
    hint: 'The database should reject invalid rows no matter which client writes them.',
    correctOptionId: 'a',
  },
  {
    id: 11,
    prompt: 'What is the primary defense against prompt injection in an LLM-powered feature?',
    options: [
      { id: 'a', label: 'Asking the model politely to ignore malicious text' },
      { id: 'b', label: 'Treating retrieved content as untrusted data and gating tool permissions' },
      { id: 'c', label: 'Increasing the model temperature' },
      { id: 'd', label: 'Using a larger context window' },
    ],
    hint: 'Never let untrusted content grant new capabilities; constrain what tools can do.',
    correctOptionId: 'b',
  },
  {
    id: 12,
    prompt: 'How should an AI feature be validated before and after shipping?',
    options: [
      { id: 'a', label: 'Manual spot checks only' },
      { id: 'b', label: 'Trusting model release notes' },
      { id: 'c', label: 'Automated evaluations on a versioned dataset with tracked metrics' },
      { id: 'd', label: 'Unit tests of the prompt string' },
    ],
    hint: 'Regression-tested evals catch quality drift when prompts or models change.',
    correctOptionId: 'c',
  },
  {
    id: 13,
    prompt: 'Which logging practice is recommended for production services?',
    options: [
      { id: 'a', label: 'Log full request bodies including credentials' },
      { id: 'b', label: 'Log only on unhandled crashes' },
      { id: 'c', label: 'Print unstructured strings to stdout' },
      { id: 'd', label: 'Emit structured logs with correlation IDs and no secrets' },
    ],
    hint: 'Machine-readable events with a trace identifier make debugging possible.',
    correctOptionId: 'd',
  },
  {
    id: 14,
    prompt: 'Which testing approach gives the most confidence per unit of maintenance cost?',
    options: [
      { id: 'a', label: 'Many fast tests of behavior, fewer slow end-to-end tests' },
      { id: 'b', label: 'Only end-to-end tests through the UI' },
      { id: 'c', label: 'Tests asserting private implementation details' },
      { id: 'd', label: 'Snapshot tests for every module' },
    ],
    hint: 'Think of the shape of the classic testing pyramid.',
    correctOptionId: 'a',
  },
  {
    id: 15,
    prompt: 'What is the best way to keep secrets out of an application codebase?',
    options: [
      { id: 'a', label: 'Commit them encrypted with a shared password' },
      { id: 'b', label: 'Load them from environment variables or a secret manager' },
      { id: 'c', label: 'Keep them in a gitignored source file' },
      { id: 'd', label: 'Obfuscate them in the bundled client code' },
    ],
    hint: 'Configuration should be injected at runtime, never checked in.',
    correctOptionId: 'b',
  },
];

export function BestPracticesQuizPage() {
  return (
    <QuizGame
      title="Who Wants to Be a Best Practices Pro?"
      subtitle="A millionaire-style challenge about engineering best practices."
      ariaLabel="Best practices quiz"
      cheer="Congratulations, Best Practices Pro!"
      questions={QUESTIONS}
    />
  );
}
