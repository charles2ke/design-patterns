import type { SystemDesignQuestion } from '../../types/system-design';

export const rateLimiter: SystemDesignQuestion = {
  slug: 'rate-limiter',
  title: 'Design a distributed rate limiter',
  difficulty: 'Medium',
  companies: ['Google', 'Amazon', 'Stripe', 'Uber'],
  prompt:
    'Design a rate limiter for a public API platform. Limits apply per API key, user, IP address and endpoint, and the API runs on a gateway fleet in three regions. The platform also serves an LLM API whose plans cap both requests per minute and tokens per minute. Assume 500,000 requests per second at peak and 10 million active API keys.',
  signals: [
    'Compares fixed window, sliding window, token bucket and leaky bucket on memory, accuracy and burst behavior, then picks one for a stated reason.',
    'Makes check-and-consume atomic across a fleet of gateways and knows when approximate local counting is good enough.',
    'Decides per route what happens when the limiter itself is down, instead of a blanket fail-open or fail-closed.',
    'Handles costs that are unknown up front, such as LLM output tokens, by reserving an estimate and reconciling it with actual usage.',
  ],
  requirements: {
    functional: [
      'Enforce configurable limits keyed by API key, user, IP address, endpoint or a combination such as API key + endpoint; a request must pass every rule that matches it.',
      'Reject over-limit requests with HTTP 429 and Retry-After, and report the remaining quota in rate-limit headers on every response.',
      'Support weighted costs: an expensive endpoint can cost more than one unit, and an LLM call is charged in tokens as well as requests.',
      'Let operators change rules and per-customer overrides without a deploy, taking effect within seconds.',
    ],
    nonFunctional: [
      'Adds under ~1 ms at p99 to each request, because every API call pays it.',
      'Exact within a region in normal operation; a global limit may be overshot briefly, by a bounded amount, while regional shares rebalance.',
      'A limiter outage must not take the API down: every route has an explicit fail-open or fail-closed policy.',
      'Scales horizontally with request rate and key count, including single keys hot enough to saturate one shard.',
    ],
    outOfScope: [
      'Billing and monthly quota invoicing (the limiter only emits usage aggregates).',
      'Network-layer DDoS protection, which belongs to the CDN or a scrubbing service in front of the gateways.',
      'Deciding which keys are abusive; the limiter enforces the rules and blocks it is given.',
    ],
  },
  estimates: [
    'Checks: 500K requests/s × ~2 limit checks (e.g. per API key and per IP) ≈ 1M Redis script calls/s, or ≈ 333K/s per region across 3 regions.',
    'Shards: assuming ~50K script calls/s per Redis shard, 333K ÷ 50K ≈ 7 shards per region; run 10 so each stays ≈ 67% busy with headroom for hot keys.',
    'Memory: 10M keys × 2 buckets × ~100 bytes ≈ 2 GB per region, so state fits in RAM easily; operations per second, not memory, set the shard count.',
    'Latency: a same-datacenter round trip is ≈ 0.5 ms, while crossing regions costs tens of ms (up to ~150 ms between continents), so every decision must be made inside the region.',
    'Fixed windows double bursts: a 100/min limit admits 100 requests at 0:59.5 and 100 more at 1:00.5, i.e. 200 in about one second.',
    'LLM call: 3,000 input tokens + max_tokens 1,000 reserves 4,000 tokens; if it generates only 250, reconciliation refunds 750.',
  ],
  api: `POST /v1/generate                Authorization: Bearer <api-key>
-> 200 OK                        RateLimit-Policy: "tpm";q=100000;w=60
                                 RateLimit: "tpm";r=61500
-> 429 Too Many Requests         Retry-After: 3
                                 RateLimit: "tpm";r=0;t=3
   { "error": "rate_limited", "policy": "tpm", "retryAfterMs": 2400 }
-> 400 Bad Request               (needs more tokens than the bucket holds: not retryable)
RateLimit fields follow the IETF httpapi draft; many APIs still send X-RateLimit-*.

Gateway -> Redis: one atomic script call per check (all keys share one hash slot)
EVALSHA <reserve-sha> 3 rl:{ak_123}:rpm rl:{ak_123}:tpm rl:{ak_123}:res:<reqId>  1 4000
-> [1, remaining_rpm, remaining_tpm, 0]  |  [0, remaining_rpm, remaining_tpm, retry_ms]
EVALSHA <reconcile-sha> 2 rl:{ak_123}:tpm rl:{ak_123}:res:<reqId>  3250
-> refunds the unused 750 (or charges an overrun as debt); no-op if already settled

PUT /admin/v1/rules/{ruleId}     (rules service; pushed to every gateway within seconds)
{ "match": { "endpoint": "POST /v1/generate" }, "keyBy": ["apiKey"], "unit": "tokens",
  "rate": 100000, "windowS": 60, "burst": 100000, "failMode": "open", "version": 41 }
-> 200 OK { "version": 42 }  |  400 Bad Request (invalid rule)  |  409 Conflict (stale)`,
  dataModel: `Redis, one cluster per region; a {hash tag} keeps all keys of a subject in one slot
  rl:{ak_123}:rpm          hash    tokens, debt, last_ms
  rl:{ak_123}:tpm          hash    same fields for the LLM token budget
  rl:{ak_123}:res:<reqId>  string  tokens reserved by an in-flight LLM call
  Every key has a PEXPIRE: a bucket expires once it would be full again (a missing
  bucket reads as full) and a reservation after the longest allowed call.

rules            Postgres; every gateway caches the full set and gets pushed changes
  rule_id     text     primary key
  match       jsonb    e.g. { "endpoint": "POST /v1/generate", "tier": "free" }
  key_by      text[]   e.g. {apiKey}, {ip} or {userId,endpoint}
  unit        text     requests | tokens
  rate        int      tokens added per window_s
  window_s    int      e.g. 60
  burst       int      largest burst a key can spend at once
  fail_mode   text     open (fall back to local buckets) | closed (answer 503)
  version     bigint   optimistic concurrency; gateways report the version they run

overrides        primary key (rule_id, subject): per-customer limits with expires_at

Hot path: rules are matched in memory and each check is one Redis script call;
Postgres is read only when a rule changes.`,
  architecture: {
    diagram: `                 Clients
                   |  ^
           request |  | 200, or 429 + Retry-After
                   v  |
   +---------------------------+  rules + shares  +------------------+
   |     API gateway fleet     |<-----------------|  Rules service   |
   | (limiter library, cached  |                  |   (config DB)    |
   |  rules, local fallback)   |                  +---------+--------+
   +--+-----------+--------+---+                            ^
      |           |        |                                | regional
      |           |        |                                | shares
      |           |        |   usage aggregates   +---------+--------+
      |           |        +--------------------->| Budget allocator |
      |           |                               +------------------+
      |           | 2. forward if allowed
      |           v
      |    +------------------+
      |    |   Services and   |
      |    |   LLM backends   |
      |    +------------------+
      |
      | 1. check and reserve
      | 3. reconcile
      v
   +---------------------------+
   |  Regional Redis cluster   |
   |  (token buckets, Lua)     |
   +---------------------------+`,
    flow: [
      'The rules service pushes rule changes and each region’s current shares to every gateway; per request, the gateway matches rules in memory and builds keys such as rl:{ak_123}:tpm.',
      'Check and reserve (1): one Lua script call to the regional Redis cluster refills every matching bucket from the elapsed time and charges all of them, or none.',
      'If any bucket is short, the gateway answers 429 with Retry-After and RateLimit headers without touching a backend; otherwise it forwards the request (2).',
      'Reconcile (3): when an LLM response finishes, the gateway reports the actual token count, which refunds the unused estimate or charges an overrun as debt.',
      'Gateways stream per-key usage aggregates to the budget allocator, which recomputes each region’s share of every global limit every few seconds and publishes it through the rules service.',
    ],
  },
  deepDives: [
    {
      heading: 'Choosing an algorithm',
      points: [
        'Fixed window: one counter per key per window (INCR, then EXPIRE). Cheapest, but a client can spend a full quota at the end of one window and again at the start of the next: twice the limit in a moment.',
        'Sliding window log: store every request timestamp and count those inside the window. Exact, but memory grows with the limit: 1,000 requests/min × ~16 bytes ≈ 16 KB per key before data-structure overhead, too much for millions of keys.',
        'Sliding window counter: estimate the rolling count as current + previous × the share of the previous window that still overlaps the rolling window (0.75 when 25% into the current one). Two counters per key, close enough if traffic was evenly spread.',
        'Token bucket: capacity B refilled at rate r, stored as (tokens, last time) and refilled lazily on each request. It permits bursts up to B with a long-run average of r and handles weighted costs, so this design uses it.',
        'Leaky bucket: requests queue and drain at a constant rate, which smooths traffic for a fragile downstream but adds queueing delay and drops whatever overflows the queue. Used as a meter instead of a queue, it is equivalent to a token bucket.',
      ],
    },
    {
      heading: 'Atomic shared state vs local counting',
      points: [
        'With many gateways, read-then-write (GET tokens, compare, SET tokens - 1) lets two gateways both take the last token. The check and the update must be one atomic step.',
        'Run refill, check and charge as one Redis Lua script: Redis runs a script without interleaving other commands, so it is atomic and costs one round trip. Load it once, call EVALSHA and reload it on a NOSCRIPT error.',
        'Read the time with Redis TIME inside the script so a skewed gateway clock cannot mint tokens. Keys of one subject share a hash tag (rl:{ak_123}:rpm, rl:{ak_123}:tpm), so a multi-key script stays in one cluster slot.',
        'Local buckets in each gateway skip the hop but are approximate: if each holds the full limit, a key spread over N gateways gets up to N× its limit; if each holds limit ÷ N, uneven load rejects too early. Periodic sync narrows both errors.',
        'Enforce at the API gateway, which rejects before any backend work and keeps policy in one place. A sidecar covers internal service-to-service calls, and an in-service library is needed when the cost is only known inside the service.',
      ],
    },
    {
      heading: 'Multi-region budgets and hot keys',
      points: [
        'A global limit kept in one region would put a cross-region round trip on every request. Instead each region enforces a share of the limit in its own Redis, so checks stay local.',
        'A budget allocator resizes the shares every few seconds from each region’s recent demand, keeping a floor so a quiet region can still admit a burst. Shares sum to the global limit, so overshoot is limited to tokens a region held when its share shrank.',
        'Limits that must be exact globally, such as a paid monthly quota, get a home region that holds the bucket; other regions call it and accept the extra latency on those few routes.',
        'A hot key (one huge customer, or an attacker at 50K requests/s) saturates one shard. Absorb it with a gateway-local pre-limiter, by leasing tokens in batches (take 100 at a time) or by splitting the key into k sub-buckets of limit ÷ k.',
        'Cache denials: once Redis says a key is blocked until time t, gateways reject it from memory until t, so a client hammering after its 429 costs no Redis calls.',
      ],
    },
    {
      heading: 'LLM APIs: requests and tokens per minute',
      points: [
        'LLM providers publish limits as both requests per minute and tokens per minute (RPM and TPM). A call must fit both buckets, and for long prompts the TPM budget usually binds first.',
        'Input tokens are known on arrival but output length is not, so reserve input + max_tokens up front. Afterward reconcile with the reported usage: refund the unused part, or record an overrun (a low input estimate) as debt that blocks calls until refill repays it.',
        'Providers count differently. OpenAI’s rate-limit guide says a request counts as the maximum of max_tokens and an estimate based on its character count; Anthropic’s docs describe a token bucket with separate input and output limits, where max_tokens does not count toward output.',
        'A reservation that is never reconciled (the gateway crashed mid-stream) simply stays fully charged, which fails safe, and its record expires on its own. Reconcile deletes the record atomically, so a retried settlement cannot refund twice.',
        'A call whose estimate exceeds the bucket capacity can never fit, so reject it with a non-retryable 400 rather than a 429 that invites endless retries. Long streams also hold GPU time, so cap concurrent in-flight calls per key as well.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Algorithm',
      choice: 'Token bucket with lazy refill',
      rationale:
        'Two numbers per key, an explicit burst size and natural weighted costs. Fixed windows allow double bursts at boundaries, and sliding logs need memory per request.',
    },
    {
      decision: 'Shared state',
      choice: 'Regional Redis cluster, one Lua script call per check',
      rationale:
        'Exact within a region for ~0.5 ms per check. Purely local buckets avoid the hop but admit up to N× the limit across N gateways, so they serve only as the outage fallback.',
    },
    {
      decision: 'Enforcement point',
      choice: 'API gateway, plus a library where cost is only known after the call',
      rationale:
        'The gateway rejects before any backend work and keeps one copy of the policy. Libraries in every service would duplicate rules and drift between versions; sidecars cover internal traffic.',
    },
    {
      decision: 'Limiter outage',
      choice: 'Fail open to local buckets by default; fail closed on login, OTP and costly routes',
      rationale:
        'A limiter outage should not take the API down with it. Where abuse is expensive or dangerous (credential stuffing, SMS fees, GPU time), a 503 is cheaper than unlimited traffic.',
    },
    {
      decision: 'Global limits across regions',
      choice: 'Per-region shares rebalanced asynchronously',
      rationale:
        'Checks stay in the region at the cost of a small, bounded overshoot while shares move. A single global store would add a cross-region round trip to every request.',
    },
  ],
  failureModes: [
    'Redis shard down or slow: give the script call a timeout of a few ms, trip a circuit breaker and apply each route’s fail mode. Alert on the fallback rate, because local buckets are only approximate.',
    'Hot key saturating one shard: per-key command rates in shard metrics expose it; move that key to the gateway-local pre-limiter and denial cache, or split it into sub-buckets.',
    'Clock skew: gateways with fast clocks would mint tokens if they supplied the time. Use Redis TIME inside the script, and treat time moving backwards (e.g. after a failover) as no elapsed time.',
    'Retry storm: thousands of clients told Retry-After: 30 all return in the same second. Add jitter to Retry-After and keep rejections cheap (denial cache, no backend call) so 429s alone cannot overload the gateways.',
    'Bad rule push, such as a limit of 1/min for everyone: validate rules, run new ones in shadow mode that only logs would-be rejections, roll out region by region and keep versions for instant rollback.',
  ],
  code: {
    label:
      'TypeScript: token bucket with lazy refill, weighted costs and reserve-then-reconcile for LLM tokens',
    language: 'TypeScript',
    code: `export interface Reservation { readonly tokens: number; settled: boolean }
export type Decision = { ok: true; reservation: Reservation } | { ok: false; retryAfterMs: number };
// Token bucket with lazy refill (no timers) and weighted costs. Balances are kept in 1/windowMs
// token units, so refill is exact integer math: no float drift at window boundaries. In
// production the same steps run inside one Redis Lua script, which makes them atomic.
export class TokenBucket {
  private balance: number; // scaled tokens, always within [0, max]
  private debt = 0; // scaled tokens owed for under-estimated usage; > 0 only when balance is 0
  private last: number;
  private readonly max: number; // capacity in scaled units
  private readonly perWindow: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  /** Holds at most capacity tokens and refills perWindow tokens every windowMs milliseconds. */
  constructor(capacity: number, perWindow: number, windowMs: number, now: () => number) {
    const ints = [capacity, perWindow, windowMs, capacity * windowMs];
    if (!ints.every((v) => Number.isSafeInteger(v) && v > 0)) throw new RangeError('bad limits');
    this.max = capacity * windowMs;
    this.perWindow = perWindow;
    this.windowMs = windowMs;
    this.now = now;
    this.balance = this.max; // a new key may burst up to its full capacity
    this.last = Math.floor(now());
  }

  private refill(): void {
    const t = Math.floor(this.now());
    if (!(t > this.last)) return; // a clock stepping backwards (or NaN) must not mint tokens
    let added = (t - this.last) * this.perWindow;
    this.last = t;
    const repaid = Math.min(added, this.debt); // refill pays off debt first
    this.debt -= repaid;
    added -= repaid;
    this.balance = Math.min(this.max, this.balance + added);
  }

  /** Charges cost tokens now, or reports how long until they could be charged. */
  reserve(cost: number): Decision {
    const need = cost * this.windowMs;
    // A cost above capacity can never fit: reject it explicitly (HTTP 400/413), not with a
    // 429 whose Retry-After would make the client retry forever.
    if (!Number.isSafeInteger(cost) || cost < 1 || need > this.max) {
      throw new RangeError('cost must be an integer between 1 and capacity');
    }
    this.refill();
    if (this.balance < need) {
      const shortfall = need + this.debt - this.balance;
      return { ok: false, retryAfterMs: Math.ceil(shortfall / this.perWindow) };
    }
    this.balance -= need;
    return { ok: true, reservation: { tokens: cost, settled: false } };
  }

  /** Settles a reservation: refunds unused tokens or charges the overrun, as debt if needed. */
  reconcile(r: Reservation, actual: number): void {
    if (!Number.isSafeInteger(actual) || actual < 0) throw new RangeError('bad actual usage');
    if (r.settled) return; // a retried settlement must not refund or charge twice
    r.settled = true;
    this.refill();
    const extra = (actual - r.tokens) * this.windowMs;
    if (extra > 0) {
      const paid = Math.min(extra, this.balance);
      this.balance -= paid;
      this.debt += extra - paid; // blocks new requests until refill repays it
    } else {
      const cleared = Math.min(-extra, this.debt); // a refund pays off debt first
      this.debt -= cleared;
      this.balance = Math.min(this.max, this.balance - extra - cleared);
    }
  }

  available(): number { // whole tokens spendable now, e.g. for a RateLimit header
    this.refill();
    return Math.floor(this.balance / this.windowMs);
  }
}

/** An LLM call must fit both the tokens-per-minute and the requests-per-minute bucket. */
export function admitLlmCall(
  tpm: TokenBucket, rpm: TokenBucket, inputTokens: number, maxOutputTokens: number,
): Decision {
  if (inputTokens < 0 || maxOutputTokens < 1) throw new RangeError('bad token counts');
  // Output length is unknown until generation ends, so reserve the worst case up front.
  const tokens = tpm.reserve(inputTokens + maxOutputTokens);
  if (!tokens.ok) return tokens;
  const request = rpm.reserve(1);
  if (!request.ok) tpm.reconcile(tokens.reservation, 0); // hand the tokens back
  return request.ok ? tokens : request;
}`,
  },
  followUps: [
    {
      question: 'What runs inside the Redis script, step by step?',
      answer:
        'Read TIME, HMGET tokens, debt and last_ms for each key and refill each bucket from the elapsed time. If every bucket has enough, subtract the cost from all of them and write the reservation record; otherwise compute the retry delay. Then HSET the buckets, PEXPIRE them to their time-until-full and return allowed, remaining and retry-after in one round trip.',
    },
    {
      question: 'How would you limit concurrent LLM streams, not just their rate?',
      answer:
        'Keep in-flight call IDs per key in a sorted set scored by start time: admit only if ZCARD is under the limit, remove the ID on completion and drop entries older than the longest allowed call so crashed calls do not leak slots. Stripe’s 2017 post "Scaling your API with rate limiters" describes a similar concurrent-requests limiter alongside its token-bucket request limiter.',
    },
    {
      question: 'How do you roll out a tighter limit without breaking customers?',
      answer:
        'Ship the new rule in shadow mode: evaluate it next to the live rule and log, per key, the requests it would reject, without enforcing it. Contact the affected customers or grant overrides, then enforce region by region while watching 429 rates, with the previous version ready for rollback. RateLimit headers let well-behaved clients slow down before they hit 429s.',
    },
  ],
};
