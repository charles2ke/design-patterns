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
    'Key space: 62^6 ≈ 57 billion is too small; 62^7 ≈ 3.5 trillion leaves ~19× headroom, so use 7-character base62 codes.',
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
  code        string     primary key: 7-char base62 or a custom alias
  long_url    string     not null, <= 2,048 chars after validation
  owner_id    string     nullable: API key / account that created it
  created_at  timestamp  not null
  expires_at  timestamp  nullable: checked on every redirect

id_blocks        tiny strongly consistent table (or etcd / ZooKeeper)
  name        string     primary key, e.g. "links"
  next_id     int64      atomically advanced by one block per lease

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
 | ID      |  |                  +-----------+   |
 | blocks  |  |                  |   Redis   |   |
 +---------+  |                  +-----------+   |
              v                                  v
        +-------------------------------------------+
        |      links table (partitioned KV store)   |
        +-------------------------------------------+`,
    flow: [
      'Create: the Write API validates the URL (http/https only, length limit, reputation check) and takes the next ID from a block it has leased from the ID-blocks table.',
      'It scrambles and base62-encodes the ID into a 7-character code and stores the row with a conditional put, so an existing code is never overwritten.',
      'Custom aliases skip the allocator and use the same conditional put; a conflict returns 409.',
      'Redirect: the Redirect API looks up the code in Redis and, on a miss, reads the links table and fills the cache with a TTL that never outlives expires_at.',
      'It answers 302 with a Location header (404/410 otherwise) and publishes a click event to Kafka asynchronously, off the critical path.',
    ],
  },
  deepDives: [
    {
      heading: 'Generating unique short codes',
      points: [
        'Hash-and-truncate (first 7 characters of base62(SHA-256(url))) is stateless, but it must detect collisions with a conditional write and it gives every user the same code for the same URL.',
        'A counter encoded in base62 is collision-free by construction. A coordinator (an atomic row update, etcd or ZooKeeper) leases blocks of ~1M IDs to each writer, so it is touched once per million links rather than once per request.',
        'Raw counters are enumerable: anyone can walk /0000001, /0000002 and so on. Passing the ID through a bijective permutation of the code space before encoding keeps codes unique but non-sequential. This is obfuscation, not security, so private links still need access control.',
        'If a writer crashes mid-block its unused IDs are simply skipped; 62^7 has plenty of headroom for such gaps.',
      ],
    },
    {
      heading: 'Read path and caching',
      points: [
        'Redirects outnumber creates 100:1, so the read path is cache-aside: Redis first, the links table on a miss, then fill the cache.',
        'Links are immutable once created, so there is no general invalidation problem; only deletes and abuse takedowns explicitly evict a key.',
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
      choice: 'Leased ID blocks + bijective scrambling + base62',
      rationale:
        'No collisions to resolve, no per-request coordination, and codes are not trivially sequential. Hashing would need collision handling on every write.',
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
        'Uniqueness must be guaranteed at write time with a conditional put; a few seconds of replica lag is harmless because links never change after creation.',
    },
  ],
  failureModes: [
    'Coordinator outage: writers keep serving from their current leased block; creation stalls only once blocks run out, and redirects are unaffected.',
    'Cache cluster failure: traffic falls through to the database. Coalesce concurrent misses for the same key, shed load with a circuit breaker and provision the database for a realistic miss rate.',
    'Hot key from a viral link: one Redis shard saturates. Add a small in-process LRU in front of Redis or replicate hot keys across shards.',
    'Abuse: shorteners attract phishing and spam. Rate-limit creation per API key and IP, check URLs against a reputation service and support takedowns that evict from Redis and purge the CDN.',
    'Region loss: replicate the links table across regions. Links are immutable, so asynchronous replication is safe for reads, and each region leases from disjoint ID blocks.',
  ],
  code: {
    label: 'TypeScript: leased ID blocks, scrambled base62 codes and conflict-safe creation',
    language: 'TypeScript',
    code: `const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_LENGTH = 7;
const SPACE = 62n ** 7n; // ≈ 3.52 trillion codes
// Affine permutation of [0, SPACE). SPACE = 2^7 * 31^7, so a multiplier that is odd
// and not divisible by 31 is coprime to it: every ID maps to a unique code, and
// consecutive IDs no longer produce consecutive, guessable codes.
const MULTIPLIER = 2_176_477_521_915n; // ≈ SPACE × 0.618 spreads consecutive IDs
const OFFSET = 1_029_384_756_101n;

export function toCode(id: bigint): string {
  if (id < 0n || id >= SPACE) throw new RangeError('ID outside the 7-character code space');
  let n = (id * MULTIPLIER + OFFSET) % SPACE;
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code = ALPHABET.charAt(Number(n % 62n)) + code;
    n /= 62n;
  }
  return code;
}

/** Each writer leases a block of IDs, so the coordinator is hit once per block, not per link. */
export class KeyRangeAllocator {
  private next = 0n;
  private end = 0n;
  private pending: Promise<void> | null = null;
  private readonly lease: (size: bigint) => Promise<bigint>;
  private readonly blockSize: bigint;

  constructor(lease: (size: bigint) => Promise<bigint>, blockSize = 1_000_000n) {
    this.lease = lease; // e.g. an atomic "UPDATE counter SET next = next + size RETURNING ..."
    this.blockSize = blockSize;
  }

  async nextId(): Promise<bigint> {
    while (this.next >= this.end) {
      // Concurrent callers share one in-flight lease instead of each leasing a block.
      this.pending ??= this.lease(this.blockSize)
        .then((start) => {
          this.next = start;
          this.end = start + this.blockSize;
        })
        .finally(() => {
          this.pending = null;
        });
      await this.pending;
    }
    return this.next++;
  }
}

export interface LinkStore {
  /** Conditional write (e.g. DynamoDB attribute_not_exists); resolves false if the code exists. */
  putIfAbsent(code: string, longUrl: string): Promise<boolean>;
}

const ALIAS = /^[A-Za-z0-9_-]{4,32}$/;

export async function shorten(
  store: LinkStore,
  ids: KeyRangeAllocator,
  longUrl: string,
  alias?: string,
): Promise<string> {
  const url = new URL(longUrl); // throws TypeError on malformed input -> HTTP 400
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http(s) URLs can be shortened');
  }
  if (alias !== undefined) {
    if (!ALIAS.test(alias)) throw new Error('Alias must be 4-32 letters, digits, - or _');
    if (!(await store.putIfAbsent(alias, url.href))) throw new Error('Alias taken'); // HTTP 409
    return alias;
  }
  // A generated code can only collide with an earlier custom alias: take the next ID.
  for (;;) {
    const code = toCode(await ids.nextId());
    if (await store.putIfAbsent(code, url.href)) return code;
  }
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
        'Store expires_at, check it on every redirect and return 410 Gone once it has passed. Set the cache TTL to the smaller of the default TTL and the time remaining. The store’s native TTL or a background sweeper purges expired rows, and deletes explicitly evict the key from Redis and purge it from the CDN.',
    },
    {
      question: 'If the same long URL is submitted twice, should it get the same code?',
      answer:
        'Default to a new code per request, because different owners want independent analytics and expiry. If deduplication is required, add a lookup keyed by hash(owner_id, long_url) and return the existing code for that owner only, never across owners.',
    },
  ],
};
