import type { SystemDesignQuestion } from '../../types/system-design';

export const paymentSystem: SystemDesignQuestion = {
  slug: 'payment-system',
  title: 'Design a payment system',
  difficulty: 'Hard',
  companies: ['Amazon', 'Apple', 'Stripe'],
  prompt:
    'Design a payment system that lets merchants accept card payments: authorize, capture, void and refund, reaching the card networks through external payment service providers (PSPs). Every movement of money must be auditable, and a retried request must never charge a customer twice. Assume 10M payments a day, with peaks at 10× the average.',
  signals: [
    'Treats correctness as the requirement that shapes everything: every retry path (client, PSP call, webhook, event) is deduplicated with idempotency keys, turning at-least-once delivery into exactly-once effects.',
    'Models the payment as an explicit state machine and handles the hardest case, a PSP timeout, as an unknown outcome resolved by asking the PSP, never by retrying with a new key.',
    'Keeps money in a double-entry ledger: immutable, balanced entries in integer minor units, balances derived from entries, and mistakes corrected by reversing entries rather than edits.',
    'Knows the payments ecosystem: PSPs and card networks, tokenization to shrink PCI DSS scope, risk checks before authorization, asynchronous webhooks and daily reconciliation against settlement files.',
  ],
  requirements: {
    functional: [
      'Authorize a card payment, then capture it (fully or partially) or void it; refund a captured payment in one or more partial or full refunds, up to the captured amount.',
      'Every mutating request carries an idempotency key: a retry with the same key and body returns the original response and never repeats the side effect.',
      'Record every movement of money in a double-entry ledger that yields any account’s balance and history as of any point in time.',
      'Report payment status through a GET endpoint and publish events (authorized, captured, refunded, failed) for order, payout and notification services.',
    ],
    nonFunctional: [
      'Correctness over availability: never double-charge and never lose an acknowledged payment; when the outcome is uncertain, return a retryable error or an unknown status rather than guess.',
      'Auditable: ledger entries are append-only and kept for 7 years (an assumed retention policy), and every state transition records what caused it.',
      'Minimal PCI DSS scope: card numbers travel from the browser to the PSP and never touch our servers, logs or databases.',
      'Latency: p99 authorization under ≈ 2 s, most of it spent at the PSP and card network; our own work (key claim, risk score, writes) gets a ≈ 150 ms budget.',
    ],
    outOfScope: [
      'Building a PSP or acquirer, direct card-network connections and interchange pricing.',
      'Merchant onboarding (KYC), payout scheduling and tax calculation.',
      'Currency-conversion pricing and FX risk; the ledger only records conversions.',
    ],
  },
  estimates: [
    'Traffic: 10M payments/day ÷ 86,400 s ≈ 116/s on average and ≈ 1,160/s at a 10× peak; authorize plus capture makes that ≈ 2,300 PSP calls/s.',
    'Concurrency: ≈ 2,300 calls/s × ≈ 0.5 s average PSP latency ≈ 1,150 calls in flight, so the PSP adapter uses non-blocking I/O and no database transaction stays open across a PSP call.',
    'Writes: with ≈ 5 transactions and ≈ 20 row writes per payment (key records, state changes, 6 ledger entries, outbox and webhook rows), the peak is ≈ 5,800 commits/s and ≈ 23,000 row writes/s; 8 shards keep each primary near 2,900 row writes/s.',
    'Ledger: 6 entries per payment (3 at capture, 3 at settlement) × 10M = 60M/day ≈ 21.9B/year; at ≈ 200 B per entry with indexes that is ≈ 4.4 TB/year, ≈ 31 TB over 7 years, or ≈ 3.8 TB per shard.',
    'Idempotency records: ≈ 2 keyed requests per payment × 10M = 20M/day × ≈ 1 KB (fingerprint and stored response) ≈ 20 GB live with 24 h retention, small enough to commit in the payments database with the payment itself.',
    'Reconciliation: settlement files carry ≈ 10M lines × 200 B ≈ 2 GB/day; even a 0.01% mismatch rate is ≈ 1,000 exceptions/day, so matching is automated and only exceptions reach people.',
  ],
  api: `POST /v1/payments                                     authorize now, capture later
Idempotency-Key: 8e1c0a52-...     (required on every POST; scoped to the merchant)
{ "order_id": "o_123", "amount": 1999, "currency": "USD",
  "payment_token": "tok_...", "capture_method": "manual" }   (token from PSP fields)
-> 201 Created               { "payment_id": "pay_s3_9f2", "status": "authorized" }
-> 402 Payment Required      { "payment_id": "pay_s3_9f2", "status": "failed",
                               "decline_code": "insufficient_funds" }
-> 202 Accepted              { "payment_id": "pay_s3_9f2", "status": "unknown" }
                             (PSP timed out; poll GET or wait for the webhook)
-> 409 Conflict              (same key still in flight on another server; retry later)
-> 422 Unprocessable Content (same key reused with a different body)
-> 400 Bad Request           (missing key or invalid body; nothing is stored)
A retry with the same key and body gets the stored status code and body, plus the
header Idempotent-Replayed: true.

POST /v1/payments/{id}/capture   Idempotency-Key   { "amount": 1999 }
-> 200 { "status": "captured" }     -> 409 if no longer authorized (voided, expired)
POST /v1/payments/{id}/void      Idempotency-Key   -> 200 { "status": "voided" }
POST /v1/payments/{id}/refunds   Idempotency-Key   { "amount": 500 }
-> 201 { "refund_id": "re_41", "status": "pending" }
-> 400 if refunds would exceed the captured amount
GET  /v1/payments/{id}  -> 200 { "status", "amount", "captured", "refunded", ... }

POST /internal/webhooks/{psp}    signature verified; deduplicated by PSP event id
-> 200 only once the event is stored; the PSP redelivers on any other response`,
  dataModel: `payments              sharded by merchant_id; one row per payment
  payment_id        string     primary key with the shard baked in (pay_s3_9f2);
                               also the idempotency key sent to the PSP
  merchant_id       uuid       shard key
  order_id          string     one live payment per order: unique (merchant_id, order_id)
                               where status is not failed or voided
  amount            int64      minor units (1999 = 19.99 USD); never a float
  currency          char(3)    ISO 4217 code
  status            enum       created | authorized | captured | settled | failed |
                               voided | refunded | unknown
  psp, psp_ref      string     provider and its reference, matched in reconciliation
  captured, refunded  int64    running totals; refunds keep refunded <= captured
  version           int64      every transition is a compare-and-set on (status, version)

idempotency_keys      same shard as the payment; purged after 24 h
  (merchant_id, key)           primary key; insert-if-absent claims the key
  fingerprint       bytes      SHA-256 of method, path and canonical body
  state             enum       in_progress (with a lease) | done
  response          json       stored status code and body, replayed on retries

ledger_entries        append-only: the service may INSERT and SELECT, never UPDATE/DELETE
  entry_id          int64      primary key
  tx_id             string     deterministic, e.g. capture:pay_s3_9f2; entries sum to 0
  account           string     merchant_payable:m_7, psp_receivable:shard_3, fees, ...
  amount            int64      debit > 0, credit < 0, in minor units
  currency          char(3)    exactly one currency per tx_id
  index (account, currency, entry_id) for balances and statements

refunds               refund_id, payment_id, amount, status, psp_ref
transitions           append-only audit: payment_id, from, to, cause (request or event id)
psp_events            (psp, event_id) primary key: redelivered webhooks are dropped
outbox                event_id, type, payload, created_at, published_at

Each state change writes the payment, key, ledger, transition and outbox rows in one
local transaction on the merchant shard; no transaction ever spans shards.`,
  architecture: {
    diagram: `Buyer browser --card number--> PSP-hosted fields --> token
  |
  | token -> merchant server -> POST /v1/payments
  | (Idempotency-Key, token, amount in minor units)
  v
+---------------------+   score   +----------------+
|   Payment service   |---------->|  Risk service  |
|   (state machine)   |           +----------------+
+---------------------+
  |           |
  |           | authorize / capture, PSP idempotency key = payment_id
  |           v
  |   +---------------+       +-------+
  |   |  PSP adapter  |------>|  PSP  |----> card networks
  |   +---------------+       +-------+
  |                             |   |
  |                    webhooks |   | daily settlement file
  |                             v   v
  |                   +-------------------------+
  |                   | Webhook handler and     |
  |                   | reconciliation job      |
  |                   +-------------------------+
  |                                |
  v                                v
+----------------------------------------------------+
| Payments DB, sharded by merchant_id: payment row,  |
| idempotency record, ledger entries and outbox row  |
| commit in one transaction                          |
+----------------------------------------------------+
  |
  | outbox relay
  v
Event bus --> orders, payouts, notifications`,
    flow: [
      'The buyer’s browser sends the card number straight to the PSP’s hosted fields and gets a token back; the merchant’s server then calls POST /v1/payments with the token, the amount in minor units and an Idempotency-Key.',
      'The payment service claims the key on the merchant’s shard (replaying a stored response, or answering 409 or 422), commits the payment as created and asks the risk service to allow it, block it or require 3-D Secure.',
      'The PSP adapter sends the authorization to the PSP, which routes it over the card networks to the issuing bank, with payment_id as the PSP idempotency key; a timeout marks the payment unknown for a resolver to settle.',
      'One transaction on the shard records the outcome: payment status, stored response, ledger entries (on capture) and an outbox row, which a relay publishes to the event bus for orders, payouts and notifications.',
      'PSP webhooks and the daily settlement file reach the webhook handler and reconciliation job, which drop duplicate events, apply only valid transitions, mark captures settled and queue mismatches for review.',
    ],
  },
  deepDives: [
    {
      heading: 'Idempotency keys and exactly-once effects',
      points: [
        'Every hop delivers at least once: clients retry on timeouts, we retry PSP calls, PSPs redeliver webhooks and the outbox relay republishes events. Exactly-once is an effect, built by deduplicating at each hop on a key that survives the retry.',
        'The key record holds a fingerprint of method, path and body plus the final response. A retry with the same fingerprint gets the stored response; the same key with a different body is rejected (422 in the IETF Idempotency-Key draft), never replayed.',
        'Stripe’s API docs describe this contract: a key’s first result is saved and replayed, even a 500; a reused key must carry the same parameters; keys may be pruned after 24 hours; and requests rejected by validation or a concurrent conflict are not saved.',
        'Claim the key with an insert-if-absent on the payment’s shard. Duplicates on one server await the first attempt, as in the code; a duplicate on another server finds the key in_progress and gets 409 Conflict, telling the client to retry later.',
        'A crash leaves the key in_progress, so the claim carries a lease; once it lapses, the next retry resumes from the payment’s recorded state, asking the PSP if a call may have gone out. Only failures before any side effect release the key.',
      ],
    },
    {
      heading: 'Payment state machine and the unknown outcome',
      points: [
        'States run created → authorized → captured → settled, plus failed (declined or errored), voided (released before capture) and refunded (refunds reach the captured amount). Every transition is a compare-and-set on (status, version), so two workers can never both capture.',
        'Authorization places a hold on the cardholder’s funds and capture collects them; an uncaptured authorization expires after a window set by the card network and PSP. Capture when the goods ship, or void promptly to release the hold.',
        'Commit the payment as created before calling the PSP, so a crash mid-call leaves a row to resolve. A timeout or 5xx means the card may have been charged, so the payment becomes unknown, not failed.',
        'A resolver repeats the request with the same PSP idempotency key or looks the payment up by our reference until the outcome is known, with reconciliation as the backstop. Retrying with a fresh key after a timeout is the classic double charge.',
        'Webhooks arrive late, duplicated and out of order, so treat them as hints: verify the signature, drop repeated event IDs, apply only transitions valid from the current state, and fetch the payment from the PSP when an event looks stale.',
      ],
    },
    {
      heading: 'Double-entry ledger in integer minor units',
      points: [
        'Each money movement is a transaction of at least two single-currency entries (debits positive, credits negative) that sum to zero. A $100 capture with a $2.90 platform fee debits psp_receivable 10,000 and credits merchant_payable 9,710 and fee_revenue 290, all in cents.',
        'Entries are immutable: the table accepts inserts only, and a mistake is fixed by a new transaction that reverses it, keeping the history auditors need. A refund is its own transaction, never an edit of the capture.',
        'Balances are derived by summing an account’s entries, so any balance can be explained and recomputed as of any date. Merchant balances also keep a running total, updated in the same database transaction and checked nightly against the sum.',
        'Amounts are integers in ISO 4217 minor units (JPY has 0 decimals, USD 2, KWD 3): int64 in storage and bigint in code, because binary floating point cannot represent 0.10 exactly. A currency conversion posts one balanced transaction per currency through an FX account.',
        'Transaction ids are deterministic, such as capture:pay_s3_9f2, so a redelivered event cannot post twice. Platform accounts are split per shard (psp_receivable:shard_3), so every transaction stays on one shard and reports sum the parts.',
      ],
    },
    {
      heading: 'PSPs, reconciliation, PCI scope and risk',
      points: [
        'A PSP adapter maps each provider’s requests, statuses and decline codes onto one model. PSP tokens usually work only at the PSP that created them, so failover to a second PSP helps new checkouts, not saved cards, unless a card vault can forward to both.',
        'Daily reconciliation matches each line of a PSP’s settlement file to our payments by PSP reference, amount and currency, then ties the payout total to the bank deposit. Matches mark payments settled; mismatches enter an exception queue and are fixed with new ledger transactions.',
        'PCI DSS covers systems that store, process or transmit cardholder data and those connected to them. PSP-hosted fields send the card number from the browser straight to the PSP, which returns a token, so our servers stay outside that environment and PCI scope shrinks.',
        'Risk checks run before authorization within ≈ 50 ms: velocity limits per card, device, account and IP, rules plus a machine-learned score, then allow, block or step up to 3-D Secure, which can shift fraud chargeback liability to the card issuer.',
        'Events use a transactional outbox: the outbox row commits with the state change, and a relay publishes it at least once, so consumers dedupe by event_id. A dual write to the database and a broker would lose or invent events when either side fails.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Payments datastore',
      choice: 'Relational database with ACID transactions, sharded by merchant_id',
      rationale:
        'A payment’s state, idempotency record, ledger entries and outbox row commit atomically on one shard. A leaderless, eventually consistent store would scale writes further but could not guarantee that a payment and its ledger entries commit together.',
    },
    {
      decision: 'PSP timeout',
      choice: 'Mark the payment unknown and resolve it with the PSP',
      rationale:
        'The caller may wait or poll longer, but nobody is charged twice. Marking it failed invites a retry with a new key and a second charge; marking it succeeded can ship goods that were never paid for.',
    },
    {
      decision: 'Failed attempts',
      choice: 'Cache every outcome except provably side-effect-free failures',
      rationale:
        'An ambiguous failure replays instead of risking a second charge, and the resolver repairs the payment. Releasing the key on every error lets retries double-charge; caching validation errors would force a new key just to fix a typo.',
    },
    {
      decision: 'Recording money',
      choice: 'Append-only double-entry ledger with derived balances',
      rationale:
        'Every balance is explainable and every fix leaves a trail. A mutable balance column is simpler and faster, but one lost update silently creates or destroys money with nothing to audit.',
    },
    {
      decision: 'Publishing events',
      choice: 'Transactional outbox and a relay',
      rationale:
        'Every committed change is eventually published and nothing uncommitted ever is, at the cost of relay lag and duplicates that consumers dedupe. Writing to the database and then to the broker loses events on a crash in between.',
    },
  ],
  failureModes: [
    'PSP timeout or our crash mid-call: the payment stays created or unknown with the attempt recorded; the resolver retries with the same PSP idempotency key or queries the PSP, reconciliation catches the rest, and unknowns older than a few minutes page on-call.',
    'PSP outage or brownout: per-PSP circuit breakers trip on error rate and latency, and new checkouts route to a secondary PSP; payments already in flight wait for the primary, because switching PSPs mid-payment can charge twice.',
    'Duplicate, late or out-of-order webhooks: a unique key on the PSP event ID drops repeats, transitions invalid from the current state are ignored (authorized after captured), and a missing expected webhook triggers a PSP status query.',
    'Reconciliation mismatch: a settled line with no matching payment, or a capture missing from the settlement file past its expected date. Each lands in an exception queue with an owner and is fixed by correcting ledger transactions; a rising rate pages on-call.',
    'Risk service slow or down: fail closed for high-value or high-risk payments and fail open below a small amount cap, logging every bypass, because blocking every checkout usually costs more than a bounded fraud loss.',
  ],
  code: {
    label: 'TypeScript: idempotency keys with shared in-flight execution and a balanced double-entry ledger',
    language: 'TypeScript',
    code: `import { createHash } from 'node:crypto';

export type Params = Readonly<Record<string, string | number | boolean>>;

/** Throw this only when the attempt provably had no side effect, e.g. before any PSP call. */
export class SafeToRetryError extends Error {}

/** Same key, different request: HTTP 422, as the IETF Idempotency-Key header draft suggests. */
export class KeyReusedError extends Error {
  readonly status = 422;
}

/** Key order must not matter, but 1999 and '1999' must differ. */
export function fingerprint(params: Params): string {
  const sorted = Object.keys(params).sort().map((k) => [k, params[k]]);
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}

/**
 * At most one execution per key (scoped per merchant). Production stores the record in the
 * payments database with insert-if-absent; a Map keeps this sample self-contained.
 */
export class IdempotentHandler<R> {
  private readonly records = new Map<string, { fingerprint: string; result: Promise<R> }>();

  run(key: string, params: Params, execute: () => Promise<R>): Promise<R> {
    const fp = fingerprint(params);
    const existing = this.records.get(key);
    if (existing) {
      if (existing.fingerprint === fp) return existing.result; // replay, or join the attempt
      return Promise.reject(new KeyReusedError('idempotency key reused with other parameters'));
    }
    // Deferred so the record exists before execute starts: duplicates join this attempt.
    const result = Promise.resolve().then(execute);
    this.records.set(key, { fingerprint: fp, result });
    result.catch((err: unknown) => {
      // Any other failure stays cached and replays, as Stripe replays 500s: money may have moved.
      if (err instanceof SafeToRetryError) this.records.delete(key);
    });
    return result;
  }
}

/** Integer minor units (ISO 4217 exponent: JPY 0, USD 2, KWD 3). Debit > 0, credit < 0. */
export type Posting = { account: string; amount: bigint; currency: string };
export type Entry = Readonly<Posting & { txId: string }>;

export class Ledger {
  private readonly entries: Entry[] = [];
  private readonly posted = new Map<string, string>(); // txId -> canonical postings

  /** All or nothing: every check runs before the first append. Returns false for a replay. */
  post(txId: string, postings: readonly Posting[]): boolean {
    const currency = postings[0]?.currency ?? '';
    if (postings.length < 2) throw new Error('a transaction needs at least two entries');
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency must be an ISO 4217 code');
    let sum = 0n;
    for (const p of postings) {
      if (typeof p.amount !== 'bigint' || p.amount === 0n) throw new Error('need non-zero bigint');
      if (p.currency !== currency) throw new Error('mixed currencies: post each FX leg on its own');
      sum += p.amount;
    }
    if (sum !== 0n) throw new Error('unbalanced: entries sum to ' + String(sum));
    const lines = postings.map((p) => JSON.stringify([p.account, String(p.amount)])).sort();
    const canonical = JSON.stringify([currency, lines]);
    const previous = this.posted.get(txId);
    if (previous === canonical) return false; // redelivered event: already applied
    if (previous !== undefined) throw new Error('transaction ' + txId + ' has other entries');
    this.posted.set(txId, canonical);
    for (const p of postings) {
      this.entries.push(Object.freeze({ txId, account: p.account, amount: p.amount, currency }));
    }
    return true;
  }

  /** Derived from entries; production caches it as a running total in the same transaction. */
  balance(account: string, currency: string): bigint {
    return this.entries
      .filter((e) => e.account === account && e.currency === currency)
      .reduce((sum, e) => sum + e.amount, 0n);
  }

  /** Corrections never edit history: post the mirror image under a deterministic id. */
  reverse(txId: string): boolean {
    const original = this.entries.filter((e) => e.txId === txId);
    if (original.length === 0) throw new Error('unknown transaction ' + txId);
    return this.post('reversal:' + txId, original.map((e) => ({ ...e, amount: -e.amount })));
  }
}`,
  },
  followUps: [
    {
      question: 'How do you handle chargebacks?',
      answer:
        'A dispute webhook opens a dispute record and posts a ledger transaction moving the disputed amount plus the fee from the merchant’s balance into a disputes account, so it cannot be paid out. The merchant submits evidence before the network’s deadline; a win posts a reversing transaction, a loss leaves the debit in place.',
    },
    {
      question: 'How do merchants get paid out?',
      answer:
        'A daily job computes each merchant’s payable balance from the ledger, counting only settled funds minus refunds, fees and any reserve, and posts a payout transaction. It calls the bank or PSP payout API with a deterministic payout ID such as payout:m_7:2024-06-01 as the idempotency key, so a rerun after a crash cannot pay twice.',
    },
    {
      question: 'How do you survive losing a database primary or a whole region?',
      answer:
        'Replicate shards synchronously across three availability zones, so an acknowledged commit survives a zone loss; payments caught mid-call during failover are resolved like any unknown. Losing no commits in a region loss needs consensus replication across regions, at a cross-region round trip per commit; asynchronous replicas could forget idempotency records and let retries charge twice.',
    },
  ],
};
