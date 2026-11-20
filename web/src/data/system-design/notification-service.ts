import type { SystemDesignQuestion } from '../../types/system-design';

export const notificationService: SystemDesignQuestion = {
  slug: 'notification-service',
  title: 'Design a notification service (push, email and SMS)',
  difficulty: 'Medium',
  companies: ['Amazon', 'Meta', 'Apple', 'Airbnb', 'Uber'],
  prompt:
    'Design a notification service that internal teams call to send push notifications, emails and SMS to users. Assume 500 million users and about 1 billion notifications per day, including marketing campaigns to tens of millions of users. One-time passcodes must arrive within seconds even during a campaign, and callers retry on timeouts, so the same request can arrive twice.',
  signals: [
    'Isolates critical traffic (OTPs, security alerts) from bulk campaigns with separate queues and reserved capacity, so a campaign can never delay a passcode.',
    'States that exactly-once delivery through third-party providers is impossible and designs at-least-once delivery with idempotency keys and dedup at every hop.',
    'Handles provider realities: rate limits, transient failures with jittered backoff, dead-letter queues, invalid device tokens and asynchronous status callbacks.',
    'Enforces preferences, opt-outs, quiet hours and frequency caps centrally, so no calling team can spam users by mistake.',
  ],
  requirements: {
    functional: [
      'Internal services send a notification by naming a template, a user and parameters, with an idempotency key so a retried request is not sent twice.',
      'Render the template in the user’s language and deliver it by push (APNs for Apple devices, FCM for Android), email or SMS.',
      'Enforce preferences per category and channel, opt-outs, quiet hours in the user’s time zone and per-user caps on marketing messages.',
      'Run campaigns to audiences of tens of millions, at a fixed time or at the same local time in every time zone, with pause and cancel.',
      'Track each delivery’s status (sent, delivered, bounced, opened) and stop using device tokens and email addresses that providers report as invalid.',
    ],
    nonFunctional: [
      'Critical messages (OTPs, security alerts) reach the provider within 2 s at p99, even while the largest campaign is sending.',
      'Durable: once the API returns 202, the request is committed and will be attempted; delivery is at-least-once, with duplicates suppressed by idempotency keys.',
      'Sustains ≈ 35K sends/s at peak while staying within each provider’s rate limits.',
      'A provider outage degrades only its own channel: the API keeps accepting requests, and messages wait in their queues until the provider recovers.',
    ],
    outOfScope: [
      'Campaign authoring and audience segmentation; assume a segment service returns the user IDs in a segment.',
      'The delivery networks themselves: APNs, FCM and the email and SMS providers are external services with their own limits.',
      'An in-app inbox and real-time in-app messages over WebSockets.',
    ],
  },
  estimates: [
    'Throughput: 1B/day ÷ 86,400 s ≈ 11.6K notifications/s on average; assume a 3× peak ≈ 35K/s, driven mostly by campaigns.',
    'Channels: assume 85% push, 14% email and 1% SMS, or ≈ 9.8K, 1.6K and 116 sends/s on average. SMS is the smallest stream but by far the most expensive per message.',
    'Campaign: 50M recipients at an assumed 20K sends/s take 50M ÷ 20K = 2,500 s ≈ 42 minutes, so a campaign runs beside critical traffic for a long time and must be paced, not burst.',
    'Status writes: assume ~2 per message (the send result plus one delivery, bounce or open event) ≈ 2B/day ≈ 23K/s on average, twice the send rate, so status updates are batched.',
    'Delivery log: 1B rows/day × ~500 bytes ≈ 500 GB/day, or ≈ 15 TB for 30 days of history, so shard by user_id and drop daily partitions after 30 days.',
    'Device tokens: 500M users × ~1.5 devices × ~200 bytes ≈ 150 GB, small enough for a replicated key-value store keyed by user_id.',
  ],
  api: `POST /v1/notifications                          Idempotency-Key: orders:123:shipped
{ "user_id": "u_42", "template": "order_shipped", "params": { "order_id": "123" } }
-> 202 Accepted { "notification_id": "n_9f2c" }    the same response for a retried key
-> 404 Not Found              unknown template
-> 422 Unprocessable Entity   missing parameter, or a reused key with a different body
-> 429 Too Many Requests      caller over its quota; Retry-After: 30

GET /v1/notifications/n_9f2c
-> 200 OK { "deliveries": [ { "channel": "push", "status": "sent" },
            { "channel": "email", "status": "dropped", "reason": "opted_out" } ] }

POST /v1/campaigns { "template": "spring_sale", "segment": "s_77",
                     "send_at": "2025-06-01T09:00", "local_time": true }
-> 202 Accepted { "campaign_id": "c_12" }   then POST /v1/campaigns/c_12/pause or /cancel

PUT /v1/users/u_42/preferences { "promotions": { "email": false, "sms": false },
                                 "quiet_hours": { "start": "22:00", "end": "08:00" },
                                 "time_zone": "Europe/Berlin" }
POST /v1/users/u_42/devices { "platform": "ios", "token": "...", "app_id": "..." }

POST /v1/provider-events/{provider}  signed webhook: delivered, bounced, complaint, opened
-> 200 OK                            replays are ignored (provider_message_id + event)
POST /v1/opens { "notification_id": "n_9f2c" }   sent by the app when a push is tapped`,
  dataModel: `templates          versioned and reviewed; the only source of category and priority
  template_id      string  primary key, e.g. order_shipped
  category         string  what users opt out of, e.g. order_updates, promotions
  priority         enum    critical | transactional | marketing; callers cannot override
  bodies           map     (channel, locale) -> text; falls back pt-BR -> pt -> en

notifications      sharded by user_id; one row per accepted API request
  notification_id  uuid    primary key
  user_id, caller, idempotency_key    UNIQUE: a retried request returns the stored row
  request_hash     bytes   the same key with a different body -> 422
  template_id      string  plus params and created_at
  Inserted in one transaction with its outbox row, so a 202 always reaches the dispatcher.

deliveries         sharded by user_id; one row per recipient and channel
  user_id, dedup_key, channel         PRIMARY KEY: the dispatcher inserts only if absent
  dedup_key        string  caller:Idempotency-Key, or campaign:<id> for campaigns
  status           enum    queued | sent | delivered | opened | bounced | failed | dropped
  attempts         int     plus last_error and provider_message_id
  Inserted with its channel-queue outbox row in one transaction; daily partitions are
  dropped after 30 days, which is the dedup window.

preferences        per user: (category, channel) -> opted in; quiet hours; time zone
device_tokens      (user_id, token) -> platform, app_id, updated_at
marketing_sends    Redis sorted set per user, scored by send time; trimmed to 24 hours
provider_ids       KV provider_message_id -> (user_id, dedup_key, channel), 30-day TTL

Hot path: preference and token reads plus one conditional insert per recipient and
channel, all keyed by user_id; a callback is one KV lookup and one row update.`,
  architecture: {
    diagram: `   Internal services                    Campaign scheduler
           |                                    |
           | POST + Idempotency-Key             | segment, send time
           v                                    v
  +------------------+               +---------------------+
  | Notification API |               |   Fan-out workers   |
  | request row and  |               | page the audience,  |
  | outbox, one txn  |               | throttle to quotas  |
  +--------+---------+               +----------+----------+
           | outbox relay                       |
           v                                    |
  +------------------+   one per recipient      |
  |    Dispatcher    |<-------------------------+
  | dedup, prefs,    |
  | caps, templates  |<---> preferences, caps, device tokens
  +--------+---------+
           | queue per channel x priority (critical first)
           v
  +------------------+     send      +---------------------+
  | Channel workers  |-------------->| APNs, FCM, email    |
  | jittered backoff |<--------------| and SMS providers   |
  | DLQ, token purge |  ack or error +----------+----------+
  +--------+---------+                          |
           | attempt results                    | status webhooks
           v                                    v
  +------------------+               +---------------------+
  |   Delivery log   |<--------------|  Callback receiver  |
  +------------------+    status     | bounces, complaints |
                                     +----------+----------+
                                                ^
                                     push opens |
                                           Mobile apps`,
    flow: [
      'An internal service posts a template name, user ID and parameters with an Idempotency-Key; the API commits the request row and an outbox row in one transaction and returns 202, and a retry with the same key gets the same notification ID.',
      'For a campaign, the scheduler hands the segment to fan-out workers, which page through its user IDs and emit one message per recipient with the key campaign:<id>, paced so the campaign stays within provider limits.',
      'The outbox relay publishes each request to the dispatcher, which drops duplicates, checks preferences, opt-outs, quiet hours and caps, renders the template in the user’s language and enqueues one message per channel on that channel’s queue for its priority.',
      'Channel workers drain critical queues first and call APNs, FCM or the email or SMS provider; they retry transient errors with jittered exponential backoff, dead-letter messages that keep failing and delete device tokens the provider reports invalid.',
      'Workers record each attempt in the delivery log. Email and SMS providers post status events (delivered, bounced or failed, and email opens) to the callback receiver, as the app does for push opens; it updates the log and suppresses bad addresses.',
    ],
  },
  deepDives: [
    {
      heading: 'Idempotency and at-least-once delivery',
      points: [
        'Exactly-once delivery is impossible end to end: if a worker crashes after the provider accepts a message but before recording that, its replacement cannot tell whether the send happened. So choose at-least-once (never lose an accepted request) and make duplicates rare and harmless.',
        'The API inserts the request under a unique (user, caller, Idempotency-Key) constraint in the same transaction as its outbox row, so a caller retrying after a timeout gets the original notification ID; a key reused with a different body gets 422.',
        'The outbox relay and queues redeliver after crashes, so the dispatcher dedups with a conditional insert on (key, user, channel). Scoping by recipient and channel lets one request fan out without deduplicating itself and lets a campaign use one key for every recipient.',
        'Keys must come from the business event (orders:123:shipped), never from a timestamp or a random ID per attempt, or retries look new. Deduplication lasts as long as delivery rows are kept (30 days here); the sample models that window as a TTL.',
        'For the remaining crash window, set a collapse identifier on push (APNs apns-collapse-id, or the Android notification tag with FCM), so a duplicate replaces the earlier notification on screen instead of appearing twice.',
      ],
    },
    {
      heading: 'Priorities, preferences and caps',
      points: [
        'Log-based queues such as Kafka are FIFO per partition, so a shared queue would put an OTP behind a 50M-message campaign. Give each channel a queue per priority, drain critical first, and reserve workers and provider quota for critical traffic.',
        'Priority comes from the reviewed template, not the request, so a team cannot label a campaign critical to skip caps and quiet hours. Critical and transactional messages bypass the marketing cap and do not count toward it.',
        'Preferences are opt-ins per (category, channel), set by the settings page, one-click email unsubscribe (RFC 8058) and SMS STOP replies. They are checked at dispatch and again just before a marketing send, since a campaign message can wait minutes after an opt-out.',
        'Quiet hours use the user’s time zone: a non-critical message that lands inside them is scheduled for the end of the window rather than dropped, while an OTP is always sent at once.',
        'The marketing cap is a sliding window per user across channels: a Redis sorted set scored by send time, trimmed, counted and appended by one Lua script, so two dispatchers cannot both pass the check. The sample keeps the same log in memory.',
      ],
    },
    {
      heading: 'Provider errors, retries and cleanup',
      points: [
        'Classify every provider response as success, retryable (timeouts, 5xx, throttling such as APNs 429 TooManyRequests or FCM QUOTA_EXCEEDED) or permanent (bad payload, invalid token). Permanent errors are never retried; they go straight to the dead-letter queue or trigger cleanup.',
        'Retry with capped exponential backoff and full jitter, a random delay up to min(cap, base × 2^(attempt - 1)), never sooner than the provider’s Retry-After; after the last attempt the message goes to a dead-letter queue that operators can replay once the cause is fixed.',
        'Each message carries an expiry, because an OTP that arrives minutes late is useless: workers drop expired messages instead of retrying them, and APNs (apns-expiration) and FCM (ttl) take the same limit for devices that are offline.',
        'Clean up tokens from send responses: FCM reports UNREGISTERED, and APNs returns 410 (Unregistered) with a timestamp, so delete the token unless the device registered it again after that time.',
        'Email hard bounces and spam complaints arrive by webhook and suppress the address permanently, because mailbox providers judge senders partly by bounce and complaint rates, and a poor reputation sends even password resets to spam.',
      ],
    },
    {
      heading: 'Campaign fan-out',
      points: [
        'Fan-out workers page through the segment by user ID (keyset pagination, 10,000 users per page) and checkpoint the last ID, so a crashed worker resumes mid-campaign; re-sending a page is harmless because every message carries the campaign’s idempotency key.',
        'Pace campaigns with a token bucket per provider, refilled at the provider’s limit minus the share reserved for critical traffic. At 20K sends/s a 50M-user campaign takes ≈ 42 minutes, so the scheduler shows the expected finish time when it is booked.',
        'For a send at 9 a.m. local time, split the audience by time zone and release each slice when 9 a.m. arrives there; this also spreads the load over the day instead of one spike.',
        'Keep marketing email on its own subdomain and IP pool, separate from transactional email, so complaints about a campaign cannot hurt the deliverability of receipts and password resets.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Delivery guarantee',
      choice: 'At-least-once with idempotency keys and dedup',
      rationale:
        'At-most-once would silently lose messages whenever a worker crashes, and exactly-once is impossible because a provider can accept a message just before our worker dies. Dedup at each hop and collapse IDs on push make the rare duplicate harmless.',
    },
    {
      decision: 'Prioritization',
      choice: 'Separate queues per channel and priority',
      rationale:
        'With one shared FIFO queue, an OTP waits behind the campaign backlog. A broker with per-message priorities would reorder the backlog, but critical traffic would still need reserved workers and provider quota, which separate queues make explicit and easy to monitor.',
    },
    {
      decision: 'Template rendering',
      choice: 'Central templates rendered by the dispatcher',
      rationale:
        'Callers send a template name and parameters, so localization, branding and required unsubscribe links live in one reviewed place. Bodies rendered by each caller would duplicate that work in every team and could not be localized or fixed centrally.',
    },
    {
      decision: 'Retry policy',
      choice: 'Capped exponential backoff with full jitter',
      rationale:
        'Fixed-interval retries from many workers arrive in synchronized waves that can knock a recovering provider over again. The 2015 AWS Architecture Blog post "Exponential Backoff And Jitter" shows jittered backoff needs fewer calls and less time than backoff without jitter.',
    },
    {
      decision: 'Campaign fan-out',
      choice: 'Per-user sends paced by our own workers',
      rationale:
        'Provider topics (FCM topics) fan out in one call but cannot apply per-user preferences, caps, quiet hours or tracking. Per-user sends cost far more requests, so topics are kept for identical broadcasts such as breaking news.',
    },
  ],
  failureModes: [
    'Provider outage or throttling: alert on per-provider error rate and queue age. A circuit breaker stops sending and probes for recovery while messages wait in their queues, critical SMS fails over to a second provider, and expired messages are dropped instead of sent late.',
    'A campaign delays critical traffic (a misconfigured priority or shared workers): page on the age of the oldest critical message, not just queue length; separate queues and reserved quota prevent it, and a kill switch pauses all marketing at once.',
    'Runaway caller: a bug sends an alert in a loop with a fresh idempotency key each time. Per-caller quotas return 429, alerts fire on unusual volume per template, and a kill switch per caller or template stops the sends at once.',
    'Poison message: a template that fails to render or a payload the provider rejects would retry forever. Treat it as permanent, dead-letter it with the error, alert on dead-letter growth and replay after a fix, skipping messages that have expired.',
    'OTP abuse (SMS pumping): attackers trigger OTP texts to number ranges whose carrier shares the fees with them. Compare OTP sends per country with completed verifications, rate-limit by phone number, IP and account, and allow only countries you serve.',
  ],
  code: {
    label: 'TypeScript: dispatcher with dedup, preferences, a marketing cap and jittered retries',
    language: 'TypeScript',
    code: `export type Channel = 'push' | 'email' | 'sms';
export type Priority = 'critical' | 'transactional' | 'marketing';
export type DropReason = 'duplicate' | 'opted_out' | 'frequency_cap';

export interface Notification {
  readonly idempotencyKey: string; // chosen by the calling service, e.g. "orders:123:shipped"
  readonly userId: string;
  readonly channel: Channel;
  readonly category: string; // the unit users opt out of, e.g. "promotions"
  readonly priority: Priority; // from the template registry, so a campaign cannot claim critical
}

export type Decision =
  | { readonly action: 'enqueue'; readonly queue: string }
  | { readonly action: 'drop'; readonly reason: DropReason };

export type RetryDecision =
  | { readonly action: 'retry'; readonly at: number }
  | { readonly action: 'dead_letter'; readonly reason: 'not_retryable' | 'max_attempts' };

export interface DispatcherOptions {
  readonly now: () => number;
  readonly random: () => number; // uniform in [0, 1)
  readonly allows: (userId: string, channel: Channel, category: string) => boolean;
  readonly dedupTtlMs: number;
  readonly marketingCap: { readonly max: number; readonly windowMs: number }; // per user
  readonly retry: { readonly baseMs: number; readonly maxMs: number; readonly maxAttempts: number };
}

const drop = (reason: DropReason): Decision => ({ action: 'drop', reason });

export class Dispatcher {
  private readonly opts: DispatcherOptions;
  private readonly seen = new Map<string, number>(); // dedup id -> time first seen
  private readonly marketingSent = new Map<string, number[]>(); // userId -> recent send times

  constructor(opts: DispatcherOptions) {
    const { dedupTtlMs, marketingCap: cap, retry: r } = opts;
    const limits = [dedupTtlMs, cap.max, cap.windowMs, r.baseMs, r.maxMs, r.maxAttempts];
    if (!limits.every((v) => Number.isFinite(v) && v > 0) || r.baseMs > r.maxMs) {
      throw new RangeError('invalid dispatcher options');
    }
    this.opts = opts;
  }

  submit(n: Notification): Decision {
    const now = this.time();
    // Keys are added in time order, so expired ones sit at the front of the map.
    for (const [id, at] of this.seen) {
      if (now - at < this.opts.dedupTtlMs) break;
      this.seen.delete(id);
    }
    // Scoped to recipient and channel so one request can fan out without deduplicating itself.
    const id = JSON.stringify([n.idempotencyKey, n.userId, n.channel]);
    const firstSeen = this.seen.get(id);
    if (firstSeen !== undefined && now - firstSeen < this.opts.dedupTtlMs) return drop('duplicate');
    // In production this is a conditional insert in the same transaction as the outbox row.
    this.seen.set(id, now);
    if (!this.opts.allows(n.userId, n.channel, n.category)) return drop('opted_out');
    if (n.priority === 'marketing') {
      const windowStart = now - this.opts.marketingCap.windowMs;
      const recent = (this.marketingSent.get(n.userId) ?? []).filter((t) => t > windowStart);
      this.marketingSent.set(n.userId, recent);
      if (recent.length >= this.opts.marketingCap.max) return drop('frequency_cap');
      recent.push(now);
    }
    // One queue per channel and priority, so a bulk campaign never sits in front of an OTP.
    return { action: 'enqueue', queue: n.channel + '.' + n.priority };
  }

  /** Called by a channel worker when a delivery attempt fails; attempts are numbered from 1. */
  onFailure(attempt: number, retryable: boolean, retryAfterMs = 0): RetryDecision {
    if (!Number.isSafeInteger(attempt) || attempt < 1) throw new RangeError('attempt must be >= 1');
    if (!Number.isFinite(retryAfterMs)) throw new RangeError('bad retryAfterMs');
    if (!retryable) return { action: 'dead_letter', reason: 'not_retryable' };
    const { baseMs, maxMs, maxAttempts } = this.opts.retry;
    if (attempt >= maxAttempts) return { action: 'dead_letter', reason: 'max_attempts' };
    // Full jitter: retries after a provider outage spread out instead of arriving in waves.
    const delay = Math.floor(this.opts.random() * Math.min(maxMs, baseMs * 2 ** (attempt - 1)));
    return { action: 'retry', at: this.time() + Math.max(delay, retryAfterMs) };
  }

  private time(): number {
    const t = this.opts.now();
    // A NaN time would expire every dedup key at once and let duplicates through.
    if (!Number.isFinite(t)) throw new RangeError('clock returned a non-finite time');
    return t;
  }
}`,
  },
  followUps: [
    {
      question: 'How do you keep OTPs flowing when your SMS provider has an outage?',
      answer:
        'Keep a second SMS provider warm with a share of normal traffic, so failover is exercised every day. When the primary’s circuit breaker opens, resend the same message through the secondary, so the code stays valid even if the primary delivers late. If SMS keeps failing, the login screen offers email or an authenticator app.',
    },
    {
      question: 'How do you keep notifications in order, such as "shipped" before "delivered"?',
      answer:
        'Partitioning queues by user ID keeps one user’s messages in order, but a retry can still overtake a newer message. So messages about the same entity carry a version, workers drop a retry once a newer version has been sent, and a shared collapse ID makes the newer notification replace the older on screen.',
    },
    {
      question: 'How would you add a new channel, such as a chat app?',
      answer:
        'Add a channel worker with the same send interface and error classification, queues per priority, a preference per category for the channel and template bodies for it. The API, dedup, preference checks and caps are channel-agnostic, so callers opt in by adding the channel to their templates.',
    },
  ],
};
