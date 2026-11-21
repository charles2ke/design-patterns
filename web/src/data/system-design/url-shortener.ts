import type { SystemDesignQuestion } from '../../types/system-design';

export const urlShortener: SystemDesignQuestion = {
  slug: 'url-shortener',
  title: 'Design a URL shortener (TinyURL / bit.ly)',
  difficulty: 'Easy',
  companies: ['Google', 'Amazon', 'Microsoft', 'Meta'],
  prompt:
    'Design a service like TinyURL or bit.ly. Given a long URL it returns a short alias, and visiting the alias redirects to the original URL. Support optional custom aliases and expiry. Assume 100 million new links per day and a 100:1 read-to-write ratio.',
  signals: [
    'Turns a vague prompt into concrete functional and non-functional requirements before drawing boxes.',
    'Chooses a collision-free key-generation strategy and justifies the code length with arithmetic.',
    'Recognizes the read-heavy workload and designs the redirect path around caching.',
    'Explains the 301 vs 302 trade-off and its impact on analytics, expiry and abuse takedowns.',
  ],
  requirements: {
    functional: [
      'Create a short link for a long URL, optionally with a custom alias and an expiry time.',
      'Redirect GET /{code} to the original URL.',
      'Return 404 for unknown codes and 410 Gone for expired or removed links.',
    ],
    nonFunctional: [
      'Low-latency redirects: p99 under ~50 ms inside the service.',
      'Redirects are highly available (99.99%); link creation can tolerate brief degradation.',
      'A code, once issued, must never silently point to a different URL.',
      'Codes should not be trivially enumerable.',
    ],
    outOfScope: [
      'User accounts, billing and the link-management dashboard.',
      'The analytics pipeline itself (the redirect path only emits click events).',
      'Malware and phishing detection internals (assume an external URL-reputation service).',
    ],
  },
  estimates: [
    'Writes: 100M links/day ÷ 86,400 s ≈ 1,160 creates/s on average; plan for ~3× peak ≈ 3,500/s.',
    'Reads: 100 × 1,160 ≈ 116,000 redirects/s on average, ~350,000/s at peak.',
    'Links retained for 5 years: 100M × 365 × 5 ≈ 183 billion.',
    'Key space: 10 base64url characters provide 60 random bits (2^60 ≈ 1.15 quintillion), ample headroom for 183B retained links with conditional collision retries.',
    'Storage: 183B rows × ~500 bytes ≈ 91 TB before replication, so the store must be horizontally partitioned.',
    'Cache: the hottest 100M links × ~500 bytes ≈ 50 GB of RAM, which fits in a small Redis cluster.',
  ],
  api: `POST /api/v1/links
Authorization: Bearer <api-key>              (rate-limited per key)
{
  "longUrl": "https://example.com/a/very/long/path",
  "customAlias": "spring-sale",              (optional)
  "expiresAt": "2026-12-31T00:00:00Z"        (optional)
}
-> 201 Created  { "code": "spring-sale", "shortUrl": "https://sho.rt/spring-sale" }
-> 400 Bad Request (invalid URL or alias)  |  409 Conflict (alias taken)

GET /{code}
-> 302 Found    Location: https://example.com/a/very/long/path
-> 404 Not Found  |  410 Gone (expired or taken down)`,
  dataModel: `links            partitioned by code (DynamoDB, Cassandra or Bigtable)
    code        string     primary key: random 10-char base64url or a custom alias
    status      enum       ACTIVE | TOMBSTONE; code reservations are never deleted or reused
    long_url    string     nullable for TOMBSTONE; <= 2,048 chars after validation
  owner_id    string     nullable: API key / account that created it
  created_at  timestamp  not null
  expires_at  timestamp  nullable: checked on every redirect

Every redirect is a single-key lookup by code: no joins, no secondary
index on the hot path. An (owner_id, created_at) index serves "my links".`,
  architecture: {
    diagram: `                  +-----------------+
   Client ------->|  Load balancer  |
                  +--------+--------+
       POST /links         |          GET /{code}
          +----------------+----------------+
          v                                 v
  +---------------+                 +----------------+
  |   Write API   |                 |  Redirect API  |---> click events
  +---+-------+---+                 +---+--------+---+     (Kafka)
      |       |                         |        |
      v       |                  1. get |        | 2. on miss
 +---------+  |                         v        |
 | CSPRNG  |  |                  +-----------+   |
 +---------+  |                  |   Redis   |   |
              |                  +-----------+   |
              v                                  v
        +-------------------------------------------+
        |      links table (partitioned KV store)   |
        +-------------------------------------------+`,
    flow: [
      'Create: the Write API validates the URL (http/https only, length limit, reputation check) and generates a cryptographically random 10-character code.',
      'It stores the active link with a conditional put and retries on collision; random codes are not enumerable from neighboring links, and retired codes remain reserved.',
      'Custom aliases use the same conditional put; a conflict returns 409.',
      'Redirect: the Redirect API looks up the code in Redis and, on a miss, reads the links table and fills the cache with a TTL that never outlives expires_at.',
      'It answers 302 with a Location header (404/410 otherwise) and publishes a click event to Kafka asynchronously, off the critical path.',
    ],
  },
  deepDives: [
    {
      heading: 'Generating unique short codes',
      points: [
        'Hash-and-truncate (first 7 characters of base62(SHA-256(url))) is stateless, but it must detect collisions with a conditional write and it gives every user the same code for the same URL.',
        'Generate each code with a cryptographically secure random source. Conditional create detects the rare collision and retries with a fresh code; a 10-character base64url code has 60 bits of entropy.',
        'Unlike a public affine permutation of a counter, random codes do not expose adjacent IDs. Private links still need access control, and collision resistance is not authorization.',
      ],
    },
    {
      heading: 'Read path and caching',
      points: [
        'Redirects outnumber creates 100:1, so the read path is cache-aside: Redis first, the links table on a miss, then fill the cache.',
        'Link targets are immutable; expiry, deletion and abuse takedowns atomically change the row to a permanent TOMBSTONE and evict caches. Tombstones preserve 410 behavior and prevent an old code from ever being reassigned.',
        'Cache negative results (unknown codes) for a short TTL so scanners probing random codes do not reach the database.',
        'Viral links can also be cached at the CDN edge with a short max-age, absorbing spikes before they reach the origin.',
      ],
    },
    {
      heading: '301 vs 302 and analytics',
      points: [
        '301 Moved Permanently lets browsers cache the redirect. That cuts load, but repeat clicks become invisible to analytics and expiry or takedowns stop working for clients that cached it.',
        '302 Found keeps every click flowing through the service, so it can count clicks and enforce expiry and takedowns immediately, at the cost of more traffic.',
        'A middle ground is a 301 with a short Cache-Control max-age, which bounds how long a browser can bypass the service.',
        'Click events go to Kafka asynchronously, so a slow analytics pipeline can never slow down or break a redirect.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Key generation',
      choice: 'Cryptographically random codes + conditional create',
      rationale:
        'Codes are not enumerable from adjacent IDs, but random collisions require a conditional write and retry; private links still need access control.',
    },
    {
      decision: 'Primary store',
      choice: 'Partitioned key-value / wide-column store keyed by code',
      rationale:
        'Every access is a single-key lookup and ~91 TB over five years needs horizontal partitioning, not joins or transactions.',
    },
    {
      decision: 'Redirect status',
      choice: '302 Found',
      rationale:
        'Keeps analytics, expiry and abuse takedowns effective; Redis and the CDN absorb the extra traffic instead of browser caches.',
    },
    {
      decision: 'Consistency',
      choice: 'Strong for creates, eventual for caches and replicas',
      rationale:
        'Uniqueness must be guaranteed at write time with a conditional put; active targets are immutable, and tombstones are permanent so replica lag cannot make a retired code reusable.',
    },
  ],
  failureModes: [
    'Random-code collision: conditional create rejects the occupied code and the writer retries with fresh random bytes; redirects and existing links are unaffected.',
    'Cache cluster failure: traffic falls through to the database. Coalesce concurrent misses for the same key, shed load with a circuit breaker and provision the database for a realistic miss rate.',
    'Hot key from a viral link: one Redis shard saturates. Add a small in-process LRU in front of Redis or replicate hot keys across shards.',
    'Abuse: shorteners attract phishing and spam. Rate-limit creation per API key and IP, check URLs against a reputation service and tombstone takedowns while evicting caches and purging the CDN.',
    'Region loss: replicate links and tombstones across regions. Conditional create in the shared code namespace resolves rare random collisions; a tombstone must never be lost or a retired code could be reassigned.',
  ],
  code: {
    label: 'TypeScript: cryptographically random codes, collision-safe creation and permanent tombstones',
    language: 'TypeScript',
    code: `import { randomBytes } from 'node:crypto';

const CODE_LENGTH = 10;

/** Eight random bytes provide 64 bits; the first ten base64url chars retain 60 bits. */
export function randomCode(): string {
  return randomBytes(8).toString('base64url').slice(0, CODE_LENGTH);
}

export interface LinkStore {
  /** Conditional write; tombstones remain present so an issued code can never be reused. */
  putIfAbsent(code: string, row: LinkRow): Promise<boolean>;
  /** Atomically changes ACTIVE to TOMBSTONE without deleting the reservation. */
  tombstone(code: string, now: Date): Promise<boolean>;
  get(code: string): Promise<LinkRow | undefined>;
}

export interface LinkRow {
  status: 'ACTIVE' | 'TOMBSTONE';
  longUrl: string | null;
  ownerId: string | null;
  createdAt: Date;
  expiresAt: Date | null;
}

const ALIAS = /^[A-Za-z0-9_-]{4,32}$/;

export async function shorten(
  store: LinkStore,
  longUrl: string,
  alias?: string,
): Promise<string> {
  const url = new URL(longUrl); // throws TypeError on malformed input -> HTTP 400
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http(s) URLs can be shortened');
  }
  if (alias !== undefined) {
    if (!ALIAS.test(alias)) throw new Error('Alias must be 4-32 letters, digits, - or _');
    if (!(await store.putIfAbsent(alias, {
      status: 'ACTIVE', longUrl: url.href, ownerId: null, createdAt: new Date(), expiresAt: null,
    }))) throw new Error('Alias taken'); // HTTP 409
    return alias;
  }
  // Conditional create handles generated-code collisions and aliases in the same namespace.
  for (;;) {
    const code = randomCode();
    if (await store.putIfAbsent(code, {
      status: 'ACTIVE', longUrl: url.href, ownerId: null, createdAt: new Date(), expiresAt: null,
    })) return code;
  }
}

/** Expired, deleted and taken-down links keep a permanent reservation and always return 410. */
export async function retire(store: LinkStore, code: string, now: Date): Promise<410 | 404> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await store.get(code);
    if (row === undefined) return 404;
    if (row.status === 'TOMBSTONE') return 410;
    if (await store.tombstone(code, now)) return 410;
  }
  throw new Error('Concurrent link update; retry retirement');
}`,
  },
  followUps: [
    {
      question: 'How would you add per-link click analytics?',
      answer:
        'Publish a click event (code, timestamp, referrer, coarse geo) to Kafka from the redirect path, aggregate it in a stream processor into per-minute counters, and serve dashboards from an OLAP store such as ClickHouse or Druid. The redirect never waits on analytics, and late or duplicate events are tolerated by idempotent, windowed aggregation.',
    },
    {
      question: 'How do you implement expiry and deletion?',
      answer:
        'Store expires_at, check it on every redirect and atomically tombstone expired or removed rows instead of purging them. Return 410 for a tombstone and 404 only for a never-issued code; evict caches and CDN entries, but retain the permanent reservation so it cannot be reassigned.',
    },
    {
      question: 'If the same long URL is submitted twice, should it get the same code?',
      answer:
        'Default to a new code per request, because different owners want independent analytics and expiry. If deduplication is required, add a lookup keyed by hash(owner_id, long_url) and return the existing code for that owner only, never across owners.',
    },
  ],
};
