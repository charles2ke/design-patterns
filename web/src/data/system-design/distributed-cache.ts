import type { SystemDesignQuestion } from '../../types/system-design';

export const distributedCache: SystemDesignQuestion = {
  slug: 'distributed-cache',
  title: 'Design a distributed cache',
  difficulty: 'Medium',
  companies: ['Google', 'Microsoft'],
  prompt:
    'Design a distributed in-memory cache like Memcached or Redis Cluster that application servers use to take read load off a database. It supports get, set with a TTL and delete, spreads keys across many nodes, and keeps working while nodes are added, removed or fail. Assume 1M operations per second (90% reads), 1 KB average values and 200M hot keys.',
  signals: [
    'Picks a partitioning scheme (consistent hashing with virtual nodes, or fixed hash slots) and can say how many keys move when membership changes.',
    'Treats the cache as a disposable copy: knows the invalidation patterns and the race in which a stale read repopulates the cache after a write.',
    'Protects the database from stampedes, cold or failed nodes and hot keys, not just from steady-state load.',
    'Sizes the cluster for both memory and throughput, and notices which of the two sets the shard count.',
  ],
  requirements: {
    functional: [
      'Operations get, set (with a TTL) and delete for string keys and opaque values up to 1 MB, plus multi-get for batched reads.',
      'Each node enforces a memory limit by evicting entries (LRU or LFU) and expires entries when their TTL passes.',
      'Add or remove nodes while serving traffic, moving as few keys as possible.',
      'Optional replicas, so a node failure does not empty its whole share of the key space.',
    ],
    nonFunctional: [
      'Sub-millisecond median and ~1 ms p99 latency for single-key operations within a data center.',
      'Scales linearly by adding nodes; no coordinator sits on the request path.',
      'Availability over consistency: a node failure only lowers the hit rate, because the database stays the source of truth.',
      'Bounded staleness: writes invalidate cached copies promptly, and every entry has a TTL as a backstop.',
    ],
    outOfScope: [
      'Durability and persistence: the cache can always be rebuilt from the database.',
      'Rich data types, server-side scripting and transactions.',
      'Replicating cache contents across regions: each region runs its own cluster.',
    ],
  },
  estimates: [
    'Traffic: 1M ops/s = 900k reads + 100k writes per second; at ~1 KB per value that is ≈ 1 GB/s ≈ 8 Gbps of payload across the cluster.',
    'Memory: 200M keys × (1,000 B value + ~100 B key and item overhead) ≈ 220 GB; with ~20% for fragmentation and hash tables ≈ 265 GB.',
    'Nodes: at an assumed ~100k ops/s per node, run at 50% for headroom, 1M ÷ 50k = 20 primaries of ≈ 13 GB and 10M keys each, plus one replica each = 40 nodes. Throughput, not RAM, sets the count.',
    'Rebalancing: adding a 21st node moves ≈ 1/21 ≈ 4.8% of keys (≈ 9.5M) with consistent hashing, while hash(key) mod N would remap 20/21 ≈ 95% and briefly turn the cache into a near-total miss.',
    'Node loss: one of 20 primaries failing without a replica sends 900k ÷ 20 = 45k reads/s to the database until a replacement warms up.',
    'Hot key: one key read 100k times/s × 1 KB = 100 MB/s ≈ 0.8 Gbps and a whole node’s ops budget, so hot keys need a near-cache or replicated copies, not more shards.',
  ],
  api: `Client library (linked into each app server; it routes every key to its owner node)
get(key)                          -> value | MISS
mget(keys[])                      -> { key: value }   (one batched request per owner)
set(key, value, ttlSeconds)       -> STORED
delete(key)                       -> DELETED | NOT_FOUND   (also voids open leases)
leaseGet(key)                     -> value | MISS + leaseToken | WAIT (retry in ~10 ms)
leaseSet(key, value, ttl, token)  -> STORED | REJECTED (a delete voided the lease)
errors: TIMEOUT (treat as a miss) | MOVED (stale topology: refresh, then retry)

Control plane (config service; clients cache the topology and watch for changes)
GET    /v1/topology  -> 200 { "epoch": 42, "vnodes": 160,
                              "nodes": [{ "id": "A", "addr": "10.0.1.5:11211",
                                          "weight": 1, "replica": "A'" }] }
POST   /v1/nodes     { "id": "D", "addr": "10.0.3.7:11211" }  -> 202 (warming)
DELETE /v1/nodes/{id}                    -> 202 (draining, then removed from the ring)`,
  dataModel: `Per cache node (all in memory)
  hash table    key -> item; grows incrementally so a resize never stalls requests
  item          key, value, flags, expires_at, cas_version, lru_prev, lru_next
  LRU list      doubly linked: head = most recently used, tail = next to evict
  slab classes  memory split into size classes (e.g. 96 B, 120 B ... 1 MB),
                each with its own LRU list
  leases        key -> lease token, issued on a miss and voided by a delete

Cluster metadata (config service such as etcd or ZooKeeper)
  topology      epoch, nodes { id, addr, weight, state: warming | active | draining },
                replica of each primary, vnodes per unit of weight
  health        last heartbeat per node; drives failure detection and failover

A request costs one hash and one hop to the owner. Clients cache the topology and
refresh it when the epoch changes or a node answers MOVED.`,
  architecture: {
    diagram: `      +-------------------------------------------------------+
      | App server                                            |
      |  near-cache for hot keys (in-process LRU, short TTL)  |
      |  client: hash ring + epoch, single-flight, leases     |
      +---+------------------------------+----------------+---+
          | get/set/delete               ^ topology       | miss: read
          | to key owner                 | + epoch        | writes
          v                              |                v
+-------------------+            +-------+---------+  +----------------+
| Cache nodes A,B,C | heartbeats | Config service  |  | Database       |
| LRU + TTL each    |----------->| (etcd): ring,   |  | (source of     |
+---------+---------+            | health checks,  |  |  truth)        |
          | async replication    | failover        |  +----------------+
          v                      +-----------------+
+-------------------+
| Replicas A',B',C' |
+-------------------+`,
    flow: [
      'At startup each app server’s client library fetches the topology (nodes, weights, epoch) from the config service and watches it for changes.',
      'For a read, the client checks its small near-cache of hot keys, then hashes the key onto the ring and sends get to the owning cache node: one network hop.',
      'On a miss, the client coalesces concurrent misses for the key (single-flight) and takes a lease; the lease holder reads the database and sets the value with its token and a jittered TTL, while other callers wait briefly and retry.',
      'A write updates the database first, then deletes the key on its owner node; the delete also voids open leases, so a slower reader cannot store the old value afterward.',
      'Each node evicts least recently used items when memory is full and drops expired ones on access and in sampled background sweeps; it streams changes asynchronously to its replica and heartbeats to the config service.',
      'When heartbeats stop, the config service promotes the replica, bumps the epoch and notifies clients, which route to the new primary; a replacement node joins empty and warms up.',
    ],
  },
  deepDives: [
    {
      heading: 'Partitioning: consistent hashing vs hash slots',
      points: [
        'With hash(key) mod N, adding a node remaps about N/(N+1) of keys, emptying the cache just when capacity grows. On a consistent-hash ring a key belongs to the first node point clockwise from its hash, so a new node takes only ≈ 1/(N+1) of keys.',
        'With one point per node, arc sizes vary wildly; the largest can be several times the mean. With 160 virtual nodes each, per-node load varies by about 1/sqrt(160) ≈ 8%, and in 20-node simulations the busiest node held 13–17% above the mean.',
        'Virtual nodes also spread a failed node’s keys over all survivors rather than one neighbor, and weighting a bigger machine is just giving it more points.',
        'Redis Cluster’s documentation describes the fixed-slot alternative: 16,384 hash slots, slot = CRC16(key) mod 16384, each slot owned by one primary. Resharding moves whole slots, with MOVED and ASK redirects steering clients, and {hash tags} keep related keys in one slot.',
        'Whatever the scheme, every client must compute identical owners: same hash function, key encoding, point labels, tie-breaks and topology epoch. A client on a stale ring sends deletes to the wrong node and leaves stale data behind.',
      ],
    },
    {
      heading: 'Eviction, TTLs and memory',
      points: [
        'Exact LRU is a hash map plus a doubly linked list: hits move items to the head and eviction pops the tail, both O(1). Relinking on every hit contends on a lock, so a busy server relinks an item at most once per interval.',
        'Redis documents a cheaper approximation: it samples a few keys (5 by default) and evicts the least recently used of them. Its LFU mode keeps a small logarithmic access counter that decays over time, so one-off scans do not flush the hot set.',
        'TTLs expire lazily when a key is read, plus a background task that samples keys with TTLs and deletes expired ones, reclaiming memory without full scans. Add up to 10% random jitter to TTLs so keys written together do not expire together.',
        'Allocation: Memcached’s slab allocator carves memory into size classes (e.g. 96 B, 120 B ... 1 MB), each with its own LRU. That avoids heap fragmentation but strands memory in old classes when value sizes shift, so it needs periodic slab rebalancing.',
      ],
    },
    {
      heading: 'Invalidation and stampede protection',
      points: [
        'Cache-aside is the default: read the cache, and on a miss read the database and set the value. On a write, update the database and then delete the key rather than set it, because concurrent sets can land out of order.',
        'Delete alone still races: reader A misses and reads v1, writer B commits v2 and deletes the key, then A sets v1, which stays stale until its TTL expires. This is why every entry needs a TTL as a backstop.',
        'Leases, described in the 2013 paper "Scaling Memcache at Facebook", fix the race: a miss returns a token, a delete invalidates it and a set with a stale token is rejected. Versioned sets (store only if newer) work when rows carry a version.',
        'Write-through updates the cache synchronously with the database, keeping hot data warm at the cost of write latency and caching values nobody reads. Write-behind acknowledges after the cache write and flushes later, which is fast but loses acknowledged writes if a node dies.',
        'Stampedes: when a hot key expires, thousands of requests miss at once. Coalesce them with single-flight in each client and leases across clients, and refresh hot keys early with a probability that rises near expiry (XFetch, VLDB 2015).',
      ],
    },
    {
      heading: 'Hot keys, replication and rebalancing',
      points: [
        'Find hot keys by sampling requests into a top-K counter. Serve them from an in-process near-cache with a 1–2 s TTL, or store copies under key#1 ... key#k on different nodes and read a random one, deleting every copy on writes.',
        'Each primary replicates asynchronously to one replica. Reading from replicas spreads load but can return values already deleted on the primary, and a failover can drop the last few deletes; replaying recent invalidations after promotion closes that gap.',
        'A new node joins in a warming state: on a miss it reads through to the key’s previous owner instead of the database, and deletes go to both owners until the move ends, so rebalancing costs cache hops, not database load.',
        'A node that restarts or rejoins after a partition must start empty, because it missed deletes while away. The Facebook paper also describes a small "gutter" pool that temporarily serves a failed server’s keys with short TTLs, shielding the database.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Partitioning scheme',
      choice: 'Consistent hashing with 160 virtual nodes per server',
      rationale:
        'Membership changes move only ≈ 1/N of keys, and the ring is derived from the member list alone. Fixed hash slots (as in Redis Cluster) make moves explicit and granular but need a slot map and a migration protocol; mod-N remaps almost everything.',
    },
    {
      decision: 'Request routing',
      choice: 'Client-side routing in a library',
      rationale:
        'One network hop and no extra tier to scale. A proxy tier such as mcrouter or twemproxy centralizes topology, connection pooling and retries, but adds a hop and its own capacity planning; it pays off when clients are numerous or written in many languages.',
    },
    {
      decision: 'Write path',
      choice: 'Cache-aside with delete-on-write, leases and TTLs',
      rationale:
        'The database stays the source of truth and the cache holds only what is read. Write-through keeps the cache warm but adds write latency and caches cold data; write-behind risks losing acknowledged writes.',
    },
    {
      decision: 'Eviction policy',
      choice: 'LRU by default, LFU for skewed, scan-heavy workloads',
      rationale:
        'LRU is cheap and adapts quickly to shifting popularity. LFU protects a stable hot set from one-off scans but adapts slowly unless its counters decay; sampled approximations of either avoid per-hit list updates.',
    },
    {
      decision: 'Replication',
      choice: 'One asynchronous replica per primary',
      rationale:
        'Failover keeps the hit rate up without adding write latency. Synchronous replication would add a round trip to every write for data that can be rebuilt; no replica is fine if the database can absorb a node’s misses (≈ 45k reads/s here).',
    },
  ],
  failureModes: [
    'Node crash: clients see timeouts and the config service misses heartbeats. Clients treat timeouts as misses behind a circuit breaker, the replica is promoted within seconds and the epoch bump reroutes traffic; without a replica, the database absorbs ≈ 45k extra reads/s.',
    'Lost invalidation: the delete after a database write fails or is never sent, so stale data lives until its TTL. Retry deletes, and drive invalidation from the database’s change stream (CDC) so a crashed app server cannot skip it.',
    'Stampede after mass expiry or a cold start: database load spikes as the hit rate collapses. Jittered TTLs, single-flight, leases and early refresh flatten it; warm a new cluster from an existing one and ramp traffic gradually.',
    'Hot key overload: one node’s CPU or network saturates while others idle, visible as per-node latency skew. Top-K sampling flags the key, and clients serve it from the near-cache or spread reads across replicated copies.',
    'Stale topology or a flapping node: a client on an old epoch writes to the wrong owner, and a node that drops out and returns has missed deletes. Nodes answer old-epoch requests with MOVED, and a rejoining node is flushed before taking traffic.',
  ],
  code: {
    label: 'TypeScript: consistent-hash ring with virtual nodes and a per-node LRU cache with TTLs',
    language: 'TypeScript',
    code: `import { createHash } from 'node:crypto';

/** Ring position. MD5 is for placement, not security: every client must compute the same value. */
export function hash32(text: string): number {
  return createHash('md5').update(text).digest().readUInt32BE(0);
}

/** Consistent hashing with virtual nodes: a membership change moves only ~1/N of the keys. */
export class HashRing {
  private points: { hash: number; node: string }[] = []; // sorted by hash
  private readonly nodes = new Set<string>();
  private readonly vnodes: number;

  constructor(nodes: Iterable<string> = [], vnodes = 160) {
    if (!Number.isInteger(vnodes) || vnodes < 1) throw new RangeError('vnodes must be >= 1');
    this.vnodes = vnodes;
    for (const node of nodes) this.add(node);
  }

  add(node: string): void {
    if (this.nodes.has(node)) return;
    this.nodes.add(node);
    for (let i = 0; i < this.vnodes; i++) this.points.push({ hash: hash32(node + '#' + i), node });
    // Break hash ties by name so every client builds the same ring whatever the join order.
    this.points.sort((a, b) => a.hash - b.hash || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0));
  }

  remove(node: string): void {
    if (this.nodes.delete(node)) this.points = this.points.filter((p) => p.node !== node);
  }

  /** Owner = first point clockwise from hash(key); past the last point, wrap to the first. */
  nodeFor(key: string): string {
    const h = hash32(key);
    let lo = 0;
    let hi = this.points.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if ((this.points[mid]?.hash ?? 0) < h) lo = mid + 1;
      else hi = mid;
    }
    const owner = this.points[lo] ?? this.points[0];
    if (owner === undefined) throw new Error('Ring has no nodes');
    return owner.node;
  }
}

/** One node's store. A Map iterates in insertion order, so its first key is the least recent. */
export class LruTtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();
  private readonly capacity: number;
  private readonly now: () => number;

  constructor(capacity: number, now: () => number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be >= 1');
    this.capacity = capacity;
    this.now = now;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    this.entries.delete(key);
    if (this.now() >= entry.expiresAt) return undefined; // lazy expiry: live while now < expiresAt
    this.entries.set(key, entry); // re-insert: now the most recently used
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    if (!(ttlMs > 0)) throw new RangeError('ttlMs must be > 0'); // also rejects NaN
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    for (const oldest of this.entries.keys()) {
      if (this.entries.size <= this.capacity) break;
      this.entries.delete(oldest);
    }
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  get size(): number {
    return this.entries.size;
  }
}`,
  },
  followUps: [
    {
      question: 'Why not just add database read replicas instead of a cache?',
      answer:
        'Each replica copies the entire dataset and re-executes queries against disk-backed storage, so serving 900k reads/s that way means many full copies, each with its own replication lag. A cache holds only the hot set in memory and answers key lookups in well under a millisecond. Replicas remain the better tool for complex queries, and many systems use both.',
    },
    {
      question: 'How do multi-key reads and cross-shard operations work?',
      answer:
        'A multi-get groups keys by owner and sends one batched request per node in parallel, so its latency is that of the slowest node and the fan-out grows with cluster size. Co-locating related keys helps: Redis Cluster’s hash tags hash only the {tag} part of a key, and multi-key commands work when all keys share a slot. Atomic operations across nodes are not offered; keep that state in the database.',
    },
    {
      question: 'How would you run the cache across multiple regions?',
      answer:
        'Run an independent cluster in each region next to that region’s database replicas instead of one cluster spanning regions. Drive invalidations from the replication stream: when a region’s replica applies a write, a process tailing its commit log deletes the key from the local cache, so an invalidation never arrives before the data it protects. The 2013 Facebook memcache paper describes this approach.',
    },
  ],
};
