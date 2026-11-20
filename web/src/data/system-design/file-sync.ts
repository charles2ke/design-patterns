import type { SystemDesignQuestion } from '../../types/system-design';

export const fileSync: SystemDesignQuestion = {
  slug: 'file-sync',
  title: 'Design a file sync service (Dropbox / Google Drive)',
  difficulty: 'Hard',
  companies: ['Google', 'Amazon', 'Microsoft', 'Apple', 'Dropbox'],
  prompt:
    'Design a file sync service like Dropbox or Google Drive. Users install a desktop or mobile client that keeps a folder in sync across all of their devices, and they can share folders with other users. Assume 100 million users storing 10 GB each on average, 25 million daily active users with two devices each, and files up to 50 GB.',
  signals: [
    'Separates bytes from metadata: immutable, content-addressed blocks in object storage, and a transactional metadata service that maps each file version to an ordered block list.',
    'Uses chunking (ideally content-defined) and block hashes so that edits upload only changed blocks, storage deduplicates and interrupted transfers resume.',
    'Models sync as an ordered per-namespace journal read through cursors, and resolves concurrent edits with optimistic concurrency and conflicted copies instead of silent overwrites.',
    'Handles the sharp edges: garbage collection racing in-flight uploads, expired cursors, and access checks and encryption on deduplicated blocks.',
  ],
  requirements: {
    functional: [
      'Create, update, rename, move and delete files and folders on any device; changes reach the user’s other online devices within seconds.',
      'Upload and download large files in resumable pieces, so an interrupted transfer continues where it stopped.',
      'Never lose a concurrent edit: when two devices change the same file, one version keeps the path and the other is saved as a conflicted copy.',
      'Share a folder with other users as viewer or editor; members’ clients sync it like one of their own folders.',
      'Keep version history for a retention window (e.g., 30 days) so users can restore earlier versions and deleted files.',
    ],
    nonFunctional: [
      'Durability first: an acknowledged commit is never lost, and every block is verified against its hash end to end.',
      'Propagation: a change shows up on the user’s other online devices within a few seconds at p99.',
      'Bandwidth efficiency: editing a large file uploads roughly the changed bytes, not the whole file.',
      'Clients work offline and reconcile on reconnect, surviving flaky mobile networks, crashes and clock skew between devices.',
      'Strict access control: deduplicated storage must never let a user read, or even probe for, content they cannot access.',
    ],
    outOfScope: [
      'Real-time co-editing inside documents (Google Docs-style operational transforms or CRDTs).',
      'Search, previews and thumbnails (assume asynchronous services that consume the change journal).',
      'Billing, quota management and the web UI.',
    ],
  },
  estimates: [
    'Storage: 100M users × 10 GB ≈ 1 EB logical. Assuming ~1.5:1 dedup across files and users, ≈ 670 PB is unique, and ~1.5× erasure-coding overhead brings it back to ≈ 1 EB raw, before version history.',
    'Block index: 670 PB ÷ ~1 MiB average chunk ≈ 640 billion blocks; at ~100 bytes per row (hash, location, GC state) that is ≈ 64 TB before replication, so it is sharded by hash.',
    'Upload: assume each DAU writes ~100 MB of new or changed data a day: 25M × 100 MB = 2.5 PB/day ≈ 29 GB/s ≈ 230 Gbps on average, ~700 Gbps at a 3× peak, before dedup skips known blocks.',
    'Download: if each change is fetched by ~2 other devices (the user’s second device plus collaborators), egress is ≈ 58 GB/s ≈ 460 Gbps on average.',
    'Metadata: 25M DAU × ~40 commits/day = 1B commits/day ≈ 11,600/s on average and ~35,000/s at peak; at ~200 bytes per journal entry that is ≈ 200 GB of journal per day.',
    'Notifications: up to 25M × 2 = 50M connected devices; at ~50,000 idle long-polls per server that is ≈ 1,000 notification servers.',
  ],
  api: `POST /v1/ns/{nsId}/commit                    (one transaction on the namespace shard)
{ "path": "/docs/plan.pdf", "parentRev": 7,
  "blocks": ["9f2c...", "a41b..."], "receipts": ["..."] }   (receipts for new uploads)
-> 200 { "status": "committed", "rev": 8, "seq": 1042 }
-> 200 { "status": "need_blocks", "missing": ["a41b..."] }  (nothing changed; upload)
-> 409 Conflict { "headRev": 9 }        (save the local edit as a conflicted copy)
-> 403 Forbidden (no editor role on the namespace)

PUT /v1/blocks/{sha256}?ns={nsId}            (block bytes <= 4 MiB; idempotent)
-> 200 { "receipt": "..." }     (signed ns + hash + expiry; issued even for known blocks)
-> 400 Bad Request (the bytes do not hash to {sha256})

GET /v1/blocks/{sha256}?ns={nsId}   (only if the caller can read nsId and nsId uses it)
-> 200 <bytes>  |  403 Forbidden  |  404 Not Found

GET /v1/ns/{nsId}/changes?cursor=1042&limit=1000
-> 200 { "entries": [{ "seq": 1043, "path": "...", "rev": 8, "blocks": [...] }],
         "cursor": 1043, "hasMore": false }
-> 409 Conflict { "error": "reset" }           (cursor older than the journal: re-list)

GET /v1/notify?cursors=nsA:1043,nsB:77&timeout=60     (long-poll; carries no file data)
-> 200 { "changed": ["nsA"] }  |  200 { "changed": [] } after the timeout`,
  dataModel: `namespaces       one per user root and per shared folder; sharded by ns_id
  ns_id        int64      primary key
  head_seq     int64      last journal seq, advanced inside every commit transaction

files            current version of each path; same shard as its namespace
  ns_id, path  pk         a folder rename rewrites every row below it (see follow-ups)
  rev          int64      per-path version: the parentRev the next commit must match
  blocks       bytes      ordered 32-byte SHA-256 hashes; empty for an empty file
  size, mtime  int64      client-reported, for display and fast change detection
  deleted      bool       tombstone, so other devices learn about the delete

journal          append-only change log; same shard; compacted after N days
  ns_id, seq   pk         gap-free: a device cursor is the last seq it applied
  path, rev, blocks, deleted, device_id, committed_at

ns_blocks        same shard: blocks this namespace may reference without re-uploading
  ns_id, hash  pk         added by a commit that presents an upload receipt

mounts           which namespaces each user syncs; secondary index on ns_id
  user_id, ns_id  pk
  mount_path   string     where the namespace appears in the user tree
  role         enum       owner | editor | viewer

block_index      separate key-value store, sharded by hash
  hash         bytes(32)  primary key: SHA-256 of the plaintext block
  location     string     object key, or pack file + offset for small blocks
  refs         int64      namespaces using it; updated asynchronously, audited
  state        enum       live | condemned | deleted
  last_ref_at  timestamp  last upload touch; GC waits out a grace period after it

A commit or a cursor read touches one namespace, so it is a single-shard transaction.
A download checks mounts and ns_blocks on that shard, then reads block_index by hash.`,
  architecture: {
    diagram: `+--------------------+ 1,3. commit          +--------------------+
| Client             | 5. changes?cursor    | Metadata service   |
| watcher, chunker,  |--------------------->| sharded by ns_id:  |
| local state DB     |<---------------------| files, journal,    |
+--+-------------+---+ need_blocks|rev|409  | mounts, ns_blocks  |
   |             ^                          +---------+----------+
   | 2. PUT      | 4. long-poll returns               | 4. publish
   | 5. GET      |    "ns changed"                    v "ns changed"
   |   blocks    |                          +--------------------+
   |             +--------------------------| Notification tier  |
   v                                        +--------------------+
+--------------------+                      +--------------------+
| Block servers      |--------------------->| Block index        |
| verify hash,       |  hash -> location,   | (sharded by hash)  |
| check access       |  last_ref_at         +---------+----------+
+---------+----------+                                ^
          |                                           | 6. condemn
          v                                           |    unreferenced
+--------------------------------+  6. delete +-------+------------+
| Object store: erasure-coded,   |<-----------| GC workers         |
| encrypted, immutable blocks    |            | (grace period)     |
+--------------------------------+            +--------------------+`,
    flow: [
      'The client watches its folder, splits each changed file into content-defined chunks and hashes them, then sends commit(path, parentRev, block list) to the namespace’s metadata shard, which answers need_blocks for blocks the namespace has not seen.',
      'The client PUTs only those blocks; block servers verify each hash, store new blocks encrypted in the object store, record them in the block index and return a signed receipt per block.',
      'The client retries the commit with its receipts. One shard transaction checks parentRev, writes the file row and appends a journal entry; a stale parentRev returns 409 and the client keeps its edit as a conflicted copy.',
      'After the commit, the metadata service publishes "ns changed" to the notification tier, which completes the long-polls of every device subscribed to that namespace.',
      'Each woken device fetches the changes after its cursor, GETs the blocks it lacks, verifies their hashes, writes the file atomically and saves the new cursor.',
      'GC workers condemn blocks that no namespace references and no upload has touched within the grace period, and only then delete their bytes from the object store.',
    ],
  },
  deepDives: [
    {
      heading: 'Chunking, content addressing and dedup',
      points: [
        'Dropbox has described splitting every file into 4 MB blocks named by their SHA-256 hash (its 2014 "Streaming File Synchronization" post), and its API’s content_hash is built from the same 4 MB blocks. Fixed blocks are simple and naturally resumable.',
        'Fixed offsets have one weakness: inserting a byte near the start of a file shifts every later boundary, so every later block hash changes and the rest of the file is uploaded again.',
        'Content-defined chunking cuts where a rolling hash of the last few dozen bytes matches a pattern (Rabin fingerprints in LBFS, a cheaper Gear hash in FastCDC), so boundaries move with the content and an insertion changes only the chunks around it.',
        'Min and max sizes bound the extremes: no tiny chunks, and a forced cut in long runs of identical bytes. Smaller chunks dedup better but grow the block index and every block list, so ~1 MiB with 256 KiB–4 MiB bounds is a reasonable start.',
        'Block servers recompute the SHA-256 of every upload, or a client could poison a popular hash. The "already have it" answer is per namespace, because a global answer lets anyone test whether a file exists elsewhere or claim content by knowing only its hash.',
      ],
    },
    {
      heading: 'Journal, cursors and conflicts',
      points: [
        'Each namespace has an append-only journal with gap-free sequence numbers. A commit updates the file row and appends the journal entry in one transaction on the namespace’s shard, so journal order is commit order.',
        'A device keeps one cursor per namespace (the last seq it applied) and pulls pages of changes after it. Applying an entry is idempotent and the cursor is saved afterward, so a crashed client simply resumes from its saved cursor.',
        'Commits are optimistic: the client names the parentRev it edited, and a moved head returns 409. The client then saves its bytes as a conflicted copy (Dropbox adds the editor’s name, "conflicted copy" and the date to the file name), so both versions survive.',
        'Retries must not create false conflicts: if the head already has exactly the client’s block list (its first attempt landed, or another device made the same edit), the server reports success instead of 409.',
        'Notifications carry no data, only "this namespace changed"; the device then pulls from its cursor, as with Dropbox’s public list_folder/longpoll API. Lost or duplicate notifications are therefore harmless, and periodic polling is the safety net.',
      ],
    },
    {
      heading: 'Large files, resumable transfers and garbage collection',
      points: [
        'A 50 GB file is ≈ 48,000 chunks of ~1 MiB, a 1.5 MB list of 32-byte hashes. Each block is an independent, idempotent PUT, so uploads run in parallel and resume after a crash by re-committing and uploading whatever is still missing.',
        'The commit comes last, so other devices never see a half-uploaded file. Downloads write to a temporary file, verify every block hash and atomically rename it into place.',
        'Reference counts, updated as commits add blocks and old versions expire, find garbage incrementally but drift under bugs and retries; a periodic mark-and-sweep over all live block lists corrects them. Pause GC whenever the count pipeline lags.',
        'The dangerous race is a block that was uploaded but not yet committed: nothing references it. Uploads touch its last_ref_at, receipts expire well within the grace period, and GC condemns only blocks that are unreferenced and untouched for longer than that period.',
        'Each state change is a conditional write on the block’s index row (live → condemned → deleted), and bytes are deleted only after reaching deleted; an upload that finds the row condemned or deleted stores a fresh copy instead of trusting the old one.',
      ],
    },
    {
      heading: 'Sharing, permissions and encryption',
      points: [
        'A shared folder is its own namespace with its own journal on one shard; each member mounts it at a path in their tree with a role. Commits into it go to its shard, and every member’s devices follow its cursor.',
        'Every commit checks the caller’s role on the namespace, and a block download is allowed only if the caller can read a namespace that uses the block. Unsharing removes the mount, but copies already on members’ disks cannot be recalled.',
        'Encryption at rest uses envelope encryption: each block (or pack file) is encrypted with a data key wrapped by a master key held in a KMS, so rotating the master key re-wraps small keys instead of re-encrypting exabytes.',
        'Server-side encryption keeps dedup, because the server hashes the plaintext before encrypting. End-to-end encryption gives up cross-user dedup, previews and search; convergent encryption (key derived from the content) restores dedup but reveals who holds identical files.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Chunking',
      choice: 'Content-defined chunks (~1 MiB average, 256 KiB–4 MiB bounds)',
      rationale:
        'An insertion only changes the chunks around it, so edits upload and store little. Fixed 4 MB blocks are simpler and cheaper to compute but re-upload the rest of the file after an insertion near its start.',
    },
    {
      decision: 'Metadata store',
      choice: 'Sharded relational database, each namespace on one shard',
      rationale:
        'A commit is a conditional check plus two writes (file row and journal) that must be atomic, and a journal needs one total order. One shard per namespace gives both without distributed transactions; an eventually consistent store would need them rebuilt on top.',
    },
    {
      decision: 'Concurrent edits',
      choice: 'Optimistic concurrency on parentRev, with conflicted copies',
      rationale:
        'Nothing is silently lost and no lock is left dangling by a laptop that went offline. Last-writer-wins drops edits, and file locking works badly for offline clients; the cost is an occasional manual merge.',
    },
    {
      decision: 'Change propagation',
      choice: 'Notify, then pull from a cursor',
      rationale:
        'The cursor is the source of truth, so notifications can be lost, duplicated or replaced by polling without harm. Pushing full changes to devices would need per-device delivery guarantees, ordering and backpressure.',
    },
    {
      decision: 'Dedup scope',
      choice: 'Global block storage, per-namespace "already have it" answers',
      rationale:
        'Storage is shared across all users, but a client skips an upload only for blocks its namespace already uses. Fully global answers would save more bandwidth but leak whether content exists elsewhere.',
    },
  ],
  failureModes: [
    'Client crash mid-upload: uploaded blocks are durable and nothing was committed. On restart the client re-runs the commit and uploads only what need_blocks still lists; an expired receipt just means re-uploading that block.',
    'Metadata shard failover: commits to that shard pause for seconds while a synchronous replica takes over, so acknowledged commits survive. Clients retry with the same parentRev, and the identical-content check turns a commit that already landed into success.',
    'Device offline for months: its cursor is older than the compacted journal, so the server answers reset. The client re-lists the namespace and reconciles by hash against its last synced state, creating conflicted copies only where both sides changed.',
    'Corrupt or lost block: hashes are checked on upload, on download and by background scrubbers, and erasure coding rebuilds a damaged fragment. Alert on any block that fails verification, since content addressing means one bad block can affect many files.',
    'Hot shared folder: one commit in a folder synced by 100,000 devices wakes all of them at once. Add jitter to the wake-ups, serve change pages from read replicas, and serve the immutable blocks through a CDN with short-lived signed URLs.',
  ],
  code: {
    label: 'TypeScript: content-defined chunking and an optimistic commit that reports missing blocks',
    language: 'TypeScript',
    code: `import { createHash } from 'node:crypto';

/** hash is the hex SHA-256 of the bytes: the block's name in the object store. */
export interface Chunk { hash: string; offset: number; length: number }

// 256 fixed pseudo-random values. Every client must share the table, or the same
// file would be cut differently on two devices and stop deduplicating.
const GEAR: number[] = Array.from({ length: 256 }, (_, i) =>
  createHash('sha256').update('gear:' + i).digest().readUInt32BE(0),
);

/** Content-defined chunking: after an insertion, later cut points shift with the bytes. */
export function chunkFile(
  data: Uint8Array,
  min = 256 * 1024,
  avg = 1024 * 1024,
  max = 4 * 1024 * 1024,
): Chunk[] {
  if (!(min > 0 && min < avg && avg < max)) throw new RangeError('need 0 < min < avg < max');
  // Gear hash h = 2h + GEAR[byte] (mod 2^32) forgets a byte after 32 steps. h < threshold
  // tests the high bits, which depend on all 32 bytes; P(cut) per byte ≈ 1 / (avg - min).
  const threshold = Math.floor(2 ** 32 / (avg - min));
  const chunks: Chunk[] = [];
  for (let start = 0; start < data.length; ) {
    const end = Math.min(start + max, data.length);
    // Skip min bytes, cut after the first byte whose hash is below the threshold, and
    // force a cut at max if none is found (e.g. in a long run of zeros).
    let cut = Math.min(start + min, end);
    for (let h = 0; cut < end; ) {
      h = ((h << 1) + (GEAR[data[cut++] ?? 0] ?? 0)) >>> 0;
      if (h < threshold) break;
    }
    const hash = createHash('sha256').update(data.subarray(start, cut)).digest('hex');
    chunks.push({ hash, offset: start, length: cut - start });
    start = cut;
  }
  return chunks;
}

export interface JournalEntry {
  seq: number; // position in the namespace journal; a device's cursor is the last seq it saw
  path: string;
  rev: number;
  blocks: readonly string[]; // ordered block hashes; [] is an empty file
}

export type CommitResult =
  | { status: 'committed'; rev: number; seq: number }
  | { status: 'conflict'; headRev: number } // the client keeps its edit as a conflicted copy
  | { status: 'need_blocks'; missing: string[] }; // upload these, then retry the commit

const sameBlocks = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((hash, i) => hash === b[i]);

/** One namespace (a user's root or a shared folder), stored on one metadata shard. */
export class Namespace {
  private readonly heads = new Map<string, JournalEntry>();
  private readonly journal: JournalEntry[] = [];
  private readonly hasBlock: (hash: string) => boolean;

  /** hasBlock must answer for this user (blocks they uploaded or can read), not globally. */
  constructor(hasBlock: (hash: string) => boolean) {
    this.hasBlock = hasBlock;
  }

  /** Runs as one shard transaction. parentRev is the rev the client edited (0 = new file). */
  commit(path: string, parentRev: number, blocks: readonly string[]): CommitResult {
    const head = this.heads.get(path);
    const headRev = head?.rev ?? 0;
    if (headRev !== parentRev) {
      // Same content as the head (e.g. a retry whose first attempt landed) loses nothing.
      if (head !== undefined && sameBlocks(head.blocks, blocks)) {
        return { status: 'committed', rev: head.rev, seq: head.seq };
      }
      return { status: 'conflict', headRev };
    }
    const missing = [...new Set(blocks.filter((hash) => !this.hasBlock(hash)))];
    if (missing.length > 0) return { status: 'need_blocks', missing };
    const entry = { seq: this.journal.length + 1, path, rev: headRev + 1, blocks: [...blocks] };
    this.journal.push(entry);
    this.heads.set(path, entry);
    return { status: 'committed', rev: entry.rev, seq: entry.seq };
  }

  /** Entries after a device's cursor, oldest first (seq n is stored at index n - 1). */
  changesSince(cursor: number, limit = 1000): JournalEntry[] {
    if (!Number.isInteger(cursor) || cursor < 0) throw new RangeError('invalid cursor');
    return this.journal.slice(cursor, cursor + limit);
  }
}`,
  },
  followUps: [
    {
      question: 'How would you add end-to-end encryption?',
      answer:
        'Clients encrypt each chunk with a per-file key and wrap file keys with a per-folder key that is shared through members’ public keys, so the server stores only ciphertext. Naming blocks by an HMAC under the folder key keeps dedup within a folder but not across users. You lose server-side previews and search, and account recovery needs a user-held or escrowed recovery key.',
    },
    {
      question: 'Renaming a folder with 100,000 files rewrites 100,000 rows. How would you make it cheap?',
      answer:
        'Give every file and folder a stable ID and store (parent_id, name) instead of full paths, so a rename or move is one row update and one journal entry. Clients rebuild paths by walking parent pointers in their local database. The costs are cycle checks on moves and path lookups that walk up the tree, which a per-namespace path cache hides.',
    },
    {
      question: 'How does the client detect local changes efficiently?',
      answer:
        'Subscribe to OS file-system events (FSEvents on macOS, ReadDirectoryChangesW on Windows, inotify on Linux) and keep size, mtime and inode per file from the last sync in a local database, re-chunking only files whose metadata changed. Still run a periodic full scan, because event streams can overflow or drop events. Wait until a file stops changing before uploading, so half-written files are not synced.',
    },
  ],
};
