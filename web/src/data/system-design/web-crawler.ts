import type { SystemDesignQuestion } from '../../types/system-design';

export const webCrawler: SystemDesignQuestion = {
  slug: 'web-crawler',
  title: 'Design a distributed web crawler',
  difficulty: 'Hard',
  companies: ['Google', 'OpenAI', 'Anthropic', 'Apple'],
  prompt:
    'Design a web crawler that continuously fetches pages from the public web for a search index and for a pipeline that builds LLM training datasets. Assume 1 billion page fetches per day, about 20 billion known URLs, an average page of 100 KB and roughly 50 links per page. The crawler must respect robots.txt and never overload a website.',
  signals: [
    'Makes politeness a hard constraint that shapes the frontier (per-host queues, one connection per host, crawl delays, robots.txt) rather than an afterthought bolted onto one global queue.',
    'Lets the numbers pick the mechanisms: requests in flight call for asynchronous fetchers, link volume for an in-memory seen-URL set, and per-host state for partitioning by host.',
    'Handles the messy web: URL normalization, exact and near-duplicate content, crawler traps, slow or failing servers, and freshness through recrawl scheduling.',
    'Knows what changes when the data trains LLMs: honoring robots.txt and opt-outs, filtering low-quality and unsafe content, and deduplicating aggressively.',
  ],
  requirements: {
    functional: [
      'Start from seed URLs and sitemaps, fetch pages over HTTP and HTTPS, extract links and keep discovering new URLs.',
      'Order the crawl by estimated importance, and recrawl known pages at a rate that matches how often they change.',
      'Obey robots.txt and per-site rate limits, and stop crawling a site promptly when its owner opts out.',
      'Store every fetched response with its HTTP headers and metadata, and publish it to the search-indexing and training-data pipelines.',
      'Detect exact and near-duplicate pages so downstream consumers do not process the same content many times.',
    ],
    nonFunctional: [
      'Throughput: sustain ≈ 11,600 fetches/s (1B/day) and scale roughly linearly by adding crawler nodes.',
      'Politeness: at most one request in flight per host, with a delay between requests that grows when the site slows down or pushes back.',
      'Robustness: survive malformed HTML, slow or hostile servers, traps and node failures without losing the frontier.',
      'Freshness: important pages that change often are recrawled within hours, and the long tail within weeks.',
    ],
    outOfScope: [
      'Rendering pages that need JavaScript (covered as a follow-up).',
      'Building the search index, ranking, and training the models themselves.',
      'Content behind logins or paywalls; the crawler fetches only public pages.',
    ],
  },
  estimates: [
    'Fetch rate: 1B pages/day ÷ 86,400 s ≈ 11,600 pages/s, with ~2× headroom (≈ 23,000/s) to catch up after outages. At ~1 s per fetch, Little’s law puts ≈ 11,600 requests in flight at once, which favors asynchronous I/O over a thread per request.',
    'Bandwidth: 11,600 pages/s × ~100 KB ≈ 1.16 GB/s ≈ 9.3 Gbps of inbound traffic on average, plus small robots.txt and DNS overhead.',
    'Storage: 1B × 100 KB = 100 TB/day raw; at ~4:1 gzip, WARC files grow by ≈ 25 TB/day ≈ 9 PB/year if every crawl is kept, so old snapshots move to colder storage tiers.',
    'Politeness: at one fetch per host every ~5 s, a host yields at most 0.2 pages/s, so 11,600 pages/s needs ≥ 11,600 × 5 ≈ 58,000 hosts with ready URLs at every moment. Work must be spread across hosts, not drained from big sites.',
    'Seen-URL set: 11,600 pages/s × ~50 links ≈ 580,000 lookups/s against 20B known URLs. A Bloom filter at 1% false positives needs ≈ 9.6 bits and 7 hashes per URL ≈ 24 GB of RAM, vs 160 GB for exact 8-byte fingerprints.',
  ],
  api: `Frontier RPCs (gRPC)    AddUrls goes to the owner of hash(host); fetchers lease locally
AddUrls({ urls: [{ url, priority, depth, foundOn }] })    (batched; seen URLs are no-ops)
-> { accepted: 812, seen: 180, rejected: 8 }        (rejected: invalid, trap, over budget)

LeaseUrl({ fetcherId })             (only hosts that are due and have no fetch in flight)
-> { url, host, leaseId, expiresAt }  |  { waitMs: 140 }  |  { empty: true }

Complete({ leaseId, status: 429, fetchMs: 380, retryAfterMs: 60000 })
-> { nextAllowedAt: "2025-06-01T12:01:00Z" }    (429/5xx: URL goes back to its host queue)
-> { ignored: true }               (lease already expired and its URL was requeued)

Kafka topic page.fetched (keyed by host; read by the indexing and training pipelines)
{ "url": "https://example.com/a", "status": 200, "fetchedAt": "2025-06-01T12:00:00Z",
  "warc": "s3://crawl/2025-06-01/n17-00042.warc.gz", "offset": 88213, "length": 20511,
  "sha256": "9f2c...", "simhash": "a3f1...", "nearDupOf": null }

Admin HTTP API
PUT  /v1/hosts/{host}/policy  { "minDelayMs": 10000, "pageBudget": 50000 }  -> 200 OK
POST /v1/optouts  { "domain": "example.com" }   -> 202 Accepted   (purges queued URLs)
POST /v1/seeds  { "urls": ["https://example.com/"], "priority": 0.9 }  -> 202 Accepted`,
  dataModel: `url_state        one row per known URL; sharded by hash(host), like the frontier
  url_fp       bytes(8)   primary key: 64-bit hash of the normalized URL (~11 collisions
                          expected among 20B URLs, an acceptable loss)
  url          string     normalized; over 2,048 chars is rejected as a likely trap
  state        enum       queued | leased | fetched | failed | disallowed | duplicate
  priority     float32    from inbound links, host quality and expected change
  next_fetch   timestamp  next recrawl, from the estimated change rate
  last_sha256  bytes(32)  main-content hash of the last fetch, to detect change
  etag, last_modified     validators for conditional GETs (304 Not Modified)
  visits, changes  int32  inputs to the change-rate estimate

host_state       one row per host, on the node that owns hash(host)
  host         string     primary key, lowercased
  robots       blob       parsed rules + fetched_at; refreshed within 24 h
  delay_ms     int32      max(policy floor, ~10x recent fetch time, Crawl-delay)
  next_ok_at   timestamp  next-allowed fetch time: the frontier heap key
  budget       int32      pages left this cycle; bounds traps and spam farms
  ip, dns_ttl             cached DNS answer; hosts sharing an IP share a rate limit
  errors       int32      consecutive failures: exponential backoff, then parking

content_hashes   SHA-256 of the normalized body -> first url_fp (exact duplicates)
simhash_tables   several bit-permuted, sorted copies of every 64-bit SimHash; any two
                 within Hamming distance 3 share an exact prefix in at least one copy

WARC files       object storage; ~1 GB files of request + response records, each record a
                 separate gzip member, so (file, offset, length) reads one page directly

Filtering, scheduling and politeness for a host touch only the node that owns it;
only newly found links cross nodes, in batches.`,
  architecture: {
    diagram: ` seeds, sitemaps
        |
        v
+--------------------+  1. URL to the  +------------------------+
| URL filter:        |  node owning    | Frontier (owner node): |
| normalize, traps,  |  hash(host)     | priority queues ->     |
| seen? Bloom, then  |---------------->| per-host FIFOs + heap  |
| URL store          |                 | by next-allowed time   |
+--------------------+                 +----+--------------+----+
          ^                       2. lease  |              ^ done(host):
          | 5. new links          a ready   |              | delay
          |                       URL       v              | starts
+---------+----------+                 +----+--------------+----+
| Content processor: |  4. response    | Async fetchers:        |
| links, SHA-256,    |<----------------| DNS + robots caches,   |
| SimHash, quality   |                 | timeouts, size caps    |
+---------+----------+                 +-----------+------------+
          | 6. store + emit                        ^
          v                                        | 3. robots
+---------------------------------+                v    check, GET
| WARC files in object storage;   |          +-----+-----+
| Kafka -> indexing, training     |          |  the web  |
+---------------------------------+          +-----------+`,
    flow: [
      'Seeds, sitemaps and newly found links pass the URL filter, which normalizes them, drops trap-like or over-budget URLs and skips any the seen set (a Bloom filter, then the URL store) already knows. Survivors go to the node that owns hash(host).',
      'That node’s frontier files each URL by priority and feeds per-host FIFOs; it leases a URL to a fetcher only when the host’s next-allowed time has passed and no other request to that host is in flight.',
      'The fetcher resolves the host through its DNS cache, checks the URL against the cached robots.txt rules (refetching them if stale) and sends the GET with timeouts, a size cap and conditional headers on recrawls.',
      'When the fetch ends, the fetcher reports done(host), which sets the host’s next-allowed time (later after a 429 or 503), and hands the response to a content processor.',
      'The processor extracts and normalizes links and sends them back through the URL filter, and computes SHA-256 and SimHash so exact and near duplicates are flagged rather than reprocessed.',
      'It appends the response to WARC files in object storage and publishes a pointer to Kafka for the search-indexing and training-data pipelines; the page’s next recrawl time is updated from whether it changed.',
    ],
  },
  deepDives: [
    {
      heading: 'URL frontier: priority and politeness',
      points: [
        'Introduction to Information Retrieval (IIR, ch. 20) describes the Mercator frontier in two layers: front queues order URLs by priority, and each back queue holds URLs of a single host, so politeness is enforced per back queue.',
        'A min-heap of hosts keyed by the earliest time each may be contacted again picks the next host. IIR cites a common heuristic: wait about 10× as long as the last fetch from that host took, so slow servers are visited less often.',
        'Allow one request in flight per host and start its delay when the fetch ends. Honor Retry-After on 429 and 503, back off exponentially on repeated errors, and cap requests per IP, since shared hosting puts many hosts on one server.',
        'Refill host queues from the front queues with a bias toward high priority but some share for every level, so the long tail still gets crawled. Among hosts already due, serve the longest-waiting first so newly found hosts cannot starve others.',
        'Only queue heads need RAM: a host with millions of pending URLs keeps the rest on disk, and the frontier is checkpointed so a restart does not lose it.',
      ],
    },
    {
      heading: 'robots.txt, DNS and fetchers',
      points: [
        'RFC 9309 (2022) standardized robots.txt: obey the group for the crawler’s own product token (else the * group), apply the longest matching rule with allow winning ties, and refetch the file at least every 24 hours.',
        'A 4xx such as 404 means no restrictions; a 5xx or network error means complete disallow, relaxed only after a long outage (the RFC suggests 30 days). Crawl-delay is not in the RFC and Google does not support it, but honoring it is cheap.',
        'Check robots rules just before fetching, not only at discovery, because a URL can wait in the frontier for days while the file changes. URLs leave the frontier grouped by host, so the robots cache still has good locality.',
        'DNS resolution is a classic crawler bottleneck: run a caching resolver on each node that honors TTLs and answers asynchronously, and prefetch a host’s address shortly before it comes due.',
        'Fetchers multiplex thousands of connections per process with connect and read timeouts, a body cap of a few MB and a redirect limit, and send If-None-Match or If-Modified-Since on recrawls so unchanged pages cost only a 304.',
      ],
    },
    {
      heading: 'Deduplication, crawler traps and recrawl',
      points: [
        'Normalize before dedup: lowercase scheme and host, drop the fragment and default port, resolve dot segments, and strip known session and tracking parameters. Do not sort query parameters blindly, since some servers treat their order as meaningful.',
        'The seen set is a Bloom filter in front of the persistent URL store, sharded like the frontier. A false positive (≈ 1% of new URLs) drops that URL every time it is found, so for high-priority links, confirm "maybe seen" answers against the store.',
        'SHA-256 of the normalized body catches exact duplicates. Near-duplicates (same article, different ads or dates) use 64-bit SimHash (Charikar, 2002); Manku, Jain and Das Sarma (WWW 2007) found a Hamming distance threshold of 3 reasonable for 8 billion pages.',
        'Traps such as infinite calendars, session IDs in paths and ever-deeper relative links are bounded by URL length and depth limits, a cap on repeated path segments, and a per-host page budget per cycle that grows with the host’s measured quality.',
        'Recrawl from observed change: compare main-content hashes across visits, since ads and timestamps change the raw bytes, to estimate each page’s change rate. Cho and Garcia-Molina (2003) showed proportional revisiting is not optimal: pages changing too often to keep fresh deserve fewer visits.',
      ],
    },
    {
      heading: 'Partitioning and crawling for LLM training',
      points: [
        'Assign hosts to nodes by consistent hashing of the hostname, so a host’s queue, politeness clock, robots cache and seen-URL shard live on one node and need no locks. Links to other hosts are buffered and forwarded to their owners in batches.',
        'Politeness also bounds hot spots: a huge site still gets at most one fetch every few seconds. Its skew shows up as queue size, which spills to disk, not as fetch load.',
        'Adding a node moves only the hosts that now hash to it, and their state is rebuilt from the URL store, which is sharded the same way. Moved hosts start with a full delay, since their last fetch time may be lost.',
        'For training data, publish a user-agent token that sites can block separately, and honor it as well as removal requests. OpenAI documents GPTBot this way, and Google documents Google-Extended, a robots.txt token (not a separate crawler) for Gemini training.',
        'Then filter hard: language ID, quality heuristics and classifiers, unsafe-content and PII filters, and exact plus near-duplicate removal across the whole corpus, because repeated documents waste training compute and make verbatim memorization more likely.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Work partitioning',
      choice: 'By hash of the hostname (consistent hashing)',
      rationale:
        'A host’s queue, politeness clock, robots rules and seen-URL shard stay on one node, so politeness needs no coordination. Partitioning by URL hash balances load slightly better but needs a distributed per-host rate limiter on every fetch.',
    },
    {
      decision: 'Seen-URL set',
      choice: 'Bloom filter in RAM in front of a persistent URL store',
      rationale:
        'It answers ≈ 580,000 checks/s from ≈ 24 GB of memory at the cost of skipping ~1% of new URLs. Exact fingerprints in RAM would take ≈ 160 GB, and sending every check to the persistent store would make it the bottleneck.',
    },
    {
      decision: 'Fetcher concurrency',
      choice: 'Asynchronous I/O with thousands of connections per process',
      rationale:
        'About 11,600 requests are in flight, nearly all waiting on the network, so an event loop keeps each one cheap. A thread per request is simpler to write but pays for a stack and context switches on every one.',
    },
    {
      decision: 'Raw page storage',
      choice: 'WARC files (ISO 28500) in object storage',
      rationale:
        'Append-only files keep full HTTP headers and bodies, so pages can be re-parsed or re-filtered without re-crawling, and standard tools read them. A database row per page costs far more per byte for 25 TB/day of write-once blobs.',
    },
    {
      decision: 'Recrawl policy',
      choice: 'Per-page schedule from observed change rate and importance',
      rationale:
        'Fetches go where content actually changes. A uniform recrawl interval is simpler but spends most fetches on unchanged pages while fast-moving pages go stale.',
    },
  ],
  failureModes: [
    'Crawler node dies: its hosts move to their next owner on the hash ring, which rebuilds their queues from the URL store and the last frontier checkpoint. Expired leases put in-flight URLs back, and moved hosts start with a full delay.',
    'Spider trap or spam farm: one host’s new-URL count explodes while its pages are near-duplicates. Per-host budgets cap the damage; alert on hosts with high duplicate rates and stop expanding their links.',
    'Site struggling under load: latency rises or it returns 429 or 503. The adaptive delay grows with fetch time, Retry-After is honored, and repeated errors back off exponentially per host and per IP before the host is parked.',
    'Bloom filter lost or overfilled: a restart empties RAM, and growing past its sizing raises the false-positive rate. Rebuild it from the URL store before accepting links, and build a larger one before the URL count passes its design point.',
    'DNS or robots.txt failures: lookups time out or robots.txt returns 5xx. Serve recently cached DNS answers for a bounded time, and treat a robots.txt 5xx as complete disallow (RFC 9309), never as permission.',
  ],
  code: {
    label: 'TypeScript: politeness-aware frontier with per-host queues, a next-allowed-time heap and URL dedup',
    language: 'TypeScript',
    code: `interface HostQueue {
  name: string;
  urls: string[]; // FIFO of normalized URLs
  readyAt: number; // earliest start time of the next request to this host
  order: number; // FIFO tie-break among hosts with the same readyAt
  inFlight: boolean;
}

const before = (a: HostQueue, b: HostQueue): boolean =>
  a.readyAt < b.readyAt || (a.readyAt === b.readyAt && a.order < b.order);

export function normalizeUrl(raw: string): string | null {
  const url = URL.parse(raw); // WHATWG parsing lowercases scheme/host and drops default ports
  if (url === null || (url.protocol !== 'http:' && url.protocol !== 'https:')) return null;
  url.hash = ''; // the fragment never reaches the server
  return url.href;
}

export class Frontier {
  private readonly hosts = new Map<string, HostQueue>();
  private readonly heap: HostQueue[] = []; // idle hosts with queued URLs, min by (readyAt, order)
  private readonly seen = new Set<string>(); // production: Bloom filter + persistent URL store
  private readonly now: () => number;
  private readonly crawlDelayMs: (host: string) => number;
  private pushes = 0;

  constructor(now: () => number, crawlDelayMs: (host: string) => number) {
    this.now = now;
    this.crawlDelayMs = crawlDelayMs;
  }

  add(raw: string): boolean {
    const url = normalizeUrl(raw);
    if (url === null || this.seen.has(url)) return false; // invalid or already seen
    this.seen.add(url);
    const name = new URL(url).hostname;
    const host = this.hosts.get(name) ?? { name, urls: [], readyAt: 0, order: 0, inFlight: false };
    this.hosts.set(name, host);
    if (host.urls.push(url) === 1 && !host.inFlight) this.push(host); // it was idle and empty
    return true;
  }

  next(): { url: string; host: string } | { waitMs: number } | null {
    const host = this.heap[0];
    if (host === undefined) return null; // empty, or every host with URLs is in flight
    const waitMs = host.readyAt - this.now();
    if (waitMs > 0) return { waitMs };
    this.popTop();
    const url = host.urls.shift();
    if (url === undefined) throw new Error('invariant: hosts in the heap have queued URLs');
    host.inFlight = true; // one connection per host: it stays out of the heap until done()
    return { url, host: host.name };
  }

  /** Call when the fetch ends: the delay (or a longer 429/503 Retry-After) starts now. */
  done(name: string, retryAfterMs = 0): void {
    const host = this.hosts.get(name);
    if (host === undefined || !host.inFlight) return;
    host.inFlight = false;
    host.readyAt = this.now() + Math.max(this.crawlDelayMs(name), retryAfterMs);
    if (host.urls.length > 0) this.push(host);
  }

  private push(host: HostQueue): void {
    host.readyAt = Math.max(host.readyAt, this.now()); // serve ready hosts oldest-first
    host.order = this.pushes++;
    let i = this.heap.push(host) - 1;
    for (let p = (i - 1) >> 1; i > 0; i = p, p = (i - 1) >> 1) {
      const parent = this.heap[p];
      if (parent === undefined || !before(host, parent)) break;
      this.heap[i] = parent; // sift up: move the parent down into the hole
    }
    this.heap[i] = host;
  }

  private popTop(): void {
    const last = this.heap.pop();
    if (last === undefined || this.heap.length === 0) return;
    let i = 0;
    for (let c = 1; c < this.heap.length; c = 2 * i + 1) {
      const left = this.heap[c];
      const right = this.heap[c + 1];
      const child = left && right && before(right, left) ? right : left;
      if (child === undefined || !before(child, last)) break;
      this.heap[i] = child; // sift down: move the smaller child up into the hole
      i = child === left ? c : c + 1;
    }
    this.heap[i] = last;
  }
}`,
  },
  followUps: [
    {
      question: 'How would you crawl pages that need JavaScript to render?',
      answer:
        'Render selectively: send pages whose raw HTML yields little text or few links to a separate pool of headless browsers, and keep the cheap HTML path for everything else. Rendering costs far more CPU and memory than parsing, so it gets its own queue and budget. Every subresource the browser loads must pass the same robots.txt and per-host politeness checks.',
    },
    {
      question: 'How would you keep news sites fresh within minutes?',
      answer:
        'Give them a high-priority lane: poll their sitemaps, RSS or Atom feeds and section pages often, and enqueue new links at top priority. Conditional GETs make unchanged feeds cost a 304, and WebSub push notifications can replace polling where publishers support them. Freshness comes from fetching the right URLs first, not from shortening the per-host delay.',
    },
    {
      question: 'A site owner says the crawler is hurting their site, or wants out of AI training. What do you do?',
      answer:
        'Make the crawler easy to identify and control: a descriptive user-agent with a contact URL, published IP ranges, and a separate robots.txt token for training use. On an overload report, raise that host’s delay at once through the policy API, then find out why adaptive backoff did not react. An opt-out purges queued URLs, stops future fetches and excludes already-stored pages from new training datasets.',
    },
  ],
};
