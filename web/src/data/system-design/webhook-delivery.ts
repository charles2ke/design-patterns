import type { SystemDesignQuestion } from '../../types/system-design';

export const webhookDelivery: SystemDesignQuestion = {
  slug: 'webhook-delivery',
  title: 'Design a webhook delivery system',
  difficulty: 'Medium',
  companies: ['OpenAI', 'Stripe'],
  prompt:
    'Design the system that delivers webhooks to customers. When something happens on our platform, such as a payment succeeding or a batch job finishing, every customer endpoint subscribed to that event type should receive a signed HTTPS POST. Assume 200 million events per day, 1 million registered endpoints, 1.5 subscribed endpoints per event on average and 3× traffic peaks; some endpoints will be slow or down for days.',
  signals: [
    'States the delivery contract up front: at-least-once with a stable event ID, idempotent consumers and no ordering guarantee, with events emitted through a transactional outbox so none are lost or invented.',
    'Isolates endpoints from each other with per-endpoint queues and concurrency caps, so one slow or failing customer cannot delay deliveries to everyone else.',
    'Designs retries deliberately: capped exponential backoff with full jitter over about three days, then marking deliveries failed, alerting the owner and disabling the endpoint.',
    'Treats security as part of the design: HMAC signatures with a timestamp against forgery and replay, secret rotation without downtime, and SSRF protection for user-supplied URLs.',
  ],
  requirements: {
    functional: [
      'Customers register HTTPS endpoints, choose the event types each one receives and get a signing secret they can rotate.',
      'Every event is delivered as a signed POST to each subscribed endpoint, with automatic retries for up to ~3 days.',
      'Customers can inspect every delivery attempt (status code, latency, error) and manually replay one event or a time range.',
      'Endpoints that keep failing are flagged and their owners alerted; an endpoint with no successful delivery for 3 days is disabled.',
    ],
    nonFunctional: [
      'No lost or phantom events: an event is emitted if and only if the business change behind it committed.',
      'Healthy endpoints receive events within ~5 s of the commit at p99.',
      'Isolation: a slow, failing or high-volume endpoint never delays deliveries to other endpoints.',
      'Receivers can reject forged or replayed requests, and customer-supplied URLs can never be used to reach our internal network (SSRF).',
    ],
    outOfScope: [
      'How producing services design and version their event schemas.',
      'Exactly-once delivery: after a timeout the sender cannot tell a lost request from a lost response, so the contract is at-least-once plus a stable ID for deduplication.',
      'Other transports such as WebSocket streams or delivery into customers’ own message queues.',
    ],
  },
  estimates: [
    'Deliveries: 200M events/day × 1.5 endpoints = 300M/day ÷ 86,400 s ≈ 3,500/s on average and ≈ 10,400/s at a 3× peak.',
    'Concurrency (Little’s law): 10,400/s × ~300 ms average response ≈ 3,100 requests in flight, but 10% of peak traffic (~1,000/s) hanging until a 10 s timeout alone holds ≈ 10,000 connections, so timeouts and caps size the worker pool.',
    'Backlog: a dead endpoint subscribed to 100 events/s accumulates 100 × 259,200 s (3 days) ≈ 26M pending deliveries, so per-endpoint queues must live in durable, indexed storage rather than memory.',
    'Storage: 200M payloads × ~2 KB ≈ 400 GB/day, or ≈ 12 TB to keep 30 days for replay, stored once per event rather than per endpoint; the attempt log adds ≥ 300M × ~200 bytes ≈ 60 GB/day.',
    'Signing: HMAC-SHA256 over a 2 KB payload takes a few µs on one core, so even 10,400/s × 5 µs ≈ 0.05 core; the cost is network I/O and open connections, not cryptography.',
    'Retries: full-jitter waits average half of min(6 h, 30 s × 2^(n-1)), so the first 10 waits sum to ≈ 4.3 h and later ones average 3 h; a dead endpoint gets ≈ 34 attempts in the 3-day window.',
  ],
  api: `POST /v1/webhook_endpoints
Authorization: Bearer <api-key>
{ "url": "https://shop.example/hooks", "eventTypes": ["payment.succeeded"] }
-> 201 Created  { "id": "we_123", "secret": "whsec_...", "status": "ENABLED" }
-> 400 Bad Request (not https, private or reserved address, unknown event type)

POST /v1/webhook_endpoints/we_123/secrets/rotate  { "oldSecretExpiresIn": 86400 }
-> 200 OK  { "secret": "whsec_..." }     (both secrets sign until the old one expires)

GET /v1/webhook_endpoints/we_123/deliveries?status=failed&cursor=...
-> 200 OK  { "data": [ { "eventId": "evt_789", "status": "FAILED", "attempts": 34,
                         "lastResponse": 503 } ], "next": "..." }

POST /v1/webhook_endpoints/we_123/deliveries/evt_789/retry
-> 202 Accepted   (manual replay: same event ID, fresh timestamp and signature)
POST /v1/webhook_endpoints/we_123/replays  { "from": "<time>", "to": "<time>" }
-> 202 Accepted   (bulk replay of a time range, rate-limited like normal traffic)

Outbound request to the customer endpoint:
POST https://shop.example/hooks
Content-Type: application/json
Webhook-Id: evt_789                          (stable across retries: the dedup key)
Webhook-Signature: t=1767225600,v1=5f2a...,v1=91c0...    (one v1 per active secret)
{ "id": "evt_789", "type": "payment.succeeded", "created": 1767225600, "data": {} }
-> 2xx within 10 s = delivered; any other status, timeout or redirect = retry later`,
  dataModel: `outbox           in each producing service database, written in the business transaction
  event_id      string     primary key; becomes the Webhook-Id header
  account_id, type, payload, created_at
                           the CDC relay publishes each row to Kafka; a cleanup job
                           deletes rows once they are published

events           event_id primary key; payload stored once; TTL 30 days (replay window)
  account_id, type, created_at, payload json

endpoints        partitioned by account_id
  endpoint_id   string     primary key
  url           string     https only; its address is re-checked on every send
  event_types   string[]   subscription filter
  secrets       json       KMS-encrypted [{ "secret": "...", "expires_at": null }, ...]
  status        enum       ENABLED | FAILING | DISABLED
  max_in_flight int        concurrency cap, default 10

deliveries       partitioned by endpoint_id; one row per (event, endpoint)
  (event_id, endpoint_id)  primary key: inserted if absent, so republished events dedupe
  status        enum       PENDING | IN_FLIGHT | SUCCEEDED | FAILED
  attempts      int
  first_attempt_at, next_attempt_at, lease_until   timestamps
  index (endpoint_id, status, next_attempt_at): the due queue of each endpoint

attempts         append-only log, TTL 30 days
  event_id, endpoint_id, attempt_no, sent_at, status_code, latency_ms, error

Workers read due rows per endpoint through the deliveries index and stop at max_in_flight;
the dashboard reads attempts by (endpoint_id, event_id). Payloads are never copied.`,
  architecture: {
    diagram: `+------------------------+ 1. CDC +--------------------------+
| Service DB: business   |------->| Kafka: events topic      |
| row + outbox, one tx   | relay  +-------------+------------+
+------------------------+                      | 2. consume
                                                v
+------------------------+ lookup +--------------------------+
| Endpoint registry:     |<-------| Fan-out workers          |
| url, types, secrets    |        +-------------+------------+
+------------------------+                      | 2. one row per
                                                v  (event, endpoint)
+------------------------+ 6.     +--------------------------+
| Dashboard: delivery    | replay | Deliveries: per-endpoint |
| logs, manual replay    |------->| queues + attempt log     |
+------------------------+        +---+------------------+---+
                                      | 3. due,          ^ 5. done or
                                      v   under cap      |  retry at t
                                  +---+------------------+---+
                                  | Delivery workers: SSRF   |
                                  | guard, sign, POST (10 s) |
                                  +-------------+------------+
                                                | 4. signed POST
                                                v
                                        Customer endpoint`,
    flow: [
      'A producing service writes its business row and an outbox row in one database transaction, and a CDC relay publishes committed outbox rows to Kafka. A rollback never emits an event; a commit always does, possibly twice but with the same event ID.',
      'Fan-out workers consume the topic, store the payload once, look up the endpoints subscribed to the event type in the registry and insert one deliveries row per (event_id, endpoint_id) if it does not already exist.',
      'Delivery workers lease due rows endpoint by endpoint and never exceed an endpoint’s in-flight cap, so a slow endpoint only delays its own queue.',
      'For each attempt, a worker resolves the hostname, rejects private, loopback and metadata addresses, connects to the vetted IP, signs the payload with every active secret and POSTs it with a 10 s timeout and redirects disabled.',
      'A 2xx marks the delivery SUCCEEDED; anything else schedules a retry with capped exponential backoff and full jitter, and after 3 days the delivery is marked FAILED and the owner alerted. Every attempt is written to the attempt log.',
      'Customers inspect attempts in the dashboard and replay a delivery, which re-enqueues the same event ID with a fresh timestamp and signature.',
    ],
  },
  deepDives: [
    {
      heading: 'Emitting events reliably with a transactional outbox',
      points: [
        'Writing the business row and then publishing to Kafka is a dual write: a crash in between loses the event, and publishing first can announce a change that later rolls back.',
        'With an outbox, the service inserts the event into an outbox table in the same local transaction as the business change, so the event exists if and only if the change committed.',
        'A relay moves outbox rows to Kafka, ideally by tailing the database log with change data capture (Debezium is a widely used open-source option). Polling by increasing ID is simpler but can skip rows whose transactions commit out of ID order.',
        'The relay is at-least-once and may republish rows after a crash. Fan-out inserts each delivery only if (event_id, endpoint_id) is absent, and receivers dedupe on the Webhook-Id, so a duplicate is harmless at both ends.',
      ],
    },
    {
      heading: 'Per-endpoint isolation and retry scheduling',
      points: [
        'One shared FIFO queue lets an endpoint that hangs for 10 s per request tie up workers and delay everyone (head-of-line blocking). Instead, each endpoint has its own logical queue and in-flight cap, and workers serve endpoints with due work round-robin.',
        'A Kafka partition per endpoint does not scale to 1M endpoints, so queues are rows in the deliveries table, leased by a conditional update of lease_until (or FOR UPDATE SKIP LOCKED in Postgres); a crashed worker’s lease expires and the row becomes due again.',
        'Retry n waits a uniform random time in [0, min(6 h, 30 s × 2^(n-1))): full jitter, as described in the AWS Architecture Blog post "Exponential Backoff And Jitter", so deliveries that failed together do not retry in synchronized waves.',
        'After repeated failures the endpoint becomes FAILING: it gets one probe at a time instead of its full cap and the owner is emailed. With no success for 3 days it is DISABLED, and its pending deliveries are marked FAILED but kept for replay.',
        'When an endpoint recovers, its backlog drains at its concurrency cap, oldest first, so the recovery does not knock it over again.',
      ],
    },
    {
      heading: 'Signatures, replay protection and secret rotation',
      points: [
        'Each request carries t (Unix seconds) and v1 = hex(HMAC-SHA256(secret, t + "." + raw body)). Stripe publicly documents a signature header of this shape for its webhooks, and its official libraries default to a 5-minute tolerance.',
        'Receivers verify the exact raw bytes before parsing JSON, compare in constant time (crypto.timingSafeEqual in Node) and reject timestamps more than 5 minutes from their clock in either direction. Because t is covered by the MAC, an attacker cannot refresh a captured request.',
        'Rotation: an endpoint may have several active secrets, and each request carries one v1 per secret, so receivers keep working while they switch. Stripe documents the same approach, letting the old secret stay active for up to 24 hours after a roll.',
        'Secrets are 32 random bytes from a CSPRNG, encrypted with a KMS key at rest. Unlike passwords they cannot be stored as hashes, because the sender needs the plaintext to compute every HMAC.',
      ],
    },
    {
      heading: 'SSRF: calling customer-supplied URLs safely',
      points: [
        'A webhook URL is attacker-controlled input, so without checks it can point at 169.254.169.254 (the cloud metadata service), localhost or internal admin endpoints reachable from our network.',
        'Validate at registration and again on every send, because DNS answers change: require https, resolve the hostname and reject any address that is not publicly routable, such as loopback, RFC 1918, link-local, CGNAT (100.64.0.0/10), IPv6 unique-local and IPv4-mapped forms of these.',
        'Connect to the exact IP that passed the check while keeping the original Host header and TLS SNI. Resolving again at connect time would let DNS rebinding swap in an internal address after validation.',
        'Disable redirects (a 3xx counts as a failed attempt) or re-run the full check on every hop, read at most a few KB of the response, and run workers in an isolated egress network whose firewall also blocks internal ranges.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Delivery guarantee',
      choice: 'At-least-once with a stable event ID',
      rationale:
        'A lost 2xx response looks exactly like a failed request, so exactly-once delivery over HTTP is impossible; retrying with the same Webhook-Id lets consumers deduplicate. At-most-once would silently drop payment and job-completion events.',
    },
    {
      decision: 'Ordering',
      choice: 'No ordering guarantee; events carry a timestamp and object version',
      rationale:
        'Per-endpoint FIFO would let one failing event block every later event for up to 3 days and would rule out parallel delivery. Consumers instead ignore stale versions or fetch the current object from the API.',
    },
    {
      decision: 'Event emission',
      choice: 'Transactional outbox + CDC relay',
      rationale:
        'One local transaction makes the event atomic with the change. Dual writes to the database and Kafka lose or invent events on partial failure, and two-phase commit would couple every service to the broker’s availability.',
    },
    {
      decision: 'Per-endpoint queues',
      choice: 'Rows in a durable, indexed deliveries table',
      rationale:
        'An index on (endpoint_id, status, next_attempt_at) handles 1M endpoints, delays of hours and per-endpoint caps. A Kafka partition per endpoint does not scale that far, and a shared partition cannot delay one message without blocking those behind it.',
    },
    {
      decision: 'Signature scheme',
      choice: 'HMAC-SHA256 with a per-endpoint shared secret',
      rationale:
        'HMAC is fast and verifiable in a few lines with any language’s standard library, which matters because every customer implements it. Ed25519 avoids sharing a secret but is missing from some standard libraries, such as Python’s, and mTLS makes each customer configure client-certificate checks.',
    },
  ],
  failureModes: [
    'Endpoint down for days: its deliveries back off to an attempt every few hours, the owner is alerted when it turns FAILING, and after 3 days without a success it is disabled; failed deliveries remain replayable for 30 days.',
    'Slow endpoint that always uses the full 10 s: its in-flight cap holds it to 10 connections, so only its own backlog grows. Per-endpoint queue age and latency metrics trigger the alert.',
    'Retry storm after our own outage: millions of deliveries are overdue at once. A global send-rate limit and the per-endpoint caps drain the backlog at a safe pace, and full jitter on the next retries keeps failures from re-synchronizing.',
    'A relay, fan-out or delivery worker crashes after doing its work but before recording it, so the work repeats. Put-if-absent on (event_id, endpoint_id) absorbs duplicate events, and a repeated POST carries the same Webhook-Id for the receiver to drop.',
    'Leaked secret or DNS rebinding: the owner rolls the secret with immediate expiry, while per-send SSRF checks, IP pinning and the egress firewall stop rebinding; blocked attempts are logged and alerted on.',
  ],
  code: {
    label: 'TypeScript: HMAC signatures with rotation and a replay window, plus a capped retry schedule with full jitter',
    language: 'TypeScript',
    code: `import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const TOLERANCE_SEC = 300;
export type Verdict = 'ok' | 'malformed' | 'stale' | 'mismatch';
type Body = string | Uint8Array;

// Signing "t.body" binds the timestamp, so an old signature cannot be paired with a fresh t.
function sign(secret: string, t: string, body: Body): string {
  return createHmac('sha256', secret).update(t + '.').update(body).digest('hex');
}

/** One v1 per active secret, so receivers keep verifying while a secret is rotated. */
export function signatureHeader(secrets: readonly string[], body: Body, nowSec: number): string {
  if (secrets.length === 0) throw new Error('refusing to send an unsigned webhook');
  const t = String(Math.floor(nowSec));
  return ['t=' + t, ...secrets.map((s) => 'v1=' + sign(s, t, body))].join(',');
}

export function verifySignature(
  header: string,
  body: Body, // the raw bytes received, before any JSON parsing
  secrets: readonly string[],
  nowSec: number,
  toleranceSec = TOLERANCE_SEC,
): Verdict {
  let t: string | undefined;
  const candidates: Buffer[] = [];
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq <= 0) return 'malformed';
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't') {
      if (t !== undefined || !/^\\d{1,12}$/.test(value)) return 'malformed';
      t = value;
    } else if (key === 'v1') {
      candidates.push(Buffer.from(value));
    } // other schemes, such as v0 test signatures, are ignored
  }
  if (t === undefined || candidates.length === 0) return 'malformed';
  // Old and far-future timestamps are both refused; written this way, a NaN clock also fails.
  if (!(Math.abs(nowSec - Number(t)) <= toleranceSec)) return 'stale';
  for (const secret of secrets) {
    // Compare the hex text itself: hex decoding would silently ignore invalid trailing input.
    const expected = Buffer.from(sign(secret, t, body));
    for (const c of candidates) {
      // timingSafeEqual throws on unequal lengths; the length of a hex HMAC is public anyway.
      if (c.length === expected.length && timingSafeEqual(c, expected)) return 'ok';
    }
  }
  return 'mismatch';
}

export interface RetryPolicy {
  baseMs: number;
  capMs: number;
  giveUpAfterMs: number;
}

export const DEFAULT_RETRY: RetryPolicy = {
  baseMs: 30_000,
  capMs: 6 * 3_600_000,
  giveUpAfterMs: 3 * 86_400_000,
};

/** Full jitter: a uniform wait between 0 and min(cap, base * 2^(retry - 1)). */
export function backoffMs(retry: number, policy: RetryPolicy, random: () => number): number {
  if (!Number.isInteger(retry) || retry < 1) throw new RangeError('retry must be >= 1');
  // Clamping the exponent keeps huge retry counts finite and avoids NaN from 0 * Infinity.
  const ceiling = Math.min(policy.capMs, policy.baseMs * 2 ** Math.min(retry - 1, 52));
  const u = random();
  // A broken random source errs toward waiting longer, never toward hammering the endpoint.
  return Math.floor((u >= 0 && u < 1 ? u : 1) * ceiling);
}

/** When to try again after failedAttempts failures, or null once the retry window is over. */
export function nextAttemptAt(
  firstAttemptAtMs: number,
  failedAttempts: number,
  nowMs: number,
  policy: RetryPolicy,
  random: () => number,
): number | null {
  const deadline = firstAttemptAtMs + policy.giveUpAfterMs;
  if (!(nowMs < deadline)) return null;
  // Clamp rather than skip, so the final attempt happens exactly at the deadline.
  return Math.min(nowMs + backoffMs(failedAttempts, policy, random), deadline);
}`,
  },
  followUps: [
    {
      question: 'What must a consumer do to process webhooks safely?',
      answer:
        'Verify the signature and timestamp on the raw body, then record the Webhook-Id in a table with a unique constraint and skip IDs it has already seen. Return 2xx quickly and do slow work asynchronously, so processing time never triggers retries. Because order is not guaranteed, compare object versions or fetch the current state before acting.',
    },
    {
      question: 'A customer says an event never arrived. How do you investigate and recover?',
      answer:
        'Look the event up by ID in the attempt log: it shows whether the endpoint was subscribed and enabled, plus every attempt’s status code, latency and error. The customer fixes the endpoint and replays the event or a time range from the dashboard. Replays reuse the original event IDs, so the customer’s deduplication still works.',
    },
    {
      question: 'When would you choose asymmetric signatures or mutual TLS over HMAC?',
      answer:
        'Ed25519 signatures fit when a key leaked from a receiver must not enable forgery: receivers hold only our public key, and the private key stays in an HSM. mTLS fits enterprise customers whose gateways already verify client certificates. Both cost customers more setup than a few lines of HMAC code, so HMAC stays the default.',
    },
  ],
};
