import type { SystemDesignQuestion } from '../../types/system-design';

export const inMemoryDatabase: SystemDesignQuestion = {
  slug: 'in-memory-database',
  title: 'Design an in-memory key-value database with transactions',
  difficulty: 'Easy',
  companies: ['OpenAI', 'Anthropic'],
  prompt:
    'We will build an in-memory key-value database in levels. Level 1: SET, GET, DELETE and SCAN by key prefix. Level 2: per-key TTL. Level 3: nested transactions with BEGIN, COMMIT and ROLLBACK. Level 4: durability and scaling. Assume 100 million keys of ~30 bytes with ~200-byte values, 100,000 operations per second and 30% writes.',
  signals: [
    'Gets a correct, tested core working first, then extends it level by level without rewriting it.',
    'Models nested transactions precisely: reads see the innermost uncommitted write, deletes are tombstones and COMMIT merges into the parent level, not straight into the store.',
    'Treats time as an input: TTL against an injected clock with an exact expiry boundary, plus a sweep so keys nobody reads still release their memory.',
    'Explains durability and scaling through concrete trade-offs: fsync policy, snapshots and log compaction, replication and hash partitioning.',
  ],
  requirements: {
    functional: [
      'SET key value, GET key and DELETE key, where DELETE reports whether a live key was removed.',
      'SCAN prefix returns every live key that starts with the prefix, with its value, sorted by key.',
      'SET accepts an optional TTL in milliseconds; an expired key behaves exactly like a missing one.',
      'BEGIN, COMMIT and ROLLBACK nest to any depth; COMMIT or ROLLBACK with no open transaction returns an error.',
      'Committed writes survive a restart, within the loss window of the configured fsync policy.',
    ],
    nonFunctional: [
      'Single-key commands run in O(1) average time, with p99 well under 1 ms at the server.',
      'Every command is atomic, and a transaction’s writes stay invisible to other clients until its outermost COMMIT.',
      'Memory is bounded: past a configured limit the store evicts keys or rejects writes instead of crashing.',
      'Durability is configurable, from none (a pure cache) to losing at most about one second of writes.',
    ],
    outOfScope: [
      'Rich data types (lists, sets, sorted sets) and server-side scripting.',
      'Secondary indexes and queries other than exact key and key prefix.',
      'Transactions that span shards: once partitioned, a transaction may only touch keys on one shard.',
    ],
  },
  estimates: [
    'Memory: 100M keys × (~30 B key + ~200 B value + ~70 B hash-table, TTL and allocator overhead) ≈ 30 GB, which fits on one large machine.',
    'CPU: 1 s ÷ 100,000 ops ≈ 10 µs per command on one thread. A hash lookup is far cheaper than that, so network I/O and parsing dominate, not the data structure.',
    'Log volume: 30% × 100,000 = 30,000 writes/s × ~250 B per record ≈ 7.5 MB/s ≈ 650 GB/day, so the log must be compacted rather than kept forever.',
    'fsync per write: assuming ~1 ms per fsync, one thread completes ~1,000 durable writes/s, far below 30,000/s, so use group commit or fsync once per second.',
    'Recovery: loading a 30 GB snapshot at ~500 MB/s takes ≈ 60 s plus log replay, which is why failing over to a warm replica beats waiting for a restart.',
    'Growth to 10×: 300 GB ÷ ~25 GB of data per 64 GB node (headroom for snapshot copy-on-write and fragmentation) ≈ 12 primaries, each with a replica.',
  ],
  api: `SET key value [PX ttl_ms]  -> OK
                           -> ERR invalid TTL            (ttl_ms must be > 0)
GET key                    -> value | (nil)              (missing or expired)
DELETE key                 -> 1 if a live key was removed, else 0
SCAN prefix                -> [[key, value], ...]        (live keys, sorted by key)

BEGIN                      -> OK                         (opens a nested level)
COMMIT                     -> OK                         (merges into the parent level)
                           -> ERR NO TRANSACTION
ROLLBACK                   -> OK                         (discards the innermost level)
                           -> ERR NO TRANSACTION

Text protocol over TCP, one connection per client. Transaction levels belong to the
connection, and GET or SCAN inside a transaction sees the writes of its own connection.`,
  dataModel: `data             hash map: key -> entry                      committed state
  value       string
  expires_at  int64      absolute epoch ms, or never when the key has no TTL

txn_layers       per connection: stack of hash maps, one per open BEGIN
  key -> entry | TOMBSTONE                                   writes made at that level

append-only log  one checksummed record per committed write or outermost COMMIT
  seq  ops [(SET | DEL, key, value, expires_at), ...]  crc32

snapshot         point-in-time dump of data plus the log seq it covers

GET checks the innermost layer, then the outer layers, then data. The first hit wins, and
a TOMBSTONE or an expired entry there means missing. Absolute deadlines make replay exact.`,
  architecture: {
    diagram: `       Clients (client library: key -> hash slot -> shard)
                  |
                  v
 +------------------------------------+  async replication
 |  Shard primary: one event loop     |--------------------+
 |  parse -> execute -> reply         |                    |
 |  per-connection txn layer stacks   |                    v
 +-----+------------+-------------+---+          +-------------------+
       |            |             |              |  Replica          |
       v            v             v              |  reads, failover  |
 +-----------+ +-----------+ +-----------+       +-------------------+
 | Hash      | | TTL sweep | | AOF       |
 | table     | | (timer)   | | buffer    |
 +-----------+ +-----------+ +-----+-----+
                                   | write, fsync every 1 s
                                   v
                    +------------------------------+
                    |  Disk: snapshot + AOF log    |
                    +------------------------------+`,
    flow: [
      'The client library hashes the key to a slot and sends the command to the shard primary that owns that slot.',
      'The primary’s single event loop parses each command and runs it to completion before reading the next, so every command is atomic without locks.',
      'Inside a transaction, writes go to the connection’s innermost layer; GET checks the layers from the innermost outward and then the hash table, treating expired entries as missing.',
      'Each committed write, or a whole outermost COMMIT as one record, goes to the AOF buffer, which is written to disk and fsynced every second; periodic snapshots let old log segments be dropped.',
      'The same write stream flows asynchronously to the replica for reads and failover, while a timer-driven TTL sweep reclaims expired keys that nobody reads.',
    ],
  },
  deepDives: [
    {
      heading: 'Nested transactions as a stack of write-sets',
      points: [
        'BEGIN pushes an empty hash map. SET and DELETE write only to the top map, and DELETE stores a tombstone so it can hide a value that still exists in an outer level or in committed data.',
        'GET walks the stack from the innermost map outward, then reads committed data. The first hit wins, so a tombstone or an expired write there means missing even if an older value exists below.',
        'COMMIT pops the top map and writes each entry into the parent level, or into the data if it was the outermost, so a later outer ROLLBACK still undoes it. ROLLBACK is O(1); COMMIT is O(writes).',
        'The alternative is an undo log: apply writes in place and record old values to restore on rollback. Reads get cheaper, but other clients see uncommitted values unless writes also take locks.',
      ],
    },
    {
      heading: 'TTL: lazy and active expiry',
      points: [
        'Store an absolute deadline computed at SET time (now + ttl) from an injected clock, so tests can hit the boundary exactly: a key set at t with a 100 ms TTL is visible at t + 99 and gone at t + 100.',
        'Lazy expiry: every read compares the deadline with the clock and deletes the key once it has passed, so an expired key is never returned and costs nothing until touched.',
        'Lazy expiry alone leaks memory for keys nobody reads again, so a timer also sweeps. Redis samples keys that have a TTL and repeats while many in the sample are expired; a resumable cursor with a per-tick budget also works.',
        'Only the primary decides expiry: the log and the replication stream carry absolute deadlines and explicit deletes, so replicas and replays agree. The Redis replication docs describe the same rule: replicas wait for the primary’s DEL.',
        'With transactions, the TTL runs from the SET, not the COMMIT, and ROLLBACK restores the previous entry with its original deadline, so it can never resurrect a value that has already expired.',
      ],
    },
    {
      heading: 'Durability: append-only log, snapshots and recovery',
      points: [
        'Append each committed write to a log. An outermost COMMIT becomes one checksummed record, so recovery never applies half a transaction and a torn final record is detected and dropped.',
        'The fsync policy sets the loss window; Redis names the three options appendfsync always, everysec and no. Always is bounded by the disk sync rate, everysec can lose about a second, and no leaves flushing to the OS, risking tens of seconds.',
        'Snapshots bound recovery time: fork, and let the child write the dataset while copy-on-write keeps the parent serving. Heavy writes during a snapshot duplicate pages, so keep memory headroom.',
        'Compaction: once a snapshot covers the log up to position N, older segments are deleted (or the log is rewritten from the current state), so the log grows with recent writes, not with history.',
        'Recovery loads the newest snapshot, then replays the log after its position; because deadlines are absolute, keys that expired while the process was down stay expired.',
      ],
    },
    {
      heading: 'Concurrency, memory limits and scaling out',
      points: [
        'One thread runs commands one at a time, so each command is atomic with no locks, deadlocks or contention, and I/O multiplexing (epoll) serves thousands of connections. The catch: one slow command, such as a huge SCAN, stalls every client.',
        'Fine-grained locking would use more cores per node, but nested transactions then need lock ordering or MVCC, which is much harder to get right; adding more single-threaded shards scales out more simply.',
        'At the memory limit, evict instead of crashing: approximate LRU or LFU by sampling a few keys and evicting the best candidate, which avoids a global linked list. The Redis docs describe their LRU and LFU policies as sampled approximations.',
        'Replicas receive the write stream asynchronously for read scaling and failover. A promoted replica can miss the last writes; waiting for replica acknowledgments (Redis WAIT) narrows that gap but does not close it.',
        'Hash partitioning adds capacity: Redis Cluster maps CRC16(key) mod 16,384 to slots owned by shards, and hash tags such as {user:42} pin related keys to one slot so a transaction can use them together.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Transaction representation',
      choice: 'Stack of write-sets with tombstones',
      rationale:
        'Uncommitted writes never touch shared state and ROLLBACK is O(1). An undo log makes reads cheaper but exposes uncommitted values to other clients unless writes take locks.',
    },
    {
      decision: 'Concurrency model',
      choice: 'One single-threaded command loop per shard',
      rationale:
        'Atomic commands with no locks or deadlocks, and simple code. Multi-threaded execution with fine-grained locks uses more cores but makes transactions and debugging much harder; scale out with shards instead.',
    },
    {
      decision: 'Expiry',
      choice: 'Lazy check on every read + budgeted background sweep',
      rationale:
        'Reads never return expired data and idle keys are still reclaimed. A deadline-ordered index reclaims exactly on time but costs memory and O(log n) work on every SET with a TTL.',
    },
    {
      decision: 'Durability',
      choice: 'Append-only log fsynced every second + periodic snapshots',
      rationale:
        'Loses at most about a second of writes at full throughput. An fsync per write caps throughput at the disk sync rate, and snapshots alone could lose minutes of writes.',
    },
    {
      decision: 'Partitioning',
      choice: 'Hash slots (key -> slot -> shard)',
      rationale:
        'Spreads load evenly and rebalances in small slot-sized units. Range partitioning would keep a prefix SCAN on few shards but turns sequential keys into hot spots.',
    },
  ],
  failureModes: [
    'Process crash: with fsync every second, up to about a second of acknowledged writes is lost. Recovery loads the snapshot, replays the log and truncates a torn final record found by its checksum.',
    'Out of memory: without a limit the OS kills the process. Set a memory limit with LRU or LFU eviction when used as a cache, or reject writes with an error when data must not be dropped.',
    'Snapshot fork under heavy writes: copy-on-write can approach double the memory, and fork itself briefly pauses a large process. Keep headroom or take snapshots on a replica.',
    'Primary failure: promote a replica via a sentinel process or a vote among the cluster nodes. Writes not yet replicated are lost, which is fine for a cache but must be documented for anything else.',
    'Slow command: a SCAN over millions of keys blocks every client of a single-threaded shard. Page with a cursor and a per-call limit, and log slow commands so they can be found.',
  ],
  code: {
    label:
      'TypeScript: nested transactions with tombstones, TTL on an injected clock and a budgeted expiry sweep',
    language: 'TypeScript',
    code: `type Entry = { value: string; expiresAt: number }; // live while now < expiresAt (Infinity: no TTL)
type Slot = Entry | null; // null is a tombstone: deleted inside an open transaction

export class KVStore {
  private readonly data = new Map<string, Entry>(); // committed state
  private readonly layers: Map<string, Slot>[] = []; // one write-set per open transaction
  private readonly now: () => number;
  private cursor: Iterator<[string, Entry]> | null = null;

  constructor(now: () => number) {
    this.now = now;
  }

  get(key: string): string | undefined {
    return this.lookup(key)?.value;
  }

  set(key: string, value: string, ttlMs = Infinity): void {
    if (!(ttlMs > 0)) throw new RangeError('TTL must be a positive number of milliseconds');
    this.write(key, { value, expiresAt: this.now() + ttlMs });
  }

  delete(key: string): boolean {
    if (this.lookup(key) === undefined) return false;
    this.write(key, null);
    return true;
  }

  scan(prefix: string): [string, string][] {
    const view = new Map<string, Slot>();
    for (const source of [this.data, ...this.layers]) {
      for (const [key, slot] of source) if (key.startsWith(prefix)) view.set(key, slot);
    }
    const now = this.now();
    const rows: [string, string][] = [];
    for (const [key, slot] of view) if (slot && slot.expiresAt > now) rows.push([key, slot.value]);
    return rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  }

  begin(): void {
    this.layers.push(new Map());
  }

  /** Merges the innermost write-set into its parent; only the outermost COMMIT reaches data. */
  commit(): void {
    const top = this.layers.pop();
    if (top === undefined) throw new Error('NO TRANSACTION');
    for (const [key, slot] of top) this.write(key, slot);
  }

  rollback(): void {
    if (this.layers.pop() === undefined) throw new Error('NO TRANSACTION');
  }

  /** Active expiry for keys nobody reads: checks up to budget keys, resuming where it stopped. */
  sweep(budget: number): number {
    const now = this.now();
    let removed = 0;
    for (let i = 0; i < budget; i++) {
      const next = (this.cursor ??= this.data.entries()).next();
      if (next.done) this.cursor = null; // end of a pass: the next step starts a new one
      else if (next.value[1].expiresAt <= now && this.data.delete(next.value[0])) removed++;
    }
    return removed;
  }

  private lookup(key: string): Entry | undefined {
    const now = this.now();
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const slot = this.layers[i]?.get(key);
      // An expired or deleted write inside a transaction still hides older values below it.
      if (slot !== undefined) return slot && slot.expiresAt > now ? slot : undefined;
    }
    const entry = this.data.get(key);
    if (entry && entry.expiresAt <= now) this.data.delete(key); // lazy expiry on read
    return entry && entry.expiresAt > now ? entry : undefined;
  }

  private write(key: string, slot: Slot): void {
    const top = this.layers.at(-1);
    if (top) top.set(key, slot);
    else if (slot === null) this.data.delete(key);
    else this.data.set(key, slot);
  }
}`,
  },
  followUps: [
    {
      question: 'How does this compare with Redis MULTI/EXEC?',
      answer:
        'Redis queues commands after MULTI and runs them atomically at EXEC, but it has no rollback: if one command fails at run time the others still apply, and DISCARD only drops the queue before EXEC. The Redis docs say rollback was left out because it would hurt simplicity and performance. MULTI cannot nest, and WATCH adds optimistic concurrency by aborting EXEC if a watched key changed.',
    },
    {
      question: 'How do you isolate concurrent clients that each run transactions?',
      answer:
        'Give each connection its own layer stack and record the version of every key it reads. At the outermost COMMIT the single-threaded loop checks that none of those versions changed and applies the write-set atomically; otherwise it aborts and the client retries. Like Redis WATCH, this optimistic scheme never blocks other clients.',
    },
    {
      question: 'How would you make SCAN efficient on a large keyspace?',
      answer:
        'The sample scans the whole hash table and sorts the matches, which is O(n + k log k). Keep an ordered index such as a skip list beside the hash table so a prefix becomes a range seek costing O(log n + k), and return pages with a cursor (the last key returned) so no call blocks the loop. With hash partitioning, fan out to every shard and merge the sorted pages.',
    },
  ],
};
