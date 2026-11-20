import type { SystemDesignQuestion } from '../../types/system-design';

export const collaborativeEditor: SystemDesignQuestion = {
  slug: 'collaborative-editor',
  title: 'Design a collaborative document editor (Google Docs)',
  difficulty: 'Hard',
  companies: ['Google', 'Microsoft'],
  prompt:
    'Design a real-time collaborative editor like Google Docs: several people edit one document at once, see each other’s changes and cursors within a fraction of a second, and all copies converge to the same text. Support offline editing, comments, version history and sharing. Assume 50 million daily active users, ~5 million documents open at peak and one to three active editors on most documents.',
  signals: [
    'Explains why naive concurrent edits diverge and chooses OT or a CRDT with a real correctness argument (convergence, preserved intent), not just a name.',
    'Specifies the client–server protocol precisely: revisions, one in-flight batch, rebasing local edits over remote ones and idempotent resends.',
    'Routes every session of a document to a single owner and fails over without split brain or losing acknowledged edits.',
    'Separates durable state (op log, snapshots, history) from ephemeral state (presence, cursors) and sizes each with numbers.',
  ],
  requirements: {
    functional: [
      'Several users edit the same document concurrently, see each other’s edits in real time, and every replica converges to the same content.',
      'Show who is in the document, with live cursors and selections.',
      'Keep editing while offline and merge the changes on reconnect without losing work.',
      'Comments anchored to text ranges that stay attached as the surrounding text changes.',
      'Version history (browse and restore earlier versions) and sharing with owner, editor, commenter and viewer roles.',
    ],
    nonFunctional: [
      'Local edits appear instantly; remote edits appear within ~200 ms at p95 for collaborators in the same region.',
      'Durability and convergence: an acknowledged edit is never lost, and replicas that have applied the same edits show identical text.',
      'A collaboration-server failure costs a few seconds of reconnecting, never data.',
      'Scale to ~5M concurrently open documents, with a cap of ~100 simultaneous editors per document (later joiners are read-only).',
    ],
    outOfScope: [
      'Rich layout such as tables, drawings, images and pagination (rich-text formatting is a follow-up).',
      'Search indexing and spelling or grammar suggestions.',
      'Importing and exporting other file formats.',
    ],
  },
  estimates: [
    'Connections: 5M open documents × ~2 sessions ≈ 10M concurrent WebSockets; at ~50K per edge server that is ≈ 200 edge servers.',
    'Edit rate: if 20% of sessions type at ~5 keystrokes/s, the peak is 10M × 0.2 × 5 = 10M ops/s overall, but a document with three typists sees only ~15 ops/s, so one owner can serve thousands of documents.',
    'Hot-document cap: 100 editors × 5 ops/s = 500 ops/s into one owner, and fanning each op out to the other 99 is ≈ 50K messages/s. With a 200 ms client round trip, each incoming op is transformed against ~100 concurrent ops.',
    'Op log: ~3M ops/s averaged over the day (about a third of the peak) × ~50 bytes ≈ 150 MB/s ≈ 13 TB/day, written as up to 10M small inserts/s at peak; old ops are eventually folded into snapshots, keeping periodic and named versions.',
    'Opening: a 100-page document is ≈ 300 KB of text (~3,000 characters per page). A snapshot every ~1,000 ops bounds a load to one snapshot plus at most ~1,000 ops; replaying all ~500K ops that typed it at ~1M ops/s would instead add 0.5 s.',
    'Owner memory: 5M open documents × ~200 KB average ≈ 1 TB of RAM, ≈ 10 GB on each of 100 collaboration servers, so every owner keeps its documents in memory.',
  ],
  api: `GET  /api/v1/docs/{docId}               -> 200 { rev, snapshot, role } | 403 | 404
GET  /api/v1/docs/{docId}/ops?after=120 -> 200 { ops: [{ rev: 121, ... }, ...] }
                                        -> 410 Gone if compacted: reload the snapshot

WebSocket wss://collab.example.com/v1/docs/{docId}?rev=120     (routed to the owner)
  server -> client  welcome   { site: 17 }, then replays every op after rev 120
  client -> server  submit    { site: 17, seq: 42, baseRev: 120, ops: [...] }
  server -> client  ack       { site: 17, seq: 42, rev: 121 }    to the author only
  server -> client  ops       { rev: 122, site, seq, ops }       to every other session
  both directions   presence  { cursor: 88, selection: [88, 95] }  relayed, never stored
  close codes       4001 reload (base revision unknown) | 4003 forbidden
                    4009 owner moved: reconnect
Each session gets a fresh site; an op keeps the site it was made with, and the owner
rejects a site issued to another user. An op that arrives with the site and seq of my
in-flight batch is its ACK, so a reconnecting client never applies its batch twice.

POST /api/v1/docs/{docId}/comments  { anchorRev, start, end, body }  -> 201 | 403
POST /api/v1/docs/{docId}/versions  { name }  -> 201, names the current revision
PUT  /api/v1/docs/{docId}/acl/{principal}  { role }  -> 200, applied to live sessions`,
  dataModel: `documents       strongly consistent store (Spanner/CockroachDB-style), keyed by doc_id
  doc_id        string    primary key
  owner_user    string    not null
  head_rev      int64     last committed revision
  snapshot_rev  int64     revision of the latest snapshot
  lease_epoch   int64     fencing token: raised by each new collaboration-server owner

doc_ops         append-only, interleaved under documents (same partition)
  doc_id, rev   PK        insert only if absent and lease_epoch matches (one transaction)
  site, seq     int64     identify the batch: a resend is ACKed again, never reapplied
  ops           bytes     the transformed batch, ~50 bytes per keystroke
  author_id, created_at

doc_sites       (doc_id, site) PK -> user_id; one row per session, checked on submit
doc_snapshots   (doc_id, rev) PK -> object-store blob, every ~1,000 ops
versions        (doc_id, version_id) PK, rev, name, created_by
comments        (doc_id, comment_id) PK, start, end, anchor_rev, thread, resolved
acl             (doc_id, principal) PK -> role; index on principal for "shared with me"

Opening a document reads one row, the latest snapshot and the ops after snapshot_rev.
The owner appends in revision order: every write is a single-partition conditional insert.`,
  architecture: {
    diagram: ` +--------------+   GET snapshot + rev    +----------------------+
 | Editor       |------------------------>| Doc API: ACL check,  |
 | (OT client)  |                         | reads snapshot + ops |
 +------+-------+                         +----------------------+
        | WebSocket: ops, ACKs, presence
        v
 +--------------+   owner of doc_id?      +----------------------+
 | Edge gateway |------------------------>| Ownership registry   |
 | auth, route  |                         | (etcd-like): doc ->  |
 +------+-------+                         | owner, server leases |
        | forward by doc_id               +----------------------+
        v
 +--------------------------------+
 | Collaboration server (owner)   |  in-memory text, revision
 | transform, order, fan-out,     |  counter, sessions, cursors
 | presence                       |
 +-------+----------------+-------+
         | append op      | every ~1,000 ops
         v                v
 +---------------+  +------------------+
 | Op log        |  | Snapshots and    |
 | (doc_id, rev) |  | version history  |
 +---------------+  +------------------+`,
    flow: [
      'The editor loads the document through the Doc API, which checks the ACL and returns its text at the current revision, built from the latest stored snapshot plus the ops after it.',
      'It opens a WebSocket to an edge gateway, which authenticates the session and looks up the document’s owner in the ownership registry; if no owner is alive, a server chosen by consistent hashing claims the document, raises its epoch and loads the snapshot and op-log tail.',
      'The client sends local edits as a batch tagged with its base revision. The owner transforms the batch against every op committed since then, appends it to the op log as the next revision, and only then ACKs the author and broadcasts it.',
      'Other clients transform their pending ops and the incoming op past each other, then apply it, so every replica passes through the same revisions and converges.',
      'Presence and cursors travel the same path but are relayed without being logged; the owner writes a snapshot every ~1,000 ops, and naming a version records its revision in version history.',
    ],
  },
  deepDives: [
    {
      heading: 'OT vs CRDTs',
      points: [
        'Concurrent edits conflict because positions shift: on "abcd", if Alice inserts X at 1 while Bob deletes position 3 (the "d"), applying Bob’s delete unchanged after Alice’s insert removes "c" instead. OT and CRDTs both fix this so replicas converge and each edit keeps its intent.',
        'Operational transformation rewrites an incoming op against concurrent ops already applied, shifting positions and breaking same-position ties by site ID. With a central server that totally orders ops, only TP1 must hold, apply(apply(d, a), T(b, a)) = apply(apply(d, b), T(a, b)), as in the Jupiter system (1995).',
        'OT without a central server usually needs TP2 too, and several published transformation functions were later shown to violate it. Google has publicly described using OT for Google Docs and Wave; the Wave OT whitepaper has each client wait for the server’s acknowledgment before sending more ops.',
        'CRDTs, such as the open-source Yjs and Automerge libraries, give every character a unique ordered ID, so concurrent inserts and deletes commute without transformation or a central sequencer, which suits offline-first and peer-to-peer sync. The cost is per-character metadata and tombstones for deleted text, which implementations work hard to compress.',
        'This design needs one owner per document anyway for ordering, permissions and durability, so OT with a central server is the simpler fit; a CRDT wins when replicas must merge without a server.',
      ],
    },
    {
      heading: 'Client protocol: in-flight batch, buffer and rebase',
      points: [
        'Each client tracks the last server revision it has applied, at most one in-flight batch (sent with that base revision, awaiting its ACK) and a buffer of newer local edits. Local edits apply immediately; when the ACK arrives, the buffer is composed into one batch and sent.',
        'For each remote op, the client transforms it past the in-flight and buffered ops (and them past it) before applying it, so its own unacknowledged edits stay on top. The server does the mirror image, transforming an incoming batch past everything committed since its base revision.',
        'With one batch in flight, each batch’s base revision already includes the client’s earlier batches, so the server transforms only against other clients’ ops and keeps one linear history. Composing keystrokes into one batch per round trip makes the limit invisible to typists.',
        'Revisions are contiguous and delivered in order over one connection, so a client that sees a gap knows it missed an op and resyncs from the op log instead of silently diverging.',
        'Offline edits pile up in the buffer and IndexedDB. On reconnect the owner replays missed ops (one with the client’s own site and seq is its ACK) and the client rebases and sends its edits; if those ops were compacted, it reloads the snapshot and offers a three-way merge.',
      ],
    },
    {
      heading: 'Document ownership, routing and failover',
      points: [
        'All sessions of a document must reach the one server that orders its ops. An etcd- or ZooKeeper-style registry maps doc_id → owner, with each server’s entries tied to its single lease; unowned documents go to a server picked by consistent hashing, and gateways cache the mapping.',
        'Leases alone allow split brain: an owner that pauses past its lease can wake up and keep writing. Each new owner raises lease_epoch on the document row before serving, and every op-log insert checks that epoch and an unused (doc_id, rev) in one transaction, so a stale owner’s writes fail.',
        'The owner makes each batch durable before ACKing or broadcasting it, so a crash never loses an acknowledged edit; the few milliseconds of write latency are hidden because the author’s edit is already on screen.',
        'When an owner dies, its lease expires within seconds; a new owner raises the epoch, loads the snapshot plus the op-log tail, and clients reconnect from their last revision. Replay tells each client whether its in-flight batch committed, and dedupe on (site, seq) makes a blind resend harmless.',
      ],
    },
    {
      heading: 'Op log, history, presence, comments and permissions',
      points: [
        'Durable state is the append-only op log keyed by (doc_id, rev) plus a snapshot every ~1,000 ops, so a revision is rebuilt from the nearest earlier snapshot plus later ops. Restoring an old version appends new ops that produce its text, so history is never rewritten.',
        'Presence (who is here, cursors, selections) is ephemeral: the owner relays it, throttled to a few updates per second per user, never logs it and drops it when the session ends. Cursor positions are transformed through incoming ops like insertion points.',
        'A comment’s range is sent with its revision and transformed forward to the head; after that the owner moves anchors through every committed op like cursors and saves them with snapshots. If the anchored text is deleted, the comment stays, marked detached, rather than jumping elsewhere.',
        'Permissions are checked when the WebSocket opens and on every submit; viewers and commenters receive ops but cannot submit them. ACL changes are pushed to the owner, which downgrades or closes live sessions at once, because a check made only at connect would outlive a revocation.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Concurrency control',
      choice: 'OT with a central server per document',
      rationale:
        'The owner totally orders ops, so only TP1 is needed, and a server is required anyway for permissions and durability. A CRDT would remove the sequencer but adds per-character IDs and tombstones that this design gains little from.',
    },
    {
      decision: 'Document ownership',
      choice: 'One owner per document, leased from a registry and fenced by epochs',
      rationale:
        'Ordering in one process’s memory is cheap; agreeing on every keystroke across replicas would need consensus per op. Epoch fencing keeps lease handover safe even when an old owner wakes up late.',
    },
    {
      decision: 'Client flow control',
      choice: 'At most one unacknowledged batch per client',
      rationale:
        'The server never transforms against a client’s own concurrent ops and keeps one linear history. Streaming many unacknowledged ops would save a little latency but needs per-client transformation state on the server, as in Jupiter.',
    },
    {
      decision: 'Persistence',
      choice: 'Op log plus periodic snapshots',
      rationale:
        'The log gives per-batch durability, exact history and dedupe, and snapshots bound load time. Saving the whole document on every change would rewrite ~300 KB per keystroke batch and lose fine-grained history.',
    },
    {
      decision: 'Transport',
      choice: 'One WebSocket per session',
      rationale:
        'Full duplex with little per-message overhead suits many tiny messages in both directions; SSE plus POST or long polling get through restrictive proxies, so keep them as a fallback rather than the default.',
    },
  ],
  failureModes: [
    'Collaboration server crash: sessions drop, the lease expires within seconds and a new owner with a higher epoch loads the snapshot plus op-log tail. Clients keep editing locally, reconnect with exponential backoff and jitter, and resend unacknowledged batches, which dedupe makes safe.',
    'Split brain after a long GC pause or partition: the old owner still believes it owns the document, but its op-log inserts fail the epoch check, so it never ACKs another edit. On the first failure it closes its sessions with "owner moved" and clients reconnect to the new owner.',
    'Op-log store slow or unavailable: the owner cannot make edits durable, so it stops ACKing. After a few seconds it marks the document read-only with a banner, while clients keep unacknowledged edits in IndexedDB until writes recover.',
    'Buggy or malicious clients (positions out of range, oversized batches, another user’s site ID): the owner validates every op against its own copy and every site against doc_sites, and closes the session on failure; clients that see a revision gap resync rather than guess.',
    'Hot document (an all-hands agenda, a viral link): beyond ~100 editors new sessions join read-only, viewers receive ops through a fan-out tier fed by the owner rather than from the owner directly, and presence updates are sampled.',
  ],
  code: {
    label:
      'TypeScript: single-character OT (insert/delete) with a revisioned server and a one-op-in-flight client',
    language: 'TypeScript',
    code: `// Each op inserts or deletes ONE character; site IDs are unique per session (server-assigned).
export type Op =
  | { kind: 'ins'; pos: number; ch: string; site: number }
  | { kind: 'del'; pos: number }
  | { kind: 'noop' };

export function apply(doc: string, op: Op): string {
  if (op.kind === 'noop') return doc;
  const max = op.kind === 'ins' ? doc.length : doc.length - 1; // a delete needs a character
  if (!Number.isInteger(op.pos) || op.pos < 0 || op.pos > max) throw new RangeError('Bad pos');
  if (op.kind === 'del') return doc.slice(0, op.pos) + doc.slice(op.pos + 1);
  if (op.ch.length !== 1) throw new RangeError('An insert carries exactly one character');
  return doc.slice(0, op.pos) + op.ch + doc.slice(op.pos);
}

/** Rewrites a so it applies after b, where a and b were made concurrently on the same state. */
export function transform(a: Op, b: Op): Op {
  if (a.kind === 'noop' || b.kind === 'noop') return a;
  if (a.kind === 'ins') {
    if (b.kind === 'del') return b.pos < a.pos ? { ...a, pos: a.pos - 1 } : a;
    const bFirst = b.pos < a.pos || (b.pos === a.pos && b.site < a.site); // tie: lower site first
    return bFirst ? { ...a, pos: a.pos + 1 } : a;
  }
  if (b.kind === 'ins') return b.pos <= a.pos ? { ...a, pos: a.pos + 1 } : a;
  if (b.pos === a.pos) return { kind: 'noop' }; // both deleted the same character
  return b.pos < a.pos ? { ...a, pos: a.pos - 1 } : a;
}

/** The document's single owner: orders ops into revisions and transforms stale ones forward. */
export class DocServer {
  doc: string;
  readonly history: Op[] = []; // history[r] turns revision r into revision r + 1

  constructor(doc = '') {
    this.doc = doc;
  }

  receive(baseRev: number, op: Op): { rev: number; op: Op } {
    const known = Number.isInteger(baseRev) && baseRev >= 0 && baseRev <= this.history.length;
    if (!known) throw new RangeError('Unknown base revision'); // client must reload
    for (const committed of this.history.slice(baseRev)) op = transform(op, committed);
    this.doc = apply(this.doc, op); // throws on an invalid op before anything is committed
    this.history.push(op);
    return { rev: this.history.length, op }; // ACK the author; broadcast op to the others
  }
}

/** One editor replica: local edits apply at once; only pending[0] is in flight to the server. */
export class DocClient {
  doc: string;
  rev: number; // latest server revision reflected in doc
  readonly pending: Op[] = []; // unacknowledged local ops, oldest first

  constructor(doc: string, rev: number) {
    this.doc = doc;
    this.rev = rev;
  }

  /** Applies a local edit; returns the op to send now (with baseRev = this.rev), or null. */
  edit(op: Op): Op | null {
    this.doc = apply(this.doc, op);
    this.pending.push(op);
    return this.pending.length === 1 ? op : null; // otherwise it waits for the ACK
  }

  /** pending[0] was committed as revision rev; returns the next op to send, if any. */
  ack(rev: number): Op | null {
    this.advance(rev);
    this.pending.shift();
    return this.pending[0] ?? null;
  }

  /** Another client's op committed as revision rev: rebase pending ops over it, then apply. */
  remote(rev: number, op: Op): void {
    this.advance(rev);
    for (let i = 0; i < this.pending.length; i++) {
      const mine = this.pending[i]!;
      this.pending[i] = transform(mine, op);
      op = transform(op, mine);
    }
    this.doc = apply(this.doc, op);
  }

  private advance(rev: number): void {
    // The server sends in revision order over one ordered channel, so a gap means lost state.
    if (rev !== this.rev + 1) throw new Error('Missed revision ' + (this.rev + 1) + ': resync');
    this.rev = rev;
  }
}`,
  },
  followUps: [
    {
      question: 'How would you extend this to rich text?',
      answer:
        'Represent each change as a sequence of retain, insert and delete components, where inserts and retains can carry attributes such as bold; Quill’s open-source Delta format works this way. Transform rules extend per component, and concurrent formatting of the same range needs a deterministic rule, such as the later revision winning.',
    },
    {
      question: 'When would you switch to a CRDT such as Yjs or Automerge?',
      answer:
        'When offline-first or peer-to-peer editing is central: CRDT replicas merge in any order without a central sequencer, so long offline sessions and direct device-to-device sync work naturally. The server becomes a relay and store for updates, at the price of per-character metadata and tombstone compaction.',
    },
    {
      question: 'How do you implement undo in a shared document?',
      answer:
        'Undo must revert only the user’s own edits, not collaborators’. Keep a per-user stack of inverse ops (delete the inserted character, or re-insert the deleted one, which the stack must remember) and transform each inverse past every op committed after the original before applying it. Undoing an insert that a collaborator already deleted becomes a no-op.',
    },
  ],
};
