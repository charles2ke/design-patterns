import type { SystemDesignQuestion } from '../../types/system-design';

export const adClickAggregator: SystemDesignQuestion = {
  slug: 'ad-click-aggregator',
  title: 'Design an ad click aggregator',
  difficulty: 'Hard',
  companies: ['Google', 'Meta'],
  prompt:
    'Design a system that counts clicks on ads. Advertisers watch per-ad click counts on a dashboard that is at most a few minutes behind and can query any time range, from the last hour to the last year. The same counts drive billing, so they must be exact. Assume 10 billion clicks per day, peaks at 3× the average and about 2 million active ads.',
  signals: [
    'Counts by event time with watermarks and has a deliberate answer for late clicks instead of silently dropping or double counting them.',
    'Builds exactly-once results from at-least-once delivery: dedup by click ID, checkpointed state and an idempotent or transactional sink.',
    'Pre-aggregates into an OLAP store with rollups, so a one-year query reads hundreds of rows rather than billions of raw clicks.',
    'Gives billing an independent check (a batch recount from immutable raw events) and has concrete answers for hot ads and click fraud.',
  ],
  requirements: {
    functional: [
      'Capture each ad click, by redirect or by beacon, as an event with a unique click ID, without noticeably delaying the user.',
      'Count valid clicks per ad in 1-minute windows and show them to advertisers within ~2 minutes.',
      'Query clicks per ad, campaign or advertiser over any time range at minute, hour or day granularity.',
      'Produce reconciled daily counts for billing, excluding invalid (bot or fraudulent) clicks.',
    ],
    nonFunctional: [
      'No acknowledged click is lost and none is counted twice, despite retries, replays and crashes.',
      'Freshness: a click reaches the dashboard within ~2 minutes at p99; billing numbers are final the next day.',
      'Click capture is highly available (99.99%) and adds only milliseconds to the redirect.',
      'Dashboard queries return in under a second for any range, and the pipeline absorbs 3× peaks and a single viral ad.',
    ],
    outOfScope: [
      'Ad serving, auctions and targeting (assume the ad server issues a signed impression token).',
      'Invoicing, payments and the advertiser account UI.',
      'Conversion tracking and attribution.',
    ],
  },
  estimates: [
    'Clicks: 10B/day ÷ 86,400 s ≈ 116,000/s on average and ≈ 350,000/s at a 3× peak.',
    'Ingest: 350,000/s × ~500 bytes ≈ 175 MB/s into Kafka at peak; the raw archive grows 10B × 500 bytes = 5 TB/day before compression, ≈ 1.8 PB/year.',
    'Dedup state: 350,000/s × 3,600 s ≈ 1.26B click IDs in a 1-hour window × ~50 bytes in RocksDB ≈ 63 GB, about 2 GB per subtask at parallelism 32.',
    'Sink writes: if ~500,000 ads get a click in a peak minute, that is 500,000 ÷ 60 s ≈ 8,300 upserts/s, 42× fewer writes than clicks.',
    'Rollups: at most 500,000 × 1,440 ≈ 720M minute rows/day; a one-year chart for one ad reads 365 day rows instead of 525,600 minute rows.',
    'Hot ad: a viral ad at 5% of peak is 17,500 clicks/s; with 64 partitions averaging ≈ 5,500/s, its partition carries ≈ 23,000/s, about 4× its peers.',
  ],
  api: `Click capture, redirect (the link on the ad points here):
GET /c/{adId}?imp=<signed impression token>
-> 302 Found, Location: the landing URL stored for adId (never taken from the request)
   A bad or expired token (they live 30 min) still redirects; the click is marked invalid.
-> 404 Not Found (unknown adId)

Click capture, beacon (an app that opens the landing page itself):
POST /v1/clicks
{ "adId": "a_42", "imp": "<signed impression token>", "ts": 1749578520123 }
-> 202 Accepted   (retrying is safe: the server derives the same click ID)

click_id = hash(impression ID in the token): a double click, a retry or a replayed token
maps to one click, so an impression is billed at most once.

Kafka topic clicks, key ad_id (hot ads: ad_id#salt), value:
{ "clickId": "k_3f6c", "adId": "a_42", "campaignId": "c_9", "advertiserId": "adv_7",
  "eventTs": 1749578520123, "receivedTs": 1749578520188, "ipHash": "...", "ua": "..." }

Advertiser query:
GET /v1/ads/{adId}/clicks?from=2025-06-01&to=2025-06-08&granularity=hour
-> 200 { "points": [{ "start": "2025-06-01T00:00:00Z", "clicks": 1840 }, ...],
         "finalThrough": "2025-06-06" }   (days up to this one are reconciled)`,
  dataModel: `clicks (Kafka)      key ad_id (hot ads: ad_id#salt); RF 3, min.insync.replicas 2; 7 days
raw archive         object storage, Parquet by dt/hour, immutable, kept ~13 months;
                    the source of truth for reconciliation and backfills

Flink state         RocksDB, checkpointed to object storage every ~30 s
  dedup             click_id -> expiry (event time + 1 h)
  windows           (ad_id[, salt], window_start) -> clicks
  fraud counters    ip_hash or device_id -> clicks in the last minute

ad_clicks_minute    ClickHouse ReplacingMergeTree(updated_at), or a Pinot upsert table
  order by          (advertiser_id, ad_id, window_start): the dedup key and scan order;
                    a re-sent row replaces the earlier one
  columns           campaign_id, clicks, invalid_clicks, updated_at
  partition         by day; kept 30 days
ad_clicks_late      side-output clicks keyed by click_id; pending until the day is final
ad_clicks_hour      per (ad_id, hour), rebuilt when the hour closes; kept ~13 months
ad_clicks_day       per (ad_id, day), replaced by reconciliation with final = true

Dashboards read the coarsest table that covers each part of the range; billing reads
only ad_clicks_day rows with final = true.`,
  architecture: {
    diagram: `  Browser or mobile app
        | GET /c/{adId} (redirect) or POST /v1/clicks (beacon)
        v
 +---------------+     302 to the landing page
 | Click servers |---------------------------------> advertiser site
 +-------+-------+
         | 1. event with click_id (acks=all)
         v
 +--------------------+  2.  +--------------------------+
 | Kafka "clicks"     |----->| Archiver: raw Parquet in |
 | keyed by ad_id     |      | object storage, by hour  |
 +---------+----------+      +------------+-------------+
           | 3.                           | 5. nightly
           v                              v
 +--------------------+      +--------------------------+
 | Flink: flag fraud, |      | Batch recount (Spark):   |
 | dedup by click_id, |      | same dedup and filters,  |
 | 1-min event-time   |      | compare with stream      |
 | windows, watermark |      +------------+-------------+
 +----+----------+----+                   |
      |          | 4. too late:           |
      |          v    side output         |
      |   +-------------+                 |
      |   | late clicks |                 |
      |   +------+------+                 |
      | upsert   | upsert                 | replace day, mark final
      v          v                        v
 +-------------------------------------------------------+
 | OLAP store: per-ad minute rows, hour and day rollups  |
 +---------------------------+---------------------------+
                             | 6. range queries
                             v
               Advertiser dashboards and billing`,
    flow: [
      'Capture: the click server checks the signed impression token, derives click_id from the impression ID, writes the event to Kafka with acks=all and returns a 302 to the landing URL stored for the ad. App beacons take the same path without the redirect.',
      'Kafka keeps the clicks topic, keyed by ad_id, for 7 days. An archiver copies every event, late or not, to object storage as hourly Parquet files, the immutable source of truth.',
      'Flink flags invalid clicks, dedups by click_id and counts each ad’s valid and invalid clicks in 1-minute event-time windows. When the watermark passes a window’s end, it upserts (ad_id, window_start) → counts into the OLAP store; checkpoints run every ~30 s.',
      'Clicks later than the allowed lateness go to a side output and are upserted by click_id into ad_clicks_late, shown as pending. They stay out of live counts, because a late copy of a counted click looks new; the nightly recount counts the real ones.',
      'Nightly, after a grace period for stragglers, a Spark job recounts the previous day from the archive with the same dedup and filter code plus batch fraud verdicts, compares with the streaming totals and replaces the day’s rows, marking them final.',
      'Dashboards and billing query the OLAP store, reading the coarsest rollup that covers each part of the range; billing reads only final days.',
    ],
  },
  deepDives: [
    {
      heading: 'Event time, watermarks and late clicks',
      points: [
        'Windows use event time (when the click happened), not processing time, so a consumer backlog or a replay after a crash puts each click in the same minute every time. Windows are half-open: a click at exactly 12:01:00.000 belongs to the 12:01 window.',
        'The watermark, max event time seen minus a bound (say 10 s), says older clicks are no longer expected; a window emits when the watermark passes its end. Flink uses the minimum across Kafka partitions, so an idle partition stalls everything unless withIdleness excludes it.',
        'Flink has three tiers: clicks within the watermark bound are on time; clicks within allowedLateness (say 10 minutes) update the retained window state and re-fire the full count, which the upsert overwrites; anything later goes to sideOutputLateData.',
        'For redirects, event time is the click server’s receive time. Beacon timestamps are clamped to the receive time, because one far-future timestamp would jump the watermark ahead and send every later click to the late path.',
      ],
    },
    {
      heading: 'Deduplication and exactly-once results',
      points: [
        'Delivery is at-least-once end to end: browsers retry, click servers retry Kafka writes and Flink replays after failures. Kafka’s idempotent producer removes duplicates from its own retries, but only dedup by click_id catches duplicates created before Kafka.',
        'Dedup entries live 1 hour of event time, longer than the 30-minute token lifetime plus a window and its allowed lateness, so a repeat is either dropped or sent to the side output. Flink’s state TTL uses processing time, so expire entries with event-time timers.',
        'Checkpoints (the asynchronous barrier snapshots of Carbone et al., 2015) capture Kafka offsets, dedup state and open windows together. After a crash, the job restores them and re-reads from those offsets, so each click changes state exactly once.',
        'A replay re-emits windows that fired after the checkpoint, so the sink must absorb repeats; an upsert keyed by (ad_id, window_start) does. Flink’s transactional Kafka sink (two-phase commit per checkpoint, read_committed consumers) also works but delays results by up to a checkpoint interval.',
      ],
    },
    {
      heading: 'Click fraud and hot ads',
      points: [
        'Cheap checks run inline: an unexpired impression signature for the same ad, known bot user agents (IAB/ABC International Spiders and Bots List), data-center IP ranges, and per-IP and per-device click rates from keyed counters. Invalid clicks are counted separately with a reason, never silently dropped.',
        'Heavier detection (models over full-day behavior and cross-advertiser patterns) runs in the batch path; its verdicts feed reconciliation, so invoices exclude clicks found invalid after the dashboard showed them.',
        'Keying by ad_id puts a viral ad in one partition and one subtask: at 5% of peak it runs ~4× hotter than its peers, and if it falls behind, the minimum watermark holds back every ad’s windows, not just its own.',
        'For ads on a hot list, the click server keys by ad_id#salt, salt = hash(click_id) mod 16; Flink counts per (ad_id, salt) and a second stage sums the 16 partials per window. Salting only hot ads keeps the extra stage off the long tail.',
      ],
    },
    {
      heading: 'Serving queries, rollups and reconciliation',
      points: [
        'The OLAP store keeps one row per (ad_id, minute), sorted by (advertiser_id, ad_id, time), so a dashboard query is a narrow range scan. ClickHouse ReplacingMergeTree or a Pinot upsert table keeps the latest row per key; ClickHouse queries use FINAL until merges catch up.',
        'Scheduled jobs rebuild hour and day rollups once a period closes, overwriting the whole period; a materialized view summing every inserted row would double count re-sent minute rows. Queries read day rows for whole days, then hour rows, then minute rows for the ragged ends.',
        'Each night a Spark job recounts the previous day from the raw archive with the same dedup and filter library plus the batch fraud verdicts, compares per (ad, hour) with the streaming totals and alerts when they differ by more than a small threshold.',
        'The recount atomically swaps in the day (ClickHouse REPLACE PARTITION from a staging table; Druid would overwrite the day’s time chunk) and marks it final. Invoices use only final days, and the dashboard labels newer numbers preliminary.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Freshness versus billing-grade correctness',
      choice: 'Streaming counts for dashboards, a nightly batch recount for billing',
      rationale:
        'Batch alone leaves dashboards hours behind, and streaming alone gives billing no independent check against bugs in dedup, lateness or fraud rules. The cost is two code paths, reduced by sharing one dedup and filter library.',
    },
    {
      decision: 'Which clock defines the minute',
      choice: 'Event time with watermarks',
      rationale:
        'Processing time is simpler and never late, but a backlog or a replay moves clicks into later minutes and makes results irreproducible, which billing cannot accept. Event time costs a watermark delay and explicit late-click handling.',
    },
    {
      decision: 'Exactly-once output',
      choice: 'Idempotent upserts keyed by (ad_id, window_start)',
      rationale:
        'Incrementing counters in the sink (clicks += n) double counts every replayed window. A transactional two-phase-commit sink is also correct but hides results until each checkpoint commits, adding up to a checkpoint interval of delay.',
    },
    {
      decision: 'Dedup state',
      choice: 'Exact keyed state in RocksDB with 1-hour retention',
      rationale:
        'A Bloom filter is smaller, but its false positives silently drop real clicks (under-billing) and a plain one cannot expire entries. About 63 GB spread over the job’s local SSDs is cheap.',
    },
    {
      decision: 'Aggregate store',
      choice: 'Columnar OLAP store (ClickHouse, Pinot or Druid)',
      rationale:
        'A key-value store such as Cassandra serves fixed per-ad series but cannot group by campaign or country without precomputing every combination. Columnar scans over rollups answer arbitrary ranges and group-bys in well under a second.',
    },
  ],
  failureModes: [
    'Flink task or job failure: the job restarts from the last checkpoint (~30 s old), rewinds Kafka offsets and replays; upserts overwrite the re-emitted windows, so dashboards lag for a few minutes but nothing is lost or doubled. Alert when checkpoints fail or grow old.',
    'Kafka unavailable: click servers never block the redirect; they append events to a local disk spool and drain it with retries, and the deterministic click_id makes redelivery safe. Topics use replication factor 3, min.insync.replicas=2 and acks=all.',
    'Watermark stall: an idle partition or a lagging hot partition holds the minimum watermark back, so no window closes. Detect it with a watermark-lag metric (wall clock minus watermark); fix it with withIdleness, salting the hot ad and adding capacity.',
    'Bad device clocks: a far-future timestamp would push the watermark ahead and send real clicks to the late path. Clamping to the receive time prevents it, and an alert on the late-output rate catches clock or pipeline problems.',
    'Stream and batch disagree (for example a dedup bug or an archive gap): reconciliation flags the affected ads and hours, billing uses the batch numbers, and the stream job is fixed and the period backfilled from the raw archive.',
  ],
  code: {
    label: 'TypeScript: event-time tumbling windows with click-ID dedup, a watermark and a late-click side output',
    language: 'TypeScript',
    code: `// One lateness knob for brevity: Flink splits it into the watermark's out-of-orderness bound
// and allowedLateness (which re-fires updated counts); this sketch finalizes each window once.
export interface Click { clickId: string; adId: string; ts: number } // ts: event time, epoch ms
export interface WindowCount { adId: string; start: number; end: number; clicks: number }
export interface Output {
  final(w: WindowCount): void; // once per (ad, window); the sink upserts on that key
  late(c: Click): void; // its window is already final: send it to the correction path
}

export class ClickAggregator {
  private readonly windowMs: number;
  private readonly latenessMs: number;
  private readonly dedupMs: number;
  private readonly out: Output;
  private readonly open = new Map<number, Map<string, number>>(); // window start -> ad -> clicks
  private readonly seen = new Map<string, number>(); // clickId -> forget once watermark >= this
  private maxTs = -Infinity;

  constructor(windowMs: number, latenessMs: number, dedupMs: number, out: Output) {
    const finite = Number.isFinite(windowMs) && Number.isFinite(latenessMs);
    // Dedup state must outlive the window it guards, or a retried click could count twice.
    if (!(finite && windowMs > 0 && latenessMs >= 0 && dedupMs >= windowMs)) {
      throw new RangeError('need finite windowMs > 0, latenessMs >= 0 and dedupMs >= windowMs');
    }
    [this.windowMs, this.latenessMs, this.dedupMs, this.out] = [windowMs, latenessMs, dedupMs, out];
  }

  /** Clicks at or before the watermark are no longer expected; windows ending by it are final. */
  get watermark(): number {
    return this.maxTs - this.latenessMs;
  }

  add(c: Click): void {
    if (!Number.isFinite(c.ts)) throw new RangeError('event time must be finite');
    if (this.seen.has(c.clickId)) return; // a retry or replay, even if its window already closed
    this.seen.set(c.clickId, c.ts + this.dedupMs);
    const start = Math.floor(c.ts / this.windowMs) * this.windowMs; // half-open [start, end)
    if (start + this.windowMs <= this.watermark) {
      this.out.late(c);
    } else {
      const counts = this.open.get(start) ?? new Map<string, number>();
      this.open.set(start, counts.set(c.adId, (counts.get(c.adId) ?? 0) + 1));
    }
    if (c.ts > this.maxTs) {
      this.maxTs = c.ts;
      this.fire();
    }
  }

  /** End of a bounded input (e.g. a backfill), like the MAX watermark Flink sends at the end. */
  flush(): void {
    this.maxTs = Infinity;
    this.fire();
  }

  private fire(): void {
    const wm = this.watermark;
    const ready = [...this.open.keys()].filter((s) => s + this.windowMs <= wm);
    if (ready.length === 0) return; // amortize the dedup purge: run it only when windows close
    for (const start of ready.sort((a, b) => a - b)) {
      const counts = this.open.get(start) ?? new Map<string, number>();
      this.open.delete(start);
      for (const adId of [...counts.keys()].sort()) {
        const clicks = counts.get(adId) ?? 0;
        this.out.final({ adId, start, end: start + this.windowMs, clicks });
      }
    }
    for (const [id, until] of this.seen) if (until <= wm) this.seen.delete(id);
  }
}

/** Idempotent sink: a replay after a crash rewrites the same rows instead of adding to them. */
export class UpsertSink implements Output {
  readonly rows = new Map<string, number>(); // production: a keyed upsert table
  readonly corrections = new Map<string, Click>(); // keyed by click ID, so replays dedupe too

  final(w: WindowCount): void {
    this.rows.set(w.adId + '@' + w.start, w.clicks);
  }

  late(c: Click): void {
    this.corrections.set(c.clickId, c);
  }
}`,
  },
  followUps: [
    {
      question: 'How would you find the top 10 most-clicked ads per minute?',
      answer:
        'When a window closes, each subtask keeps a size-10 min-heap over the ads it owns, and one task merges the 10 candidates from each subtask. That is exact because each ad’s full count lives on one subtask (salted ads are summed first). For huge key spaces, a count-min sketch plus a heap uses fixed memory but can overcount, fine for a trending widget, not billing.',
    },
    {
      question: 'A fraud rule had a bug for three days. How do you fix the numbers?',
      answer:
        'Fix the rule, recompute those days from the raw archive (with the batch job, or the Flink job in batch mode) into staging tables, compare, and swap them in atomically. Invoices already sent get credits or adjustments. Because raw events are immutable and kept ~13 months, any day in that range can be rebuilt.',
    },
    {
      question: 'How would you add breakdowns by country and device?',
      answer:
        'Add them as dimensions of the minute rows; the row count grows with the (ad, country, device) combinations that actually receive clicks, not the full cross product. Pinot’s star-tree index or ClickHouse projections precompute common group-bys, and high-cardinality fields such as IP stay only in the raw archive.',
    },
  ],
};
