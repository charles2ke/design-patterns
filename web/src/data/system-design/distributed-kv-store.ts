import type { SystemDesignQuestion } from '../../types/system-design';

export const distributedKvStore: SystemDesignQuestion = {
  slug: 'distributed-kv-store',
  title: 'Design a distributed key-value store (Dynamo-style)',
  difficulty: 'Hard',
  companies: ['Google', 'Amazon', 'Apple', 'LinkedIn'],
  prompt:
    'Design a distributed key-value store in the spirit of Amazon’s Dynamo: get(key) and put(key, value) on a cluster of commodity servers that must stay writable through node failures and network partitions. Assume 10 TB of data in 1 KB records and peaks of 300,000 reads/s and 100,000 writes/s.',
  signals: [
    'Starts from the always-writable requirement and derives leaderless replication, quorums and conflict handling from it instead of reciting Dynamo features.',
    'Explains why R + W > N makes read and write quorums overlap, and exactly how sloppy quorums with hinted handoff give up that overlap to stay writable.',
    'Handles concurrent writes rigorously: vector clocks to detect them, siblings with application merge, and the silent data loss of last-write-wins under concurrency and clock skew.',
    'Closes the loop on convergence and node internals: read repair, Merkle-tree anti-entropy, gossip membership and an LSM storage engine sized with real numbers.',
  ],
  requirements: {
    functional: [
      'get(key) returns the value, or every concurrent sibling version, plus an opaque context carrying their merged vector clock.',
      'put(key, value, context) stores a version that supersedes everything named in the context; delete writes a tombstone the same way.',
      'Tunable consistency per request: callers choose R and W within the replication factor N configured per keyspace.',
      'Nodes can be added and removed online, moving only the affected key ranges.',
    ],
    nonFunctional: [
      'Always writable: with sloppy quorums a put succeeds whenever any W healthy nodes from the key’s extended preference list respond, even during a partition.',
      'Tail latency: p99.9 under ~20 ms for single-key operations inside a region; the Dynamo paper also states its SLAs at the 99.9th percentile.',
      'Durable: an acknowledged write sits in at least W nodes’ write-ahead logs, and background repair restores all N copies.',
      'Decentralized: no leader or master; every node runs the same code, any node can accept a request, and capacity grows by adding nodes.',
    ],
    outOfScope: [
      'Multi-key transactions, range scans and secondary indexes (hashing destroys key order).',
      'Linearizable reads and compare-and-set, which need consensus per key range (a follow-up).',
      'Values over 1 MB; large objects belong in a blob store, with a pointer kept here.',
    ],
  },
  estimates: [
    'Keys: 10 TB ÷ 1 KB ≈ 10 billion keys; with N = 3 replicas the cluster stores 30 TB.',
    'Nodes: capping each node at ~1 TB of data (half of a 2 TB NVMe drive, leaving compaction headroom) gives 30 TB ÷ 1 TB = 30 nodes, each holding ≈ 1 billion key replicas.',
    'Replica load: writes go to all 3 replicas and reads ask all 3 and wait for 2, so (300K + 100K) × 3 = 1.2M replica ops/s ÷ 30 nodes ≈ 40K ops/s per node; disk capacity, not throughput, sets the node count.',
    'Write bandwidth: 100K writes/s × 1 KB × 3 = 300 MB/s ≈ 10 MB/s per node; assuming ~10× compaction write amplification, each disk absorbs ≈ 100 MB/s, so compaction needs its own I/O budget.',
    'Bloom filters: 1 billion keys × 10 bits ≈ 1.25 GB of RAM per node for a ≈ 1% false-positive rate, so most lookups for absent keys never touch the disk.',
    'Rebuild: if the 29 survivors each stream 50 MB/s, a dead node’s 1 TB is re-replicated in 1 TB ÷ 1.45 GB/s ≈ 11.5 min, versus ≈ 2–3 h when 2–3 ring neighbors carry it alone; virtual nodes enable the parallel case.',
  ],
  api: `GET /v1/kv/{key}?r=2                       (r and w default to the keyspace setting)
-> 200 OK                KV-Context: <opaque merged vector clock>     body: value
-> 300 Multiple Choices  KV-Context: <merged clock of all siblings>
   { "siblings": ["<base64 value>", "<base64 value>", null] }   (null = concurrent delete)
-> 404 Not Found (no version, or only a tombstone)
-> 503 Service Unavailable (fewer than R replicas answered before the deadline)

PUT /v1/kv/{key}?w=2
KV-Context: <context from the preceding GET>        (omitted only for a brand-new key)
body: value bytes (<= 1 MB)
-> 204 No Content        KV-Context: <clock of the stored version>
-> 503 Service Unavailable (fewer than W acks; the write may still exist on some
   replicas and is not rolled back)

DELETE /v1/kv/{key}      KV-Context: <context>    -> 204 (stores a tombstone version)

Internal RPCs between nodes
ReplicaPut(key, value, clock, hintFor?)   -> ack after the commit-log append
ReplicaGet(key)                           -> every local sibling with its clock
SyncRange(range, treeLevel, hashes)       -> differing subtrees (Merkle anti-entropy)
Gossip(node -> generation, heartbeat, status, tokens)    every second, random peer`,
  dataModel: `replica store    one LSM tree per node; rows sorted by token, so a key range is one scan
  key          bytes          token = 64-bit Murmur3(key) places it on the ring
  siblings     list           1+ concurrent versions, each { value | tombstone, clock }
  clock        map            node -> (counter, last-update time); past ~10 entries the
                              oldest is dropped, as the Dynamo paper suggests
  written_at   timestamp      per version; a tombstone is purged after the grace period
  write path: commit log (WAL) -> sorted memtable in RAM -> flush to an immutable SSTable
  each SSTable: sorted rows + sparse index + Bloom filter; compaction merges SSTables

hints            separate local store on a stand-in node
  target_node  string         replica that should have received the write
  key, version                replayed to target_node once gossip reports it alive

ring_state       gossiped; every node keeps a full copy
  node_id      uuid           stable identity
  generation   int64          set at process start; a newer generation wins
  heartbeat    int64          bumped every second by the owning node
  tokens       int64[]        virtual-node positions on the ring
  status       enum           JOINING | NORMAL | LEAVING (liveness is judged locally)

Every client operation is a single-key read or write located by hashing the key, so a
request touches at most N replicas (plus stand-ins during failures) and never scans.`,
  architecture: {
    diagram: `Client library: hash(key) -> token -> preference list [A, B, C, D, ...]
  |
  | put(key, value, context) / get(key)
  v
+---------------------+   replicate    +---------------------+
| Node A: coordinator |--------------->| Node B: replica 2   |
| and replica 1       |<-------------->| WAL, memtable,      |
| WAL, memtable,      |  Merkle-tree   | SSTables + Bloom    |
| SSTables + Bloom    |  anti-entropy  +---------------------+
+---------------------+
  |       ^
  |       | gossip every second: ring state and heartbeats
  |       v
  |     all other nodes
  |
  | C is down: its copy goes to the next healthy node, with a hint
  v
+---------------------+ hinted handoff +---------------------+
| Node D: stand-in,   |--------------->| Node C: replica 3   |
| holds hint for C    | when C is back | (down)              |
+---------------------+                +---------------------+`,
    flow: [
      'The client library hashes the key to a token and sends the request to A, the first healthy node in the key’s preference list, which coordinates it; any node can forward requests from clients that are not token-aware.',
      'Put: A increments its own entry in the context’s vector clock, appends the version to its WAL and memtable and sends it to replicas B and C, acknowledging once W = 2 replicas, A included, have logged it.',
      'C is down, so A sends C’s copy to D, the next healthy node in the preference list, with a hint naming C; D hands the write to C once gossip reports C back, then deletes the hint.',
      'Get: A asks the first N healthy nodes for their versions, waits for R = 2 answers, drops versions dominated by another clock and returns the surviving siblings with a merged context, read-repairing replicas that answered stale.',
      'In the background, A and B compare Merkle trees for each shared key range and stream only the differing keys, while every node gossips ring state and heartbeats with a random peer each second to decide whom to route around.',
    ],
  },
  deepDives: [
    {
      heading: 'Partitioning, replication and membership',
      points: [
        'Hash each key to a 64-bit token on a ring; each node owns the ranges ending at its tokens. Adding or removing a node moves only about 1/n of the data, whereas hash(key) mod n would remap almost every key.',
        'Each physical node takes many tokens (virtual nodes), evening out load and spreading a dead node’s ranges over many peers. More tokens mean more ranges to repair, so Cassandra 4.0 cut its default from 256 to 16 per node, paired with a balancing token allocator.',
        'The preference list walks clockwise from the key’s token, skipping nodes already chosen, so the N replicas land on N distinct machines, ideally in different racks or zones. Nodes beyond the first N are the stand-ins for sloppy quorums.',
        'Membership spreads by gossip: every second each node exchanges versioned ring state and heartbeats with a random peer, reaching all nodes in O(log n) rounds. A generation number set at process start lets peers discard stale state from a node’s previous incarnation.',
        'Failure detection is local and soft: a node that stops answering is routed around (Cassandra uses a phi-accrual detector on gossip heartbeats), but only an explicit operator command adds or removes a node, so a flapping network never triggers mass data movement.',
      ],
    },
    {
      heading: 'Quorums, sloppy quorums and hinted handoff',
      points: [
        'A put succeeds once W of the N replicas acknowledge it, a get once R replicas answer. With R + W > N every read quorum overlaps every write quorum, so a read always reaches a replica holding the latest acknowledged write.',
        'N = 3, R = W = 2 tolerates one failed or slow replica on both paths, and latency is set by the second-fastest replica. Callers tune R and W per request; R + W ≤ N trades stale reads for latency.',
        'A strict quorum fails a put when fewer than W home replicas respond. A sloppy quorum uses the first N healthy nodes in the preference list instead; a stand-in stores the write with a hint naming the owner and replays it when the owner recovers.',
        'That breaks the overlap guarantee: during a partition, the W nodes that acknowledged a write (some of them stand-ins) and the R nodes answering a read can be disjoint, and such a read misses the write until handoff or repair completes.',
        'Cassandra counts hints toward a write only at consistency level ANY, while Riak counts fallback nodes unless PR or PW demand primaries. Even strict quorums are not linearizable: a put that fails short of W acks is not rolled back and may surface later.',
      ],
    },
    {
      heading: 'Versioning: vector clocks, siblings and last-write-wins',
      points: [
        'Each version carries a vector clock of (node, counter) pairs. The coordinator adds one to its own entry in the context the client read, so the new version descends from exactly what that client saw; two clocks that are each ahead somewhere are concurrent.',
        'Concurrent versions survive as siblings. The application merges them, say a set union for a shopping cart, and writes back with the merged context to supersede them all; the Dynamo paper notes an add is never lost, but deleted items can resurface.',
        'Last-write-wins keeps only the highest timestamp: no siblings, but one of two concurrent writes silently vanishes, and a write stamped by a lagging clock loses to an older one. Cassandra resolves every cell this way, which is safe for write-once data.',
        'Plain clocks break when two writes from one context reach the same coordinator: they get equal clocks, or one seems to descend from the other, and a write vanishes. Dotted version vectors (Riak 2.0) tag each sibling with its (node, counter) event, so both survive.',
        'Clocks stay small because one of a key’s top N nodes usually coordinates its writes. The Dynamo paper still drops the oldest pair once a clock reaches a threshold (say 10), accepting that descendant relationships may then be misjudged.',
      ],
    },
    {
      heading: 'Convergence and the LSM storage engine',
      points: [
        'Read repair: after reconciling R answers, the coordinator writes the surviving siblings back to replicas that answered stale (and to late responders), so frequently read keys converge on the read path.',
        'Anti-entropy covers keys nobody reads: replicas of a key range compare Merkle trees, hashes of hashes over the range’s keys, descending only into subtrees whose hashes differ. Traffic scales with the differences; the Dynamo paper keeps one tree per virtual-node range.',
        'Write path: append to the commit log (WAL), apply to a sorted in-memory memtable and acknowledge; full memtables flush to immutable, sorted SSTables. Each replica stores a key’s whole sibling set, so a replica put is a local read-reconcile-write, unlike Cassandra’s blind writes.',
        'Read path: memtable first, then SSTables from newest to oldest, stopping at the first hit. A Bloom filter per SSTable (~10 bits per key, ≈ 1% false positives) skips files that cannot hold the key, and background compaction merges SSTables and drops superseded versions.',
        'Deletes write tombstones that must outlive the longest tolerated outage plus a full repair cycle (Cassandra’s gc_grace_seconds); purge them sooner and anti-entropy copies the deleted value back from a replica that missed the delete.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Consistency model',
      choice: 'Leaderless replication with tunable quorums (N = 3, R = W = 2 by default)',
      rationale:
        'Any replica can take writes during failures and partitions, and callers trade latency for freshness per request. Consensus per shard (Raft or Paxos) is linearizable, but the minority side of a partition cannot write.',
    },
    {
      decision: 'Conflict resolution',
      choice: 'Vector clocks, siblings and application-level merge',
      rationale:
        'Concurrent writes are detected and kept for the application to merge. Last-write-wins is simpler but silently drops one of two concurrent writes and depends on synchronized clocks, so offer it only per keyspace for immutable data.',
    },
    {
      decision: 'Partitioning',
      choice: 'Consistent hashing with virtual nodes',
      rationale:
        'Even load and incremental rebalancing without a central directory. Range partitioning would allow scans, but it needs split and merge logic plus a routing directory, and sequential keys create hot ranges.',
    },
    {
      decision: 'Writes during failures',
      choice: 'Sloppy quorum plus hinted handoff',
      rationale:
        'Puts keep succeeding while home replicas are down, at the cost of the R + W > N overlap until handoff finishes. Strict quorums keep the guarantee but return errors exactly when the cluster is degraded.',
    },
    {
      decision: 'Storage engine',
      choice: 'LSM tree: WAL, memtable, SSTables, Bloom filters and compaction',
      rationale:
        'Turns random writes into sequential I/O for a write-heavy store. B-tree engines read with less amplification but pay for random in-place writes; the Dynamo paper describes pluggable engines such as Berkeley DB and MySQL.',
    },
  ],
  failureModes: [
    'Node crash or partition: coordinators route around the node after timeouts, and stand-ins take its writes with hints, replayed on its return. After an outage longer than the hint window (3 h by default in Cassandra), a Merkle repair of its ranges catches it up.',
    'Permanent disk loss: once an operator removes or replaces the node, its ranges stream from the surviving replicas in parallel, thanks to virtual nodes. Until then those ranges have only two copies, so alert immediately; the estimate puts a full rebuild at ≈ 11.5 min.',
    'Sibling explosion: clients that write without a context, or retry blindly, add a sibling per write until reads slow down. Client libraries always send the context from the preceding read, and the store alerts on, then caps, siblings per key.',
    'Hot key: one key’s N replicas saturate no matter how big the cluster is; coordinators spot it by sampling top keys. Cache hot reads in clients or a front cache, and split hot write keys into sub-keys merged on read.',
    'Resurrected deletes: a replica down longer than the tombstone grace period misses a delete, and once tombstones are purged anti-entropy copies the old value back. Run a full repair within every grace period, and wipe and rebuild nodes that were down longer.',
  ],
  code: {
    label: 'TypeScript: vector clocks and quorum-read reconciliation of sibling versions',
    language: 'TypeScript',
    code: `/** Vector clock: node id -> number of writes that node coordinated. A missing entry means 0. */
export type Clock = ReadonlyMap<string, number>;
export type Ordering = 'before' | 'after' | 'equal' | 'concurrent';

export interface Versioned<T> {
  value: T; // a delete is stored as a tombstone value so it can win against older versions
  clock: Clock;
}

/** 'before': a happened-before b, so b supersedes a. 'concurrent': neither saw the other. */
export function compare(a: Clock, b: Clock): Ordering {
  let aAhead = false;
  let bAhead = false;
  for (const node of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(node) ?? 0;
    const y = b.get(node) ?? 0;
    if (x > y) aAhead = true;
    if (y > x) bAhead = true;
  }
  if (aAhead && bAhead) return 'concurrent';
  if (aAhead) return 'after';
  return bAhead ? 'before' : 'equal';
}

/**
 * The coordinator bumps its own entry on the client's context. Two writes from one context via
 * one coordinator would get equal clocks; dotted version vectors (Riak 2.0) keep them apart.
 */
export function increment(clock: Clock, node: string): Clock {
  return new Map(clock).set(node, (clock.get(node) ?? 0) + 1);
}

/** Pointwise max: the smallest clock that descends from both inputs. */
export function merge(a: Clock, b: Clock): Clock {
  const out = new Map(a);
  for (const [node, n] of b) out.set(node, Math.max(n, out.get(node) ?? 0));
  return out;
}

/**
 * Reconciles the versions returned by R replicas (each may already hold several siblings).
 * Keeps only versions no other version dominates; equal clocks are the same write seen on
 * several replicas, so one copy survives. Invariant: kept stays pairwise concurrent.
 */
export function reconcile<T>(responses: readonly (readonly Versioned<T>[])[]): Versioned<T>[] {
  let kept: Versioned<T>[] = [];
  for (const v of responses.flat()) {
    const orders = kept.map((k) => compare(v.clock, k.clock));
    if (orders.some((o) => o === 'before' || o === 'equal')) continue; // stale or duplicate
    kept = kept.filter((_, i) => orders[i] !== 'after'); // v supersedes these
    kept.push(v);
  }
  return kept;
}

/** Resolves with the first R replica answers; rejects once more than N - R replicas failed. */
export function awaitQuorum<T>(calls: readonly Promise<T>[], r: number): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // No early return: every call still gets a handler, so no rejection goes unhandled.
    const valid = Number.isInteger(r) && r >= 1 && r <= calls.length;
    if (!valid) reject(new RangeError('need 1 <= R <= N'));
    const answers: T[] = [];
    let failures = 0;
    for (const call of calls) {
      call.then(
        (answer) => {
          answers.push(answer);
          if (answers.length === r) resolve(answers.slice()); // copy: late answers stay out
        },
        () => {
          failures += 1;
          if (failures === calls.length - r + 1) reject(new Error('read quorum unavailable'));
        },
      );
    }
  });
}

export type ReplicaRead<T> = (key: string) => Promise<Versioned<T>[]>;

/** get(key): siblings plus a context; a put that carries the context supersedes all of them. */
export async function quorumGet<T>(replicas: readonly ReplicaRead<T>[], key: string, r: number) {
  // Each replica call carries its own deadline in production, so a hung node counts as a failure.
  const answers = await awaitQuorum(replicas.map(async (read) => read(key)), r);
  const siblings = reconcile(answers);
  const context = siblings.reduce<Clock>((acc, v) => merge(acc, v.clock), new Map());
  return { siblings, context };
}`,
  },
  followUps: [
    {
      question: 'How would you offer strong consistency, such as compare-and-set or linearizable reads?',
      answer:
        'Run a Raft or Multi-Paxos group per key range: the leader commits each write on a majority and serves linearizable reads under a lease. The 2022 DynamoDB paper describes a Multi-Paxos group per partition, and Cassandra offers Paxos-based lightweight transactions for compare-and-set. The price is a hop to the leader and no writes on a partition’s minority side.',
    },
    {
      question: 'How do you add a node without downtime?',
      answer:
        'The new node picks tokens, gossips itself as JOINING and streams its future ranges from their current owners, while coordinators also send it new writes for those ranges. Once streaming finishes it turns NORMAL and serves reads, and the previous owners drop data they no longer own; only about 1/(n + 1) of the data moves.',
    },
    {
      question: 'How would you replicate across regions?',
      answer:
        'Make the preference list topology-aware, say three replicas per region, and use local quorums (Cassandra’s LOCAL_QUORUM) so requests never wait on cross-region links while remote replicas receive writes asynchronously. Vector clocks flag cross-region conflicts like any other concurrent writes; the Dynamo paper already spread preference lists across data centers to survive a data-center outage.',
    },
  ],
};
