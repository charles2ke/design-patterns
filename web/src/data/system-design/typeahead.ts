import type { SystemDesignQuestion } from '../../types/system-design';

export const typeahead: SystemDesignQuestion = {
  slug: 'typeahead',
  title: 'Design search autocomplete (typeahead)',
  difficulty: 'Medium',
  companies: ['Google', 'Amazon', 'Meta'],
  prompt:
    'Design the autocomplete for a web search box: as the user types, show up to 10 suggested queries for the current prefix, ranked mainly by popularity, with breaking trends appearing within minutes. Assume 5 billion searches per day from users worldwide in many languages, and each suggestion request should complete end to end within about 100 ms.',
  signals: [
    'Starts from the latency budget and concludes that suggestions must come from memory, with the answers precomputed.',
    'Precomputes top-K completions per prefix offline so each lookup is O(prefix length), and explains why the index is rebuilt as immutable snapshots.',
    'Separates the slow popularity signal from a near-real-time trending layer and merges the two at serve time.',
    'Covers the client (debounce, cancellation, caching) and the filtering that keeps offensive or private queries out of suggestions.',
  ],
  requirements: {
    functional: [
      'Return up to 10 completions for the typed prefix, ranked by decayed popularity, treating case and Unicode variants as the same query.',
      'Reflect trending queries within minutes rather than at the next daily rebuild.',
      'Never suggest offensive, unsafe or personally identifying queries, and remove a bad suggestion within minutes when one slips through.',
      'Boost the signed-in user’s own recent searches that match the prefix.',
    ],
    nonFunctional: [
      'Each suggestion request completes within ~100 ms end to end, from the browser sending it to suggestions on screen, leaving the servers about 10 ms.',
      'Highly available but allowed to degrade: stale or empty suggestions beat a slow search box.',
      'Serves ≈ 463K requests/s at peak and survives the loss of a region.',
      'Eventually consistent: popularity can lag by a day and trends by a few minutes.',
    ],
    outOfScope: [
      'Ranking the search results page; this design only completes queries.',
      'Spelling correction beyond normalization (see the follow-ups).',
      'The offensive-content classifier itself; assume a moderation service.',
    ],
  },
  estimates: [
    'Searches: 5B/day ÷ 86,400 s ≈ 58K searches/s.',
    'Requests: assume ~4 suggestion requests per search after debouncing: 20B/day ≈ 231K/s on average, ≈ 463K/s at a 2× peak.',
    'Servers: assuming ~20K lookups/s per server, 463K ÷ 20K ≈ 23.1, so at least 24; run 12 per region in 3 regions, so losing a region still leaves 24 × 20K = 480K/s.',
    'Index: assume 100M suggestible queries of ~25 bytes. A radix trie has at most 2 nodes per query: ≤ 200M nodes × ~80 bytes ≈ 16 GB, plus 2.5 GB of text ≈ 18.5 GB, which fits in RAM, so replicate rather than shard.',
    'Latency: of the ~100 ms budget, assume ~40–60 ms for the round trip from a typical (often mobile) user plus time to render, so budget ~10 ms at p99 for the servers, which rules out database calls on the hot path.',
    'Logs: 5B searches × ~100 bytes per record ≈ 500 GB/day of query logs for the offline pipeline.',
  ],
  api: `GET /v1/suggest?q=new%20yo&locale=en-US          (sent after a ~50-100 ms debounce)
-> 200 OK   Cache-Control: public, max-age=60    (global results: CDN-cacheable)
   { "prefix": "new yo", "snapshot": "en-US.v812",
     "suggestions": [ { "text": "new york weather", "source": "global" },
                      { "text": "new york marathon", "source": "trending" } ] }
-> 200 OK { "suggestions": [] }   (unknown prefix, or the server is shedding load)
-> 400 Bad Request                (prefix longer than 100 characters)

GET /v1/suggest/personal?q=new%20yo     Cookie: session=...    (signed-in users only)
-> 200 OK   Cache-Control: private, no-store
   { "suggestions": [ { "text": "new york pizza near me", "source": "history" } ] }
   The client shows these above the global list, so global responses stay shared.

PublishSnapshot(locale, uri, version, checksum, queryCount)    internal, from the builder
-> servers load and validate it, then swap; RollbackSnapshot(locale, version) reverts`,
  dataModel: `query_daily      warehouse table, partitioned by day; input to the index builder
  locale          string
  query_norm      string   NFKC + case folded, spaces collapsed
  day             date
  searches        int64
  distinct_users  int64    a query needs a minimum before it can ever be suggested

snapshot         immutable file per (locale, version); servers memory-map it
  queries         query_id -> text, decayed score
  nodes           radix trie: edge label, child range, top-K query_ids (K = 10)
  manifest        version, checksum, query count, build time

trending         in server memory, refreshed every ~30 s by the streaming job
  prefix -> [(query, score)] for the last ~15 minutes

removals         small table pushed to every server; applied at build and serve time
  query_norm      string   primary key
  reason          string
  created_at      timestamp

Hot path: one in-memory walk to the prefix node plus a small merge; no disk
or network I/O once a snapshot is loaded.`,
  architecture: {
    diagram: `                User typing
                  |  ^
   debounced GET  |  | top 10 suggestions
                  v  |
          +-----------------+
          |   CDN / edge    |  caches global results per prefix
          +--------+--------+
                   | miss
                   v
          +-----------------+  hot trends   +---------------------+
          | Suggest servers |<--------------|    Trending job     |
          | (trie in RAM,   |               | (streaming, last    |
          |  merge, filter) |               |  ~15 minutes)       |
          +--------+--------+               +----------+----------+
                   ^                                   ^
                   | new snapshot,                     | search events
                   | swapped atomically                |
          +--------+--------+  daily stats  +----------+----------+
          |  Index builder  |<--------------|     Query logs      |
          |  (batch)        |               | (Kafka, warehouse)  |
          +-----------------+               +----------+----------+
                                                       ^
                                    completed searches |
                                               Search frontends`,
    flow: [
      'The browser debounces keystrokes (~50–100 ms), cancels the previous in-flight request and sends the prefix; the CDN answers repeated (prefix, locale) lookups from cache for up to 60 s.',
      'On a miss, a suggest server normalizes the prefix exactly as the index was built, walks its in-memory trie and reads the node’s precomputed top 10 in O(prefix length), with no ranking work.',
      'It merges approved candidates for the same prefix from the trending job’s latest push, drops anything on the removal list and returns the result.',
      'Search frontends log completed searches to Kafka; the trending job counts them over a sliding ~15-minute window, and the warehouse aggregates daily statistics.',
      'The batch index builder turns daily statistics into decayed scores, filters unsafe and rare queries, and publishes a validated, immutable snapshot that servers swap in atomically.',
    ],
  },
  deepDives: [
    {
      heading: 'Precomputed top-K in a trie',
      points: [
        'Walking to the prefix node and then searching its whole subtree costs time proportional to the subtree, which is enormous for a one-letter prefix. Storing each node’s top K at build time makes a lookup O(prefix length).',
        'A node’s list holds the K best queries in its subtree, ordered by score descending and then by query text, so ties break deterministically and every replica returns identical results.',
        'For memory, use a radix trie (single-child chains collapsed into one edge), store 4-byte query IDs instead of strings in the lists, and lay the snapshot out as flat arrays that servers memory-map, so loading is fast and the OS shares pages between processes.',
        'A score change touches the list of every ancestor node, so the index is rebuilt rather than updated in place. Immutable snapshots need no locks on the read path, and rollback is a pointer swap.',
      ],
    },
    {
      heading: 'Offline pipeline, freshness and safety',
      points: [
        'Score each query with exponential decay, e.g. the sum over days of count × 0.5^(age in days ÷ 7), so its weight halves every week and old spikes fade instead of ranking for years.',
        'Use the same safety gate for both daily snapshots and streaming candidates: require a minimum number of distinct users, drop email/phone and other PII, and apply the offensive-content blocklist and classifier before anything can be published.',
        'Build one snapshot per locale, validate it (query count, checksum, known prefixes compared with the previous version), then publish. Servers load it beside the current one and switch a pointer atomically, so no request sees a half-built index.',
        'Daily builds miss breaking news, so a streaming job counts searches over a sliding ~15-minute window and applies the same distinct-user minimum, PII checks, blocklist and classifier as the daily builder before publishing trending entries. Servers merge only approved entries with the snapshot at serve time.',
        'A removal list pushed to every server takes effect within minutes, so a takedown does not wait for the next build.',
      ],
    },
    {
      heading: 'Serving, sharding and the client',
      points: [
        'At ~20 GB the index fits in one server’s RAM, so every server holds a full replica and any server can answer any prefix; capacity grows by adding replicas, and losing servers never loses coverage.',
        'If it outgrew RAM, shard by locale, then by prefix ranges balanced by traffic rather than letters (far more English queries start with "s" than "x"), or use a prefix → top-K map sharded by prefix hash, since lookups are exact-key reads.',
        'The client debounces typing, aborts stale requests (AbortController) and ignores out-of-order responses, caches results per prefix for the session, filters the previous list locally while waiting, and prefetches suggestions for the empty box when it gets focus.',
        'Personalization shows the user’s recent searches that match the prefix above the global list, fetched by a separate, uncached call, so global responses stay CDN-cacheable and one user’s history never enters a shared cache.',
        'Normalize identically at build and serve time: NFKC plus case folding maps case variants, composed and decomposed accents and full-width forms to one key. The sample approximates folding with toLowerCase and also folds ς to σ, because toLowerCase writes a word-ending Σ as ς, so a half-typed "ΠΑΣ" would otherwise miss "πασχα". The Turkish dotted and dotless i need per-locale rules.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Index structure',
      choice: 'Trie with precomputed top-K per node',
      rationale:
        'O(prefix length) lookups with no ranking at request time. Ranking on demand would scan large subtrees for short prefixes; a flat prefix → list map is equivalent but repeats every prefix string.',
    },
    {
      decision: 'Freshness',
      choice: 'Daily immutable snapshots plus a streaming trending layer',
      rationale:
        'Snapshots are lock-free and trivial to roll back, and the trending layer covers news within minutes. In-place updates would need locks and a rewrite of every ancestor’s list on each count change.',
    },
    {
      decision: 'Distribution',
      choice: 'Full replica on every server',
      rationale:
        'At ~20 GB the index fits in RAM, so any server answers any prefix. Sharding by prefix would add routing and hot shards for no benefit at this size.',
    },
    {
      decision: 'Caching and personalization',
      choice: 'CDN-cached global results, personal history in a separate call',
      rationale:
        'Global (prefix, locale) results are identical for everyone, so caching absorbs repeated short prefixes. Personalizing the whole response would make every request a cache miss.',
    },
  ],
  failureModes: [
    'Bad snapshot (truncated, empty or skewed by a bot spike): validate counts and checksums, diff top prefixes against the previous version, canary on a few servers and keep the previous snapshot for instant rollback.',
    'Offensive or manipulated suggestions: bots can inflate a query, so count distinct users rather than raw searches, apply blocklists at build and serve time, and allow takedowns within minutes.',
    'Overload or slow servers: suggestions are optional, so time out fast and return an empty list rather than delay typing; the CDN keeps serving cached prefixes while load is shed.',
    'Trending job lagging or down: servers ignore trending entries older than a few minutes and serve the snapshot alone, which is stale but safe.',
    'Memory spike during a swap: loading a new snapshot next to the old one doubles memory, so keep 2× headroom or memory-map the files, and stagger swaps so the whole fleet never reloads at once.',
  ],
  code: {
    label: 'TypeScript: trie with top-K per node, deterministic ties and Unicode normalization',
    language: 'TypeScript',
    code: `export interface Suggestion { readonly query: string; readonly score: number }
    export interface PublicCandidate {
      readonly query: string;
      readonly score: number;
      readonly distinctUsers: number;
    }

    /** Shared publish gate for both the batch snapshot builder and the streaming trending job. */
    export async function filterPublicCandidates(
      candidates: Iterable<PublicCandidate>,
      minDistinctUsers: number,
      looksLikePii: (query: string) => boolean,
      isBlocked: (query: string) => boolean,
      isUnsafe: (query: string) => Promise<boolean>,
    ): Promise<PublicCandidate[]> {
      if (!Number.isInteger(minDistinctUsers) || minDistinctUsers < 1) {
        throw new RangeError('minDistinctUsers must be positive');
      }
      const approved: PublicCandidate[] = [];
      for (const candidate of candidates) {
        const query = normalize(candidate.query);
        if (
          query === '' ||
          candidate.distinctUsers < minDistinctUsers ||
          looksLikePii(query) ||
          isBlocked(query) ||
          (await isUnsafe(query))
        ) continue;
        approved.push({ ...candidate, query });
      }
      return approved;
    }

/** Maps case, composed vs decomposed accents and full-width letters to one key. */
export function normalize(text: string, keepTrailingSpace = false): string {
  // toLowerCase, not toLocaleLowerCase: the index must not depend on the server locale.
  const folded = text.normalize('NFKC').toLowerCase().replace(/\\s+/g, ' ').trimStart();
  // While typing, a trailing space is meaningful: "new " must not match "newark".
  return keepTrailingSpace ? folded : folded.trimEnd();
}

// toLowerCase writes Σ as final ς when it ends a word, so a half-typed "ΠΑΣ" ends in ς where
// "πασχα" has σ. Trie paths fold ς to σ, as Unicode case folding does; display text keeps ς.
const trieKey = (query: string): string => query.replaceAll('ς', 'σ');

interface TrieNode { readonly children: Map<string, TrieNode>; readonly top: Suggestion[] }

// Score descending, then query text, so ties are deterministic on every replica.
const ranksBefore = (a: Suggestion, b: Suggestion): boolean =>
  a.score > b.score || (a.score === b.score && a.query < b.query);

/**
 * Immutable prefix index built offline. Every node stores the top K completions of its
 * subtree, so a lookup walks one node per typed character and never scans the subtree.
 */
export class SuggestionIndex {
  private readonly root: TrieNode = { children: new Map(), top: [] };
  private readonly k: number;

  constructor(entries: Iterable<readonly [string, number]>, k = 10) {
    if (!Number.isSafeInteger(k) || k < 1) throw new RangeError('k must be a positive integer');
    this.k = k;
    const totals = new Map<string, Suggestion>();
    for (const [raw, score] of entries) {
      if (!Number.isFinite(score) || score < 0) throw new RangeError('bad score for ' + raw);
      const query = normalize(raw);
      const folded = trieKey(query);
      // Aggregate on the lookup key; preserve a deterministic display spelling separately.
      if (folded !== '') {
        const previous = totals.get(folded);
        totals.set(folded, {
          query: previous === undefined || query < previous.query ? query : previous.query,
          score: (previous?.score ?? 0) + score,
        });
      }
    }
    for (const suggestion of totals.values()) this.insert(suggestion);
  }

  private insert(s: Suggestion): void {
    let node = this.root;
    this.offer(node, s);
    for (const ch of trieKey(s.query)) { // iterates code points, so emoji are never split in half
      let next = node.children.get(ch);
      if (next === undefined) {
        next = { children: new Map(), top: [] };
        node.children.set(ch, next);
      }
      node = next;
      this.offer(node, s);
    }
  }

  private offer(node: TrieNode, s: Suggestion): void {
    const at = node.top.findIndex((t) => ranksBefore(s, t));
    if (at === -1) {
      if (node.top.length < this.k) node.top.push(s);
      return;
    }
    node.top.splice(at, 0, s);
    if (node.top.length > this.k) node.top.pop();
  }

  /** Best completions for what the user has typed so far; [] for an unknown prefix. */
  suggest(typed: string, limit = this.k): Suggestion[] {
    let node: TrieNode | undefined = this.root;
    for (const ch of trieKey(normalize(typed, true))) {
      node = node.children.get(ch);
      if (node === undefined) return [];
    }
    return node.top.slice(0, Math.max(0, limit));
  }
}`,
  },
  followUps: [
    {
      question: 'How would you match words in the middle of a query, such as "york" → "new york"?',
      answer:
        'Also index each query under every word start, with a penalty relative to true prefix matches. This roughly multiplies the index size by the average number of words per query, so limit it to popular queries or keep a second, smaller index.',
    },
    {
      question: 'How would you tolerate typos?',
      answer:
        'Keep exact prefix lookup as the fast path and fall back to fuzzy matching only when it returns too few results: walk the trie allowing one edit within a bounded search, or precompute common misspellings from query-reformulation logs. Fuzzy candidates rank below exact ones.',
    },
    {
      question: 'How would you evaluate a ranking change?',
      answer:
        'Offline, replay logged typing sessions and measure how early the query the user finally searched for appears (mean reciprocal rank, keystrokes saved). Online, A/B test with suggestion click-through and keystrokes saved as the primary metrics, and latency and removal requests as guardrails.',
    },
  ],
};
