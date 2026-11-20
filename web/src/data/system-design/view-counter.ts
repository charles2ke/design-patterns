import type { SystemDesignQuestion } from '../../types/system-design';

export const viewCounter: SystemDesignQuestion = {
  slug: 'view-counter',
  title: 'Design a video view counter (YouTube-style views and likes)',
  difficulty: 'Easy',
  companies: ['Google', 'Meta'],
  prompt:
    'Design the system that counts views and likes on videos and shows the counts under each video. Assume 2 billion views and 100 million likes per day, and a viral video that peaks at 50,000 views per second. Displayed counts may lag by a few seconds, but the view counts used for creator payouts and ad billing must be exact.',
  signals: [
    'Sees that one row updated with count = count + 1 becomes a lock-contention hot spot for viral videos, and fixes it with sharded counters, batching or a log-based pipeline.',
    'Separates approximate display counts from exact, deduplicated counts used for money, and gives each its own consistency and durability guarantees.',
    'Defines what a valid view is (one per viewer per window, bots filtered out) and enforces it with dedup keys.',
    'Makes likes idempotent by storing who liked what and deriving the counter, so retries and repeated taps are safe.',
  ],
  requirements: {
    functional: [
      'Record a view once playback passes a minimum watch time, counting at most one view per viewer (user, or device when logged out) per video per hour.',
      'Like and unlike a video; each user contributes at most one like, and repeating either request changes nothing.',
      'Show view and like counts on the watch page and in search and recommendation lists.',
      'Produce exact, deduplicated daily view counts per video for creator payouts and ad billing.',
    ],
    nonFunctional: [
      'Absorb ~70,000 views/s at peak, including 50,000/s for a single viral video, without dropping events.',
      'Display counts may be a few seconds stale and slightly approximate, but count reads stay fast (p99 under 10 ms).',
      'Billing counts are exact: every valid view is counted exactly once despite retries and crashes, and is reproducible from raw events.',
      'Recording a view never delays playback: the client durably queues an event in IndexedDB and retries its stable event ID until the server confirms the Kafka append.',
    ],
    outOfScope: [
      'Video streaming, recommendations and the creator analytics dashboard.',
      'How the bot-detection models work (assume a service that scores each event).',
    ],
  },
  estimates: [
    'Views: 2B/day ÷ 86,400 s ≈ 23,000/s on average; ~3× peak ≈ 70,000/s.',
    'Hot key: assume one row sustains ~1,000 locked updates/s (≈ 1 ms per commit). A viral video at 50,000 views/s would need ≈ 50 sub-counter rows even before batching.',
    'Batching: 100 aggregator tasks (≈ 700 events/s each at peak) flushing once per second turn the viral video’s 50,000 increments/s into ≤ 100 row writes/s, 500× fewer, each on the task’s own row.',
    'Dedup state: a 1-hour window holds ≈ 2B ÷ 24 ≈ 83M (video, viewer) keys × ~64 B ≈ 5.3 GB, spread across tasks; a 24-hour window would need up to 128 GB.',
    'Likes: 100M/day ÷ 86,400 ≈ 1,160/s; one (user, video) row per like adds 36.5B rows/year × ~50 B ≈ 1.8 TB/year, so the likes table is partitioned.',
    'Event log: 70,000 events/s × ~200 B ≈ 14 MB/s at peak; 2B × 200 B ≈ 400 GB/day, ≈ 2.8 TB for 7 days of replay retention.',
  ],
  api: `POST /api/v1/videos/{videoId}/views      sent once playback passes the minimum watch time
Authorization: Bearer <token>            (optional; logged-out players send X-Device-Id)
{ "eventId": "5f0c9a2e-...", "watchedMs": 31000 }      (eventId is reused on retries)
-> 202 Accepted    { "eventId": "5f0c9a2e-...", "durable": true } (Kafka append acknowledged)

PUT    /api/v1/videos/{videoId}/like     -> 204 No Content    (already liked: still 204)
DELETE /api/v1/videos/{videoId}/like     -> 204 No Content    (not liked: still 204)

GET /api/v1/videos/{videoId}/stats
-> 200 OK   { "views": 1234567, "likes": 89012, "likedByMe": true }
   counts come from a 5 s server-side cache; likedByMe is one lookup in likes`,
  dataModel: `view_events      Kafka topic, key = (video_id, viewer_id), 7-day retention
  event_id    uuid       client-generated, same on retries: the exact-count dedup key
  video_id    string
  viewer_id   string     user ID, or device ID for logged-out viewers
  ts          timestamp
  bot_score   float      attached by the ingest tier

client_outbox   IndexedDB on each player device; durable until server acknowledges event_id
  event_id, video_id, viewer_id, watched_ms, created_at

view_counters    one sub-counter row per (video, aggregator task), summed on read
  video_id    string     partition key
  shard       int16      clustering key: the aggregator task that owns the row
  count       int64
  last_batch  int64      seq of the last batch applied, so a retried flush is a no-op

likes            primary key (user_id, video_id), partitioned by user_id
like_counts      video_id -> count, changed only when a likes row is inserted or deleted
billable_views   (video_id, day) -> exact count, written by the daily exact job

A watch page reads SUM(count) over one video_id partition, cached for ~5 s; the
"liked by me" check is a single-row lookup in likes.`,
  architecture: {
    diagram: ` Player                                  Watch page
   | POST /views -> 202                    | GET /stats, PUT /like
   v                                       v
 +--------------+                +-------------------+     +-----------+
 |  Ingest API  |                |  Video API        |---->|  likes    |
 +------+-------+                |  5 s count cache  |     +-----------+
        |                        +---------+---------+
        v                                  | miss: SUM(rows)
 +----------------------------+            |
 |  Kafka: view_events        |            |
 |  key: (video, viewer)      |            |
 +-----+----------------+-----+            |
       |                |                  |
       v                v                  v
 +-------------+  +--------------+   +-----------------+
 | Exact daily |  | Aggregators: |   |  Counter store  |
 | billing job |  | dedup, batch |-->|  view_counters  |
 +------+------+  +--------------+   |  like_counts    |
        |           flush every 1 s  +-----------------+
        v
 billable_views (exact, per day)`,
    flow: [
      'The player sends POST /views with a client-generated event ID once playback passes the minimum watch time; the Ingest API attaches a bot score, appends the event to Kafka keyed by (video, viewer) and returns 202.',
      'Aggregator tasks consume their partitions, drop events with a high bot score or a repeat (video, viewer) inside the window, and add the rest to per-video counts in memory.',
      'Every second each task flushes one batch to the counter store, adding to its own sub-counter row per video with a conditional update keyed by batch sequence, so a retried flush is a no-op.',
      'The exact daily job reads the same topic, deduplicates by event_id and the viewer window, applies late fraud verdicts and writes billable_views; payouts use only these totals.',
      'The Video API serves GET /stats from a 5 s cache and sums the sub-counter rows on a miss; PUT and DELETE /like change the likes row and adjust like_counts only when a row actually changed.',
    ],
  },
  deepDives: [
    {
      heading: 'Why count = count + 1 does not scale',
      points: [
        'Every increment of one row takes the same row lock until commit, so the row serializes its writers: at ~1 ms per commit it tops out near 1,000 updates/s, while a viral video needs 50,000/s.',
        'Sharded counters split the count into N rows: each write picks one and reads sum all N. The Firestore documentation describes this distributed-counter pattern, a counter document with a subcollection of shards, because one document supports only a limited sustained write rate.',
        'Batching in the writer turns thousands of increments into one +delta per video per flush, but if every server flushes into the same row, that row still serializes them; batching and sharding work best together.',
        'The log-based pipeline combines both: each aggregator task owns one sub-counter row per video and flushes once per second, so no two writers share a row and each row gets at most one write per second.',
        'It also makes events durable before they are counted and replayable after a bug, at the cost of a few seconds of latency.',
      ],
    },
    {
      heading: 'Valid views and deduplication',
      points: [
        'A view counts once per viewer (user ID, or device ID when logged out) per video per hour. The dedup key is (video_id, viewer_id) plus the time it was last counted; a view inside the window is dropped.',
        'Keying Kafka by (video_id, viewer_id) routes every event for a pair to the same aggregator task, so dedup is an in-memory lookup with no shared store, and entries are evicted in time order once their window passes.',
        'Bot filtering happens before counting: rate limits per IP and device at ingest, a bot score per event and a minimum watch time. Fraud found later is corrected in the exact daily job.',
        'Retries are a different problem from repeat views: a client retrying POST /views resends the same event_id, so the exact pipeline drops the duplicate even when it lands in a different window.',
      ],
    },
    {
      heading: 'Exact counts for money, approximate counts for display',
      points: [
        'The display path tolerates small errors: if an aggregator crashes after a flush but before committing its Kafka offsets, the replay counts up to a second of views twice and its dedup state is lost. Nobody notices that on a public counter.',
        'Within a live process, a flush that times out is retried with the same batch sequence number; each row stores the last applied sequence and skips repeats, so a lost acknowledgment never double-counts.',
        'Money needs exactly-once: the exact job deduplicates by event_id over the whole day, waits for late events and fraud verdicts, and writes immutable daily totals that payouts read.',
        'To make the live counter exact too, commit the consumed Kafka offsets in the same database transaction as the counter rows, and checkpoint the dedup state (or rebuild it by replaying the last window) before resuming after a crash.',
        'Reconcile daily: compare the exact totals with the live counters and alert on drift beyond a threshold, which catches lost flushes and dedup bugs.',
      ],
    },
    {
      heading: 'Likes as idempotent membership',
      points: [
        'Store membership, not a counter: PUT inserts the (user_id, video_id) row if absent and DELETE removes it, so repeated taps and client retries end in the same state.',
        'Change like_counts by +1 or -1 only when the insert or delete actually changed a row, in the same transaction or from the table’s change stream, so the count is derived and can be rebuilt by counting rows.',
        'A viral video’s like counter is a hot row too; shard it or aggregate the change stream in one-second batches, exactly like views.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Counting pipeline',
      choice: 'Kafka + stream aggregation into per-task sub-counter rows',
      rationale:
        'Events are durable and replayable, and rows never contend. Writing sharded counters directly from the API tier is simpler, but loses replay and still needs many rows per hot video.',
    },
    {
      decision: 'Display consistency',
      choice: 'Eventually consistent, ~5 s cache',
      rationale:
        'Viewers cannot tell a few seconds of lag. Reading the counter store on every page view would cost as many reads as page views for no visible benefit.',
    },
    {
      decision: 'Billing counts',
      choice: 'Separate exact daily job that deduplicates by event_id',
      rationale:
        'Money needs exactly-once counting and late fraud verdicts. Making the live path exact would need transactional sinks everywhere and still could not wait for fraud detection.',
    },
    {
      decision: 'Likes',
      choice: 'Membership rows + derived counter',
      rationale:
        'Idempotent under retries and repeated taps, and the count can be rebuilt. A bare counter cannot tell a retry from a new like.',
    },
    {
      decision: 'Dedup state',
      choice: 'In memory per aggregator task, partitioned by (video, viewer)',
      rationale:
        'Local lookups at stream speed, ~5 GB in total. A shared Redis set would add a network hop per view and become its own hot spot.',
    },
  ],
  failureModes: [
    'Aggregator crash: offsets are committed only after a flush, so unflushed views are re-read from Kafka; a crash between a flush and its offset commit counts up to one interval twice. Billing is unaffected, and reconciliation can repair the live counter.',
    'Flush timeout after the write landed: the retry resends the same batch with the same sequence number, every row skips it, and nothing is counted twice.',
    'Hot Kafka partition: keying by (video, viewer) spreads a viral video over all partitions; keying by video alone would put 50,000 events/s on one partition and one consumer.',
    'Bot or click-farm traffic: rate-limit per IP and device at ingest, drop events with a high bot score before counting, and subtract late fraud verdicts in the exact job.',
    'Counter store or cache outage: events keep accumulating in Kafka (7-day retention) and are counted on recovery; the watch page shows the last cached count, or hides it, instead of failing.',
  ],
  code: {
    label: 'TypeScript: durable client view retries plus windowed dedup and idempotent counter rows',
    language: 'TypeScript',
    code: `export interface ViewEvent {
  eventId: string; // generated once; reused until the server confirms the durable Kafka append
  videoId: string;
  viewerId: string;
  watchedMs: number;
}

/** IndexedDB implementation: insert-if-absent, list oldest first, and delete only after ACK. */
export interface ClientViewOutbox {
  putIfAbsent(event: ViewEvent): Promise<void>;
  oldest(limit: number): Promise<ViewEvent[]>;
  acknowledge(eventId: string): Promise<void>;
}

export function flushViewOutbox(
  outbox: ClientViewOutbox,
  post: (event: ViewEvent) => Promise<{ eventId: string; durable: boolean }>,
  retryLater: () => void,
): void {
  void outbox.oldest(100).then(async (events) => {
    for (const event of events) {
      try {
        const ack = await post(event);
        if (!ack.durable || ack.eventId !== event.eventId) {
          retryLater();
          return;
        }
        await outbox.acknowledge(event.eventId);
      } catch {
        retryLater();
        return;
      }
    }
  }).catch(retryLater);
}

export function reportView(
  outbox: ClientViewOutbox,
  event: ViewEvent,
  post: (event: ViewEvent) => Promise<{ eventId: string; durable: boolean }>,
  retryLater: () => void,
): void {
  // Persist and deliver in the background so playback does not wait on storage or the network.
  void outbox.putIfAbsent(event)
    .then(() => flushViewOutbox(outbox, post, retryLater))
    .catch(retryLater);
}

export interface CounterStore {
  // Per row, atomically: UPDATE view_counters SET count = count + :delta, last_batch = :seq
  //   WHERE video_id = :video AND shard = :shard AND last_batch < :seq
  apply(shard: number, seq: number, deltas: ReadonlyMap<string, number>): Promise<void>;
}

type Row = { count: number; lastBatch: number };

/** In-memory model of the table: one sub-counter row per (video, shard), summed on read. */
export class ShardedCounterStore implements CounterStore {
  private readonly rows = new Map<string, Map<number, Row>>();

  async apply(shard: number, seq: number, deltas: ReadonlyMap<string, number>): Promise<void> {
    for (const [video, delta] of deltas) {
      const shards = this.rows.get(video) ?? new Map<number, Row>();
      this.rows.set(video, shards);
      const row = shards.get(shard) ?? { count: 0, lastBatch: -1 };
      // A row that already applied this batch skips it: the retry after a timed-out write.
      if (seq > row.lastBatch) shards.set(shard, { count: row.count + delta, lastBatch: seq });
    }
  }

  total(video: string): number {
    let sum = 0;
    for (const row of this.rows.get(video)?.values() ?? []) sum += row.count;
    return sum;
  }
}

/** One aggregator task. Events are keyed by (video, viewer), so a pair always hits one task. */
export class ViewAggregator {
  private pending = new Map<string, number>(); // video -> counted views not yet sent
  private inFlight: { seq: number; deltas: Map<string, number> } | null = null;
  private flushing: Promise<void> | null = null;
  private readonly countedAt = new Map<string, number>(); // (video, viewer) -> time, oldest first
  private readonly store: CounterStore;
  private readonly shard: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private nextSeq: number;

  // After a restart firstSeq must exceed every seq this shard used (e.g. its max last_batch),
  // or the rows would mistake new batches for retries.
  constructor(
    store: CounterStore, shard: number, windowMs: number, now: () => number, firstSeq = 0,
  ) {
    if (!(windowMs > 0)) throw new RangeError('windowMs must be positive');
    this.store = store;
    this.shard = shard;
    this.windowMs = windowMs;
    this.now = now;
    this.nextSeq = firstSeq;
  }

  /** Counts at most one view per (video, viewer) per window [countedAt, countedAt + windowMs). */
  record(videoId: string, viewerId: string): boolean {
    const now = this.now();
    for (const [key, at] of this.countedAt) {
      if (now - at < this.windowMs) break; // insertion order is time order: the rest are live
      this.countedAt.delete(key);
    }
    const key = videoId.length + ':' + videoId + viewerId; // length prefix: 'ab'+'c' != 'a'+'bc'
    const at = this.countedAt.get(key);
    if (at !== undefined && now - at < this.windowMs) return false;
    this.countedAt.delete(key); // re-insert at the back to keep the map in time order
    this.countedAt.set(key, now);
    this.pending.set(videoId, (this.pending.get(videoId) ?? 0) + 1);
    return true;
  }

  /** Sends one batch. Concurrent calls share it, so batches reach the store strictly in order. */
  flush(): Promise<void> {
    this.flushing ??= this.sendBatch().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async sendBatch(): Promise<void> {
    if (this.inFlight === null) {
      if (this.pending.size === 0) return;
      this.inFlight = { seq: this.nextSeq++, deltas: this.pending };
      this.pending = new Map(); // views recorded during the await belong to the next batch
    }
    // If this throws, the same batch with the same seq is retried before a newer one is cut.
    await this.store.apply(this.shard, this.inFlight.seq, this.inFlight.deltas);
    this.inFlight = null;
  }
}`,
  },
  followUps: [
    {
      question: 'How would you report unique viewers per video per day?',
      answer:
        'An exact distinct count needs a set of viewer IDs per video, which is huge for popular videos. Keep a HyperLogLog sketch per video per day instead: the Redis docs describe their implementation as using at most 12 KB with a 0.81% standard error, and sketches from different aggregator tasks merge by taking per-register maxima.',
    },
    {
      question: 'How would you build a trending list (most viewed in the last hour)?',
      answer:
        'Aggregators also emit per-minute view deltas per video; a stream job keeps a sliding one-hour sum per video and a top-K heap per region, refreshed every minute. If there are too many candidates, a Count-Min Sketch plus a heap bounds memory at the cost of small overestimates.',
    },
    {
      question: 'What happens when fraud is detected days later?',
      answer:
        'The exact job recomputes the affected days from the raw events with the fraud verdicts applied, producing corrected billable totals and payout adjustments. The public counter gets a one-off negative delta, so it can visibly drop. This is why raw events are archived to object storage beyond Kafka’s 7-day retention.',
    },
  ],
};
