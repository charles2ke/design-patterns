import type { SystemDesignQuestion } from '../../types/system-design';

export const chatMessaging: SystemDesignQuestion = {
  slug: 'chat-messaging',
  title: 'Design a chat application (WhatsApp / Slack / Teams)',
  difficulty: 'Medium',
  companies: ['Microsoft', 'Meta', 'OpenAI', 'Anthropic', 'Apple'],
  prompt:
    'Design a chat service like WhatsApp, Slack or Microsoft Teams. Users exchange messages in 1:1 conversations and groups, see sent, delivered and read receipts, and use several devices at once; a device that was offline must catch up when it reconnects. Assume 500 million daily active users who send about 40 messages each per day, groups of up to 500 members and broadcast-style channels with up to 100,000 members.',
  signals: [
    'Separates connection handling (gateways plus a session registry) from durable message storage, and explains how a message reaches every device of every member.',
    'Defines ordering precisely: a per-conversation sequence number assigned by one owner, not wall clocks and not a global order.',
    'Gets delivery semantics right: at-least-once delivery, idempotent sends via client message IDs, and per-device cursors that let an offline device fetch exactly its gap.',
    'Reasons about fan-out cost for large groups and about what end-to-end encryption takes away from the server.',
  ],
  requirements: {
    functional: [
      'Send text messages in 1:1 and group conversations; media is uploaded separately and sent as an encrypted reference.',
      'Deliver in real time to every online device of each member; offline devices get a push notification and catch up when they reconnect.',
      'Show messages in the same order on every device, with sent, delivered and read receipts.',
      'Support several devices per user (phone, desktop, web), each syncing independently, plus scrollback through history.',
    ],
    nonFunctional: [
      'Low latency: p99 under ~300 ms from send to delivery when both devices are online in the same region.',
      'Durability: once the sender sees "sent", the message is never lost.',
      'No visible duplicates or reordering within a conversation, despite retries, reconnects and failovers.',
      'High availability (99.99%) and graceful recovery when a gateway failure disconnects hundreds of thousands of devices at once.',
    ],
    outOfScope: [
      'Voice and video calls (signaling and media relays are a separate system).',
      'Bots, third-party integrations and message search.',
      'Account registration, contact discovery and presence (online / last seen).',
    ],
  },
  estimates: [
    'Messages: 500M DAU × 40/day = 20B/day ÷ 86,400 s ≈ 231,000 sends/s on average; plan for ~3× peak ≈ 700,000/s.',
    'Deliveries: assume ~3 recipient devices per message (other members’ devices plus the sender’s other devices) → ≈ 700,000 device deliveries/s on average and ≈ 2.1M/s at peak.',
    'Connections: if 40% of DAU are online at peak on ~1.5 devices each, 500M × 0.4 × 1.5 = 300M concurrent WebSockets; at ~200,000 per gateway host that is ≈ 1,500 hosts before headroom.',
    'Registry: refreshing a TTL for each of 300M devices every 60 s would cost 5M writes/s, so entries change only on connect and disconnect and are invalidated in bulk when a gateway’s own heartbeat stops.',
    'Storage: ~200 bytes per message (ciphertext plus metadata) × 20B/day ≈ 4 TB/day ≈ 1.5 PB/year before 3× replication, so the log is partitioned and old buckets move to cheaper storage.',
    'Per conversation, sends are serialized: at ~5 ms per quorum write one conversation tops out near 200 messages/s, far above a normal group’s rate; only giant channels need batched (group-commit) writes.',
  ],
  api: `WebSocket  wss://chat.example.com/v1/connect   (auth token + device_id in the handshake)

client -> server  send     { conversationId, clientMsgId: uuid, payload }
server -> client  sent     { conversationId, clientMsgId, seq }   retry: same seq
server -> client  message  { conversationId, seq, senderId, clientMsgId, payload }
client -> server  ack      { conversationId, seq }   delivered: highest contiguous seq
client -> server  read     { conversationId, seq }   read marker
server -> client  receipt  { conversationId, userId, deliveredSeq, readSeq }

GET  /v1/sync?deviceId=d1
-> 200 { gaps: [{ conversationId, afterSeq: 118, lastSeq: 131 }] }
GET  /v1/conversations/{id}/messages?afterSeq=118&limit=100
-> 200 { messages: [...], hasMore: false }  |  403 Forbidden (not a member)
POST /v1/conversations  { type: "direct" | "group" | "channel", memberIds: [...] }
-> 201 Created { conversationId }`,
  dataModel: `messages        Cassandra / ScyllaDB, PRIMARY KEY ((conversation_id, bucket), seq)
  conversation_id  uuid
  bucket           int        seq / 10,000: bounds partition size for long-lived channels
  seq              bigint     clustering key; assigned by the partition owner, dense
  sender_id        uuid
  client_msg_id    uuid       retry key stored with the message, unique per (conversation, sender)
  payload          blob       ciphertext when end-to-end encrypted
  created_at       timestamp  display only, never used for ordering

The message row is also the durable retry record; there is no separately written dedup table
or TTL. Keep client_msg_id for the full message-history lifetime (unbounded if history is
unbounded); if bodies are compacted, retain a compact sender/client_msg_id -> seq mapping for
the entire supported retry window.
Before accepting sends after startup or failover, the owner rebuilds its client-ID index from
the durable log. On an index miss it checks the durable log before assigning a new seq, so a
retry can recover a message whose quorum write completed before its previous owner crashed.
conversations   PRIMARY KEY (conversation_id): type, member_count, last_seq
memberships     PRIMARY KEY ((user_id), conversation_id): read_seq, last_seq
                (last_seq only for small groups) + reverse table by conversation_id
device_cursors  PRIMARY KEY ((device_id), conversation_id): delivered_seq
sessions        Redis hash per user: device_id -> (gateway_id, conn_id), no per-device TTL

Sync and scrollback are single-partition range scans (seq > cursor LIMIT n), and the
bucket for any cursor is computable because seqs have no gaps.`,
  architecture: {
    diagram: `  Devices (phone, desktop, web) <-------------- APNs / FCM
        |  ^                                         ^
   send |  | deliver, sync (WebSocket)               |
        v  |                                         |
  +--------------+  register  +------------------+   |
  |   Gateways   |----------->| Session registry |   |
  +--------------+            | (user, device)   |   |
        |  ^                  |   -> gateway     |   |
  route |  | deliver          +------------------+   |
        v  |                           ^             |
  +-------------------+  lookup        |             |
  |  Message service  |----------------+             |
  | (partition owner) |------------------------------+
  +-------------------+    push if no live connection
        |
        | dedup, assign seq, quorum write
        v
  +---------------------------------+
  |  Message store                  |
  |  (conversation_id, bucket, seq) |
  +---------------------------------+`,
    flow: [
      'Each device keeps a WebSocket to a gateway, which registers (user, device) → (gateway, conn_id) in the session registry; on every connect the device syncs the gaps after its cursors.',
      'A send is routed by conversation_id to the message-service node that owns that conversation’s partition (a lease held in etcd or ZooKeeper).',
      'The owner checks the durable log for a client message ID before assigning a seq, writes the message and retry ID together with a quorum write, and only then acks "sent" with the seq.',
      'For 1:1 chats and small groups it looks up every member device in the registry and delivers through their gateways; devices ack the highest contiguous seq, which advances their cursors and produces delivered receipts.',
      'Devices without a live connection get an APNs/FCM push and page through the gap from their cursor when the app reconnects. Large channels skip per-member fan-out and are read on demand.',
    ],
  },
  deepDives: [
    {
      heading: 'Connections and the session registry',
      points: [
        'Each device holds one long-lived WebSocket to a gateway behind an L4 load balancer. Gateways terminate TLS, authenticate, heartbeat and relay frames but store nothing, so a crash drops connections, not messages.',
        'The registry maps (user, device) → (gateway, conn_id) in a Redis cluster sharded by user, so delivering to a member is one lookup that returns all of their devices.',
        'Entries are removed on disconnect with a compare-and-delete on conn_id, so a slow cleanup on an old gateway cannot erase the device’s newer session. Entries on a gateway whose own heartbeat has stopped count as offline.',
        'Real-time delivery is an optimization, not the source of truth: correctness comes from the durable log plus cursors, so a lost frame costs latency (a sync or a push notification), never a message.',
      ],
    },
    {
      heading: 'Per-conversation ordering and idempotent sends',
      points: [
        'Wall clocks cannot order messages: devices drift and two members can send in the same millisecond. Conversations hash to a few thousand partitions, each leased to one message-service node that assigns seq = last + 1.',
        'Clients create a UUID client message ID before the first attempt and reuse it on every retry. The owner looks it up (scoped to conversation and sender) before assigning a seq, so a retry after a lost ack returns the original seq.',
        '"Sent" is acknowledged only after a quorum write, and a seq is consumed only when that write succeeds, so seqs have no gaps; a device that sees seq jump from 41 to 44 knows exactly which range to fetch.',
        'After failover the new owner reads the newest stored seq before assigning more, and inserts are conditional on (conversation_id, seq) being absent, so a paused former owner cannot overwrite a message.',
        'Edits, deletes and reactions are new events with their own seq that reference the original message, so every device applies them in the same order during sync.',
      ],
    },
    {
      heading: 'Sync, group fan-out and multiple devices',
      points: [
        'Each device keeps a cursor per conversation: the highest contiguous seq it has stored. It acks after persisting a batch, which advances its server-side cursor and produces delivered receipts.',
        'On reconnect the device asks for its gaps (one read of its memberships and one of its cursors) and pages through each gap oldest-first, ~100 messages at a time, so a week offline never produces one huge response.',
        'Small groups fan out per message: look up every member device, deliver to online ones and notify offline ones through APNs/FCM, collapsing notifications per conversation.',
        'Channels above ~500 members skip per-member fan-out. Clients with the channel open get a lightweight "head is now seq N" event and read on demand; unread counts are last_seq - read_seq, and pushes go only to mentioned users.',
        'Every device is its own recipient with its own cursor and keys; a user’s other devices receive the messages that user sent through the same sync path.',
      ],
    },
    {
      heading: 'End-to-end encryption and its consequences',
      points: [
        'The Signal protocol is public: each device uploads an identity key and one-time prekeys, a sender fetches a prekey bundle to start a session (X3DH), and the Double Ratchet derives a new key for every message, giving forward secrecy.',
        'Keys belong to devices, not users, so a 1:1 message is encrypted separately for each recipient device and for each of the sender’s other devices.',
        'Groups use sender keys: each member distributes its sender key pairwise once, then encrypts each message once and the server fans out a single ciphertext. When someone leaves, the remaining members rotate their keys.',
        'The server sees only ciphertext plus metadata (who, when, which conversation). It cannot search, index or moderate content, so search runs on the device and abuse handling relies on user reports that include the reported messages, plus metadata signals such as send rates.',
        'Push notifications carry no plaintext, and a new device cannot download readable history from the server; it needs a transfer from another device or an encrypted backup.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Message ordering',
      choice: 'Per-conversation seq assigned by the partition owner',
      rationale:
        'Gives every device the same order where users can see it, with no coordination across conversations. Client timestamps drift and collide, and a global sequencer would be a bottleneck for an order nobody needs.',
    },
    {
      decision: 'Delivery semantics',
      choice: 'At-least-once with client message IDs and dedup by seq',
      rationale:
        'Exactly-once delivery over flaky mobile networks is not achievable end to end; idempotent sends plus dedup by seq on devices make duplicates invisible, whereas at-most-once would silently lose messages.',
    },
    {
      decision: 'Group delivery',
      choice: 'Fan out per message for small groups, read on demand for large channels',
      rationale:
        'Pushing every message to 100,000 members costs 100,000 deliveries, mostly to people who are not looking. Pulling for small groups would add latency to the common case.',
    },
    {
      decision: 'Message store',
      choice: 'Wide-column store keyed by (conversation_id, bucket), clustered by seq',
      rationale:
        'Appends and after-cursor reads are single-partition range scans that scale horizontally. Per-recipient inbox copies would multiply writes and storage by group size.',
    },
    {
      decision: 'Encryption',
      choice: 'End-to-end (Signal protocol) for consumer chat, encryption at rest for workplace chat',
      rationale:
        'E2EE limits a server breach to metadata but removes server-side search, moderation, retention policies and easy history sync, which workplace chat usually needs.',
    },
  ],
  failureModes: [
    'Gateway crash: its devices reconnect to other gateways with jittered exponential backoff (no thundering herd) and resync from their cursors. Deliveries routed to the dead gateway fail fast and fall back to push notifications.',
    'Partition owner failure or long GC pause: the lease expires, a new owner reads the stored tail before assigning seqs, and conditional inserts reject the old owner. Sends stall for a few seconds and clients retry with the same client message ID.',
    'Ambiguous write timeout: the store may have applied a write the owner saw fail. The owner re-reads the tail before assigning the next seq, and the client’s retry matches its client message ID, so the message is neither lost nor duplicated.',
    'Lost real-time frame: a device switched networks and never acked. The server retries briefly, then sends a push notification; the device fills the gap from its cursor on reconnect or as soon as it sees a seq jump.',
    'Hot channel: one very busy channel serializes on one owner and one partition. Batch pending sends into one write (group commit), cache the channel tail for readers and coalesce "new messages" events per client.',
  ],
  code: {
    label: 'TypeScript: per-conversation sequencing, idempotent sends and cursor-based device sync',
    language: 'TypeScript',
    code: `export interface Outgoing {
  senderId: string;
  /** Generated by the client before the first attempt and reused on every retry. */
  clientMsgId: string;
  body: string; // ciphertext when the conversation is end-to-end encrypted
}

export interface Message extends Outgoing {
  seq: number; // 1, 2, 3, ... per conversation: the only order clients trust
}

export interface SyncPage {
  messages: Message[];
  hasMore: boolean;
}

/** Reads the authoritative durable log, including messages committed by a previous owner. */
export type FindByClientId = (
  conversationId: string,
  senderId: string,
  clientMsgId: string,
) => Promise<Message | undefined>;

/** Resolves once the message is durable (a quorum write); rejecting means nothing was stored. */
export type Persist = (conversationId: string, message: Message) => Promise<void>;

const MAX_PAGE = 500;
const key = (...parts: string[]): string => JSON.stringify(parts);

/** Runs on the node holding the partition lease: the only place where seqs are assigned. */
export class ConversationLog {
  private readonly logs = new Map<string, Message[]>(); // logs[c][i] has seq i + 1
  private readonly byClientId = new Map<string, Message>();
  private readonly cursors = new Map<string, number>(); // (conversation, device) -> seq
  private readonly tails = new Map<string, Promise<void>>();
  private readonly persist: Persist;
  private readonly findByClientId: FindByClientId;

  constructor(persist: Persist, findByClientId: FindByClientId) {
    this.persist = persist;
    this.findByClientId = findByClientId;
  }

  async send(conversationId: string, outgoing: Outgoing): Promise<Message> {
    // An empty ID would make every later message look like a retry of the first one.
    if (outgoing.clientMsgId === '') throw new Error('clientMsgId is required');
    return this.serialize(conversationId, async () => {
      const dedupKey = key(conversationId, outgoing.senderId, outgoing.clientMsgId);
      const original = this.byClientId.get(dedupKey);
      if (original !== undefined) return original; // retry after a lost ack: same seq
      const durableOriginal = await this.findByClientId(
        conversationId,
        outgoing.senderId,
        outgoing.clientMsgId,
      );
      if (durableOriginal !== undefined) {
        this.byClientId.set(dedupKey, durableOriginal);
        return durableOriginal;
      }
      const log = this.logs.get(conversationId) ?? [];
      const message: Message = { ...outgoing, seq: log.length + 1 };
      await this.persist(conversationId, message); // clientMsgId is durable in this same message row
      log.push(message);
      this.logs.set(conversationId, log);
      this.byClientId.set(dedupKey, message);
      return message;
    });
  }

  /** The page after this device's cursor, oldest first; re-sent until the device acks it. */
  sync(conversationId: string, deviceId: string, limit: number): SyncPage {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be >= 1');
    const log = this.logs.get(conversationId) ?? [];
    const cursor = this.cursors.get(key(conversationId, deviceId)) ?? 0;
    const messages = log.slice(cursor, cursor + Math.min(limit, MAX_PAGE));
    return { messages, hasMore: cursor + messages.length < log.length };
  }

  /** Acks drive delivered receipts. Cursors only move forward and never past the last seq. */
  ack(conversationId: string, deviceId: string, seq: number): number {
    if (!Number.isInteger(seq) || seq < 0) throw new RangeError('seq must be >= 0');
    const cursorKey = key(conversationId, deviceId);
    const last = this.logs.get(conversationId)?.length ?? 0;
    const cursor = Math.max(this.cursors.get(cursorKey) ?? 0, Math.min(seq, last));
    this.cursors.set(cursorKey, cursor);
    return cursor;
  }

  // seq = last + 1 must see the previous write, so sends to one conversation run one at a
  // time; different conversations still proceed in parallel.
  private serialize<T>(conversationId: string, task: () => Promise<T>): Promise<T> {
    const result = (this.tails.get(conversationId) ?? Promise.resolve()).then(task);
    const tail = result.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(conversationId, tail);
    void tail.then(() => {
      if (this.tails.get(conversationId) === tail) this.tails.delete(conversationId);
    });
    return result;
  }
}`,
  },
  followUps: [
    {
      question: 'How do you show read receipts in a 500-member group without a write storm?',
      answer:
        'Store one read cursor per member (the highest seq read) rather than a receipt per message, and accept at most one cursor update per conversation every second or two. Push cursor changes only to members viewing the conversation, and compute "read by N" on demand by counting cursors ≥ seq. Large channels skip read receipts.',
    },
    {
      question: 'How would you add message search?',
      answer:
        'Without end-to-end encryption, index messages asynchronously from a change stream into Elasticsearch or OpenSearch, sharded by tenant, and filter results by current membership at query time. With E2EE the server cannot index ciphertext, so each client builds a local index over the messages it holds, which limits search to the history on that device.',
    },
    {
      question: 'How would you run this across several regions?',
      answer:
        'Users connect to the nearest region’s gateways, but each conversation has one home region whose partition owner assigns seqs, so ordering stays single-writer and remote members pay one extra inter-region hop. Logs replicate to a second region; asynchronous replication can lose the last few acknowledged messages in a failover unless sends wait for both regions.',
    },
  ],
};
