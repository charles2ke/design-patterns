import type { SystemDesignQuestion } from '../../types/system-design';

export const newsFeed: SystemDesignQuestion = {
  slug: 'news-feed',
  title: 'Design a social news feed',
  difficulty: 'Medium',
  companies: ['Microsoft', 'Meta', 'LinkedIn'],
  prompt:
    'Design the home feed of a social network such as Facebook, LinkedIn or X. Users publish posts with text and media, follow other accounts, and scroll a feed of recent posts from the accounts they follow. Assume 300 million daily active users who open the feed about 10 times a day, 50 million new posts per day, an average of 200 followers per account, and a few accounts with tens of millions of followers.',
  signals: [
    'Sees that the feed is read-heavy and that the central decision is when to do the work: fan-out on write, fan-out on read, or a hybrid keyed on follower count.',
    'Sizes the fan-out from stated assumptions and spots the celebrity problem: one post from an account with 50M followers would otherwise mean 50M cache writes.',
    'Keeps feed caches small (post IDs only), hydrates from a post cache, and paginates with a stable cursor instead of offsets.',
    'Separates candidate retrieval from ranking, and handles edits, deletes and privacy at read time.',
  ],
  requirements: {
    functional: [
      'Publish posts with text and optional images or video, and edit or delete them later.',
      'Follow and unfollow accounts, including accounts with tens of millions of followers.',
      'Read a home feed of posts from followed accounts, newest first or ranked, with infinite scroll through cursor pagination.',
    ],
    nonFunctional: [
      'Fast reads: p99 under ~200 ms for the first page, because the feed is the app’s landing screen.',
      'Eventual consistency is fine for new posts (a few seconds to reach followers), but a deleted post must disappear on the next read.',
      'High availability (99.95%+): a slightly stale feed is better than an error page.',
      'Absorb bursts during major events, when posting spikes and everyone refreshes at once, without the fan-out falling far behind.',
    ],
    outOfScope: [
      'Comments, direct messages and notifications.',
      'The ads auction and the internals of the ranking models (only the shape of the ranking pipeline is in scope).',
      'Search, trending topics and moderation tooling.',
    ],
  },
  estimates: [
    'Reads: 300M DAU × 10 feed opens = 3B/day ÷ 86,400 s ≈ 34,700/s on average; at ~3× peak ≈ 104,000/s, so the read path must be served from caches.',
    'Posts: 50M/day ÷ 86,400 s ≈ 580/s (≈ 1,700/s at peak). Storing a post is cheap; delivering it to followers is the expensive part.',
    'Fan-out on write: 50M posts × 200 followers = 10B feed inserts/day ≈ 116,000/s; skipping followers inactive for weeks (assume half) gives ≈ 58,000/s, or ≈ 174,000/s at peak.',
    'Celebrities: one post from an account with 50M followers is 50M inserts, ≈ 250 s of a fan-out tier sized for 200,000 inserts/s, so accounts above ~1M followers are pulled at read time instead.',
    'Hydration: ~20 posts per page × 34,700 pages/s ≈ 694,000 post lookups/s (≈ 2.1M/s at peak), served by a replicated post cache with batched multi-gets.',
    'Feed cache: 300M users × 500 IDs × ~16 bytes (8-byte ID + 8-byte score) ≈ 2.4 TB of raw entries; sorted-set overhead multiplies that several times, which is why lists are capped and inactive users get none.',
  ],
  api: `POST   /v1/posts            Idempotency-Key: <uuid>
       { text, mediaIds: ["m_81"], audience: "followers" }
-> 201 Created { postId, createdAt }    (a retry with the same key returns the same post)
-> 400 Bad Request (empty, too long, or unknown mediaId)
PATCH  /v1/posts/{id}       { text }  -> 200 OK  |  403 Forbidden (not the author)  |  404
DELETE /v1/posts/{id}       -> 204 No Content (tombstoned; hidden on the next read)
POST   /v1/media            { contentType, bytes }
-> 201 Created { mediaId, uploadUrl }   (pre-signed URL: the bytes go to object storage)

PUT    /v1/me/following/{userId}   -> 204 (idempotent)
DELETE /v1/me/following/{userId}   -> 204

GET /v1/feed?limit=20&cursor=WzE3MDAwMDAwMDAwMDAsInA5MSJd
-> 200 { posts: [{ id, author, text, mediaUrls, likeCount, createdAt }], nextCursor }
       nextCursor is opaque and null at the end of the feed
-> 400 Bad Request (malformed cursor or limit outside 1-100)`,
  dataModel: `posts        PRIMARY KEY (post_id)         sharded by post_id (Cassandra or sharded MySQL)
  post_id    bigint      time-ordered (Snowflake-style), also the feed tie-breaker
  author_id  bigint      secondary index (author_id, created_at DESC) for author timelines
  text       text
  media_keys list<text>  object-storage keys; the CDN serves the bytes
  created_at timestamp   set once; edits do not change it
  deleted_at timestamp   tombstone, null while the post is live
  version    int         bumped on every edit so caches keep the newest copy

follows      PRIMARY KEY ((follower_id), followee_id)    whom I follow
followers    PRIMARY KEY ((followee_id), follower_id)    whom to fan out to, read in pages
users        user_id, follower_count, is_celebrity (sticky), last_active_at

Redis feed:{user_id}       sorted set post_id -> created_at, capped at 500 entries
Redis timeline:{author_id} sorted set of the author's recent posts (pulled if celebrity)
Redis post:{post_id}       hydrated post, rewritten on edit and deleted on delete

Feed read = range on feed:{user} after the cursor + each followed celebrity timeline,
then one multi-get of post:{id}. Fan-out = ZADD + ZREMRANGEBYRANK per follower.`,
  architecture: {
    diagram: `  Author                                  Reader
    | POST /v1/posts                        | GET /v1/feed?cursor
    v                                       v
  +--------------+    +----------+        +--------------+
  | Post service |--->| Posts DB |        | Feed service |--> Post cache
  +--------------+    +----------+        +--------------+    (hydrate)
    |                                       |     |
    | post event (Kafka)                    |     +--> Celebrity
    v                                       |          timelines (pull)
  +--------------+    +--------------+      |
  | Fan-out      |<---| Follow graph |      | IDs after cursor
  | workers      |    +--------------+      |
  +--------------+                          |
    | push post IDs (non-celebrities)       |
    v                                       v
  +---------------------------------------------------+
  |  Feed cache: feed:{user} -> newest 500 post IDs   |
  +---------------------------------------------------+`,
    flow: [
      'The author’s client uploads media to object storage through a pre-signed URL, then creates the post; the post service stores it in the posts database, writes it to the post cache and the author’s timeline, and emits a post event to Kafka.',
      'Fan-out workers consume the event. For authors under the celebrity threshold, they page through the author’s followers in the follow graph and push the post ID into each active follower’s capped feed list.',
      'Posts by celebrity accounts are not pushed; they stay in the author’s timeline, which readers pull at read time.',
      'To serve a page, the feed service reads the IDs after the cursor from the reader’s feed list, merges in the timelines of followed celebrities, and drops duplicate IDs.',
      'It hydrates the IDs from the post cache in one batch, skips deleted or no-longer-visible posts, optionally ranks the candidates, and returns the page with an opaque cursor; media loads from the CDN.',
    ],
  },
  deepDives: [
    {
      heading: 'Fan-out on write, fan-out on read, or both',
      points: [
        'Fan-out on write (push) does the work once per post: writes are amplified by the follower count, but a feed read becomes one cache lookup. At 200 average followers that is ≈ 116,000 inserts/s, which a sharded Redis tier absorbs.',
        'Fan-out on read (pull) precomputes nothing: each feed open fetches recent posts from every followed account and merges them. Writes are cheap, but the hottest path gets slow for users who follow thousands of accounts.',
        'The hybrid pushes for normal authors and pulls for accounts above a follower threshold (say 1M). A reader’s feed is their pushed list merged with the timelines of the few celebrities they follow.',
        'The celebrity flag is sticky, so an account hovering near the threshold does not flip between modes. Posts pushed before a promotion stay in feeds, so the merge removes duplicates by post ID.',
        'Do not precompute feeds for followers inactive for, say, 30 days. When they return, the first request rebuilds their feed by pulling (slower once), and pushes resume.',
      ],
    },
    {
      heading: 'Feed cache, pagination and hydration',
      points: [
        'Each feed is a Redis sorted set of post IDs scored by creation time and capped at ~500 entries (ZADD, then ZREMRANGEBYRANK). Storing IDs instead of posts keeps entries at ~16 bytes, and edits never touch feeds.',
        'Pages use a cursor that encodes the last (created_at, post_id) returned, with the ID breaking ties between equal timestamps. Offsets would repeat or skip posts as new ones arrive at the top; the cursor resumes exactly after the last item.',
        'Hydration fetches a page of posts from the post cache in one multi-get and applies read-time filters: deleted posts (tombstones), edits (the cache holds the latest version), blocked authors and audience changes.',
        'Because filters can drop items, the server keeps reading candidates until the page is full, so clients never receive short pages in the middle of the feed.',
        'Media never passes through the feed path: clients upload to object storage with pre-signed URLs, and posts carry keys that the CDN serves in several resolutions.',
      ],
    },
    {
      heading: 'Ranking pipeline',
      points: [
        'Candidate generation: the merged pushed and pulled IDs (a few hundred), optionally plus recommended posts from accounts the user does not follow.',
        'Feature lookup: for each candidate, fetch features such as author affinity, post age, engagement so far and media type from a feature store, in batches that fit the latency budget.',
        'Scoring: a model predicts engagement probabilities (like, comment, share, long dwell) and combines them into one score; a cheaper first-pass model can prune candidates before the expensive one.',
        'Re-ranking applies rules on top of the scores: author diversity (no five posts in a row from one account), integrity demotions, freshness and ad slots.',
        'A ranked feed paginates over a per-session snapshot of the ranked list (kept ~30 minutes), because re-ranking between pages would repeat or skip posts.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Feed generation',
      choice: 'Hybrid: push for most authors, pull for accounts above ~1M followers',
      rationale:
        'Pure push turns one celebrity post into tens of millions of writes and delays everyone else’s posts behind it; pure pull makes every feed open merge hundreds of timelines. The hybrid bounds both costs.',
    },
    {
      decision: 'Feed cache contents',
      choice: 'Post IDs only, hydrated from a post cache',
      rationale:
        'Copying full posts into every follower’s feed multiplies storage by the fan-out and turns every edit into another fan-out. IDs cost one extra batched lookup per page.',
    },
    {
      decision: 'Pagination',
      choice: 'Opaque cursor on (created_at, post_id)',
      rationale:
        'Offset pagination repeats or skips posts when new ones arrive at the top. A cursor resumes after the exact last item, and keeping it opaque lets the server change the encoding later, for example to a ranked-session ID.',
    },
    {
      decision: 'Fan-out execution',
      choice: 'Asynchronous workers consuming Kafka, with idempotent inserts',
      rationale:
        'Posting returns as soon as the post is stored, and a backlog only delays feeds. Synchronous fan-out would tie post latency to follower count, and idempotent ZADDs make redelivered events harmless.',
    },
    {
      decision: 'Deletes and edits',
      choice: 'Tombstone the post and filter at hydration',
      rationale:
        'Removing an ID from millions of feeds is another fan-out that races with in-flight pushes. A tombstone checked at read time takes effect everywhere on the next read.',
    },
  ],
  failureModes: [
    'Fan-out backlog during a major event: consumer lag on the post topic grows. Alert on lag, autoscale workers, push to recently active followers first, and temporarily lower the celebrity threshold so more authors are pulled.',
    'Feed cache shard lost: feeds on it vanish. Replicas take over; if both copies are gone, the next read rebuilds the feed by pulling from followed accounts, with request coalescing so retries trigger only one rebuild.',
    'Hot keys: a viral post or a celebrity’s timeline is read millions of times a minute and overloads one cache shard. Detect hot keys and serve them from extra replicas or a short-TTL in-process cache on feed servers.',
    'Duplicate or out-of-order events: Kafka redelivers after a worker crash, or a delete overtakes the post event. Inserts are idempotent (same ID, same score), tombstones win over late publishes, and the merge removes duplicate IDs.',
    'Deleted post still in feeds: millions of feed lists still hold its ID. Hydration checks the tombstone on every read and the post cache entry is removed on delete, so the post disappears on the next page load.',
  ],
  code: {
    label: 'TypeScript: hybrid push/pull feed with capped lists, k-way merge and cursor pagination',
    language: 'TypeScript',
    code: `export interface Post {
  id: string;
  authorId: string;
  createdAt: number; // set once by the post service; edits keep it
  text: string;
}

type Entry = Pick<Post, 'id' | 'createdAt'>; // feed caches hold IDs, not post bodies
const FEED_CAP = 500; // newest entries kept per list: bounds memory, few readers scroll further
// Feed order: newest first, ties broken by ID so every post has exactly one position.
const precedes = (a: Entry, b: Entry): boolean =>
  a.createdAt !== b.createdAt ? a.createdAt > b.createdAt : a.id > b.id;

function firstAfter(list: readonly Entry[], pos: Entry): number {
  const i = list.findIndex((e) => precedes(pos, e));
  return i < 0 ? list.length : i;
}

function insertCapped(lists: Map<string, Entry[]>, key: string, entry: Entry): void {
  const list = lists.get(key) ?? [];
  const i = firstAfter(list, entry);
  if (list[i - 1]?.id !== entry.id) list.splice(i, 0, entry); // redelivered events are no-ops
  lists.set(key, list.slice(0, FEED_CAP));
}

const encodeCursor = (e: Entry): string =>
  Buffer.from(JSON.stringify([e.createdAt, e.id])).toString('base64url');
function decodeCursor(cursor: string): Entry {
  try {
    const [createdAt, id]: unknown[] = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    if (typeof createdAt === 'number' && typeof id === 'string') return { createdAt, id };
  } catch { /* malformed base64 or JSON falls through to the same error */ }
  throw new RangeError('Invalid cursor');
}

export class HybridFeed {
  celebrityThreshold = 1_000_000; // followers at which an author switches from push to pull
  private readonly posts = new Map<string, Post>(); // post cache used for hydration
  private readonly deleted = new Set<string>();
  private readonly feeds = new Map<string, Entry[]>(); // pushed entries per reader
  private readonly timelines = new Map<string, Entry[]>(); // each author's recent posts
  private readonly followers = new Map<string, Set<string>>();
  private readonly following = new Map<string, Set<string>>();
  private readonly celebrities = new Set<string>(); // sticky, so authors never flap

  follow(userId: string, authorId: string): void {
    const fans = this.followers.get(authorId) ?? new Set<string>();
    this.followers.set(authorId, fans.add(userId));
    this.following.set(userId, (this.following.get(userId) ?? new Set<string>()).add(authorId));
    if (fans.size >= this.celebrityThreshold) this.celebrities.add(authorId);
    if (this.celebrities.has(authorId)) return; // pulled at read time instead
    for (const e of this.timelines.get(authorId) ?? []) insertCapped(this.feeds, userId, e);
  }

  publish(post: Post): void {
    this.posts.set(post.id, post); // an edit republishes the same ID and createdAt
    const entry: Entry = { id: post.id, createdAt: post.createdAt };
    insertCapped(this.timelines, post.authorId, entry);
    if (this.celebrities.has(post.authorId)) return; // too many followers to push to
    for (const fan of this.followers.get(post.authorId) ?? []) insertCapped(this.feeds, fan, entry);
  }

  remove(postId: string): void {
    this.deleted.add(postId); // a tombstone: cached IDs stay, hydration drops the post
  }

  read(userId: string, limit = 20, cursor?: string): { posts: Post[]; nextCursor: string | null } {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError('limit 1-100');
    const after = cursor === undefined ? null : decodeCursor(cursor);
    const celebs = [...(this.following.get(userId) ?? [])].filter((a) => this.celebrities.has(a));
    const lists = [this.feeds.get(userId) ?? [], ...celebs.map((a) => this.timelines.get(a) ?? [])];
    const heads = lists.map((list) => ({ list, i: after ? firstAfter(list, after) : 0 }));
    const posts: Post[] = [];
    let last: Entry | undefined;
    while (posts.length < limit) {
      let best: (typeof heads)[number] | undefined; // k-way merge: the head that comes first
      for (const h of heads) {
        const e = h.list[h.i];
        if (e && (best === undefined || precedes(e, best.list[best.i]!))) best = h;
      }
      if (best === undefined) return { posts, nextCursor: null };
      const e = best.list[best.i++]!;
      if (e.id === last?.id) continue; // the same post reached through two lists
      last = e;
      const post = this.posts.get(e.id);
      if (post && !this.deleted.has(e.id)) posts.push(post);
    }
    return { posts, nextCursor: heads.some((h) => h.list[h.i]) ? encodeCursor(last!) : null };
  }
}`,
  },
  followUps: [
    {
      question: 'What happens when a user follows or unfollows someone?',
      answer:
        'On follow, backfill the author’s newest few posts from their timeline into the follower’s feed list (celebrities are pulled anyway, so they need no backfill). On unfollow, do not scrub the feed: hydration filters out authors the reader no longer follows, and old entries age out of the capped list. Blocks work the same way.',
    },
    {
      question: 'How do you keep like counts fresh without rewriting posts?',
      answer:
        'Counts live outside feeds and post bodies, in a counter service that hydration reads in the same batch. Likes go to sharded counters that are aggregated every few seconds, so displayed counts are approximate, and the client updates the viewer’s own like optimistically.',
    },
    {
      question: 'How would you add recommended posts from accounts the user does not follow?',
      answer:
        'Add another candidate source: a retrieval service (for example, embeddings plus approximate nearest-neighbor search over recent popular posts) contributes a few hundred candidates to the same ranking pipeline. Re-ranking caps their share so the feed still feels like the user’s own network.',
    },
  ],
};
