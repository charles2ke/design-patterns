import type { SystemDesignQuestion } from '../../types/system-design';

export const presenceService: SystemDesignQuestion = {
  slug: 'presence-service',
  title: 'Design an online presence service (who is online)',
  difficulty: 'Easy',
  companies: ['Meta'],
  prompt:
    'Design the presence feature of a chat app: show whether each contact is online and, if not, when they were last seen. Assume 500 million daily active users, 100 million of them online at peak, ~200 contacts per user, and clients that send a heartbeat every 30 seconds.',
  signals: [
    'Detects silent disconnects with heartbeats and TTL leases instead of trusting clean close events.',
    'Sizes heartbeat and status-change traffic with arithmetic and concludes that presence belongs in sharded memory, not a database.',
    'Controls fan-out: publishes changes only to interested subscribers and debounces flapping connections instead of broadcasting every change.',
    'Handles multiple devices, gateway crashes and privacy settings without special cases on the hot path.',
  ],
  requirements: {
    functional: [
      'Show each contact as online, or as offline with a last-seen time.',
      'Update the status of contacts a user is looking at within a few seconds of a real change.',
      'Treat a user with several devices as online while any one of them is connected.',
      'Let users hide their last-seen time from everyone or from non-contacts.',
    ],
    nonFunctional: [
      'Sustain ~3.3M heartbeats/s from 100M concurrent connections.',
      'Freshness: online within ~1 s of connecting; offline within ~60 s of a silent drop, or ~15 s after a clean disconnect.',
      'Best-effort and eventually consistent: a status may be a few seconds stale, but never stale indefinitely.',
      'Presence failures never block messaging; when unsure, show no status rather than a wrong one.',
    ],
    outOfScope: [
      'Message delivery, read receipts and chat storage.',
      'Contact-list management (assume a social-graph service answers who may see whom).',
      'Typing indicators (covered in a follow-up).',
    ],
  },
  estimates: [
    'Heartbeats: 100M online ÷ 30 s ≈ 3.3M heartbeats/s, each a write that is worthless a minute later, so presence state belongs in memory, not in a database.',
    'Gateways: at ~100,000 connections each, 100M ÷ 100,000 = 1,000 gateways, each forwarding ≈ 3,300 heartbeats/s, batched into a few messages per second per presence shard.',
    'Presence state: 100M online users × ~100 B (user ID, device leases, last activity) ≈ 10 GB; ~20 shards for throughput handle ≈ 170,000 heartbeats/s each.',
    'Status changes: 500M DAU × ~20 online/offline transitions per day ÷ 86,400 ≈ 116,000 changes/s.',
    'Fan-out: pushing every change to all ~200 contacts ≈ 23M messages/s; pushing only to the ~5 who have that user on screen ≈ 580,000/s, 40× less.',
    'Last seen: half the changes are offline transitions ≈ 58,000 writes/s; 500M users × ~30 B ≈ 15 GB in a durable key-value store.',
  ],
  api: `Device <-> Gateway: one WebSocket (or MQTT) connection per device, JSON frames
  -> { "type": "heartbeat" }                                  every 30 s
  -> { "type": "subscribe", "userIds": ["u42", "u77"] }       users now on screen
  <- { "type": "status", "userId": "u42", "online": true, "seq": 18 }    current status first
  <- { "type": "status", "userId": "u77", "online": false, "lastSeen": 1767225600000, "seq": 29 }
  -> { "type": "unsubscribe", "userIds": ["u42"] }            chat closed

Gateway <-> presence shard (internal RPC, batched per shard)
  Heartbeat(userId, deviceId)          Disconnect(userId, deviceId)
  Subscribe(gatewayId, userIds) -> current statuses    Unsubscribe(gatewayId, userIds)
  StatusChanged(userId, online, lastSeen, seq)   shard -> subscribed gateways only

lastSeen is omitted whenever the subject hides it from this viewer.`,
  dataModel: `presence         in memory, sharded by hash(user_id); rebuilt from heartbeats on restart
  user_id      string    key
  leases       map       device_id -> lease end (heartbeat + 60 s, capped at close + 15 s)
  seq          int64     monotonic per-user version, incremented on each real transition
  last_active  int64     latest heartbeat or disconnect on any device

subscriptions    in memory, on the shard that owns the watched user
  user_id      string    watched user
  gateways     set       gateway IDs with at least one subscribed client

last_seen        durable KV (e.g. Cassandra or DynamoDB), written on offline transitions
  user_id      string    partition key
  last_seen    int64     epoch ms
  visibility   enum      everyone | contacts | nobody

Heartbeats touch memory only. last_seen is written once per offline transition and
read only for contacts who are offline, filtered by visibility.`,
  architecture: {
    diagram: `  Devices: phone, laptop, web (one persistent connection each)
         | heartbeat every 30 s; subscribe(ids) when a chat opens
         v
 +---------------------+  heartbeat, disconnect  +--------------------+
 |  Gateways (~1,000)  |------------------------>|  Presence shards   |
 |  WebSocket / MQTT,  |  subscribe -> status    |  (~20, in memory)  |
 |  local subscriber   |<------------------------|  by hash(user_id): |
 |  lists per user     |  changes, only to       |  leases, TTL,      |
 +---------------------+  subscribed gateways    |  grace timer       |
                                                 +---------+----------+
                                                           |
                              write on offline transition, |
                                 read for offline contacts v
                                                 +--------------------+
                                                 |  last_seen store   |
                                                 |  (durable KV)      |
                                                 +--------------------+`,
    flow: [
      'Each device holds one WebSocket (or MQTT) connection to a gateway and sends a heartbeat every 30 s; the gateway forwards heartbeats, batched, to the presence shard that owns hash(user_id).',
      'The shard renews that device’s lease to now + 60 s; if the user had no live device, it marks them online and publishes the change.',
      'A clean disconnect shortens the lease to a 15 s grace period, and a silent drop simply stops renewing it; when the user’s last lease ends, the shard publishes offline and writes last_seen.',
      'Changes go only to gateways that have a client subscribed to that user, and each gateway pushes them to those clients.',
      'When a chat or contact list opens, the client subscribes to the users on screen and gets their current status in the reply, with last_seen read from the durable store and filtered by privacy settings.',
    ],
  },
  deepDives: [
    {
      heading: 'Heartbeats, leases and TTL expiry',
      points: [
        'A mobile client can vanish without closing its connection, so liveness comes from heartbeats: each device holds a lease that every heartbeat renews to now + 60 s, two intervals, so one lost heartbeat does not flip the user offline.',
        'MQTT builds this into the protocol: the broker drops a client after 1.5× its keep-alive interval without any packet and publishes the client’s Last Will message, which maps directly to an offline event.',
        'Expiry runs on the owning shard: a timer wheel or once-per-second sweep finds leases that have ended. Status reads compare the lease end with the clock, so they are correct even between sweeps; each pushed change has a per-user sequence.',
        'A gateway crash needs no cleanup: its clients reconnect through other gateways and renew their leases, and the rest stop heartbeating and expire within one TTL, with one offline event each.',
      ],
    },
    {
      heading: 'Fan-out: publish to subscribers, not to every contact',
      points: [
        'Pushing every change to all contacts costs ≈ 116,000 × 200 ≈ 23M messages/s, mostly to people who are not looking. The 2008 Facebook Chat engineering post called keeping users aware of friends’ online states its most resource-intensive operation, more than sending messages.',
        'Subscribe on demand: a client subscribes to the users on its screen (open chats, the visible part of the contact list), and each gateway aggregates its clients, so a shard tracks gateways per watched user, not individual devices.',
        'Gateways track the last sequence delivered to each subscription. A sequence gap triggers an immediate snapshot fetch, and a periodic snapshot revalidation repairs a dropped final event even when both client and gateway stay connected.',
        'Lazy fetch on open: the subscribe reply carries the current status, so opening a chat costs one batched read, and closing it unsubscribes. That trades a small read burst for roughly 40× fewer pushes.',
        'A user watched by many people triggers a burst per change; each gateway still receives one event and fans it out locally, and changes can be coalesced into one digest per gateway every second or two.',
      ],
    },
    {
      heading: 'Flapping, multiple devices and last seen',
      points: [
        'Mobile clients drop and reconnect when they switch networks. On a clean disconnect the shard keeps the lease for a 15 s grace period, so a reconnect inside it produces no events at all.',
        'Leases are per device and presence is per user: the user is online while any device holds a live lease and goes offline only when the last one ends.',
        'Events fire only on real transitions, offline to online or online to offline, never per heartbeat or per device, so subscribers see nothing for a flap shorter than the grace period.',
        'last_seen is the latest heartbeat or disconnect on any device, not the moment the lease expired, which would overstate it by up to the TTL.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Presence store',
      choice: 'Sharded in-memory state keyed by user ID',
      rationale:
        '3.3M heartbeats/s of tiny writes that are worthless a minute later. A database would spend its capacity on durability nobody needs; a lost shard is rebuilt by the next round of heartbeats.',
    },
    {
      decision: 'Liveness detection',
      choice: 'Heartbeats + 60 s TTL leases',
      rationale:
        'Catches silent mobile drops and gateway crashes. Relying only on connection-close events would leave users stuck online forever.',
    },
    {
      decision: 'Notification model',
      choice: 'Pub/sub to subscribed gateways + fetch on open',
      rationale:
        'Roughly 40× fewer pushes than notifying every contact, at the cost of one batched read when a screen opens.',
    },
    {
      decision: 'Offline announcement',
      choice: 'Debounced by a 15 s grace period',
      rationale:
        'Hides network switches and app restarts. The cost is that a real logout shows up to 15 s late, which nobody notices.',
    },
    {
      decision: 'Heartbeat interval',
      choice: '30 s with a 60 s TTL',
      rationale:
        'A 10 s interval would detect drops sooner but triple the load to 10M heartbeats/s and drain batteries; a much longer one leaves ghosts online for minutes.',
    },
  ],
  failureModes: [
    'Gateway crash: its clients reconnect through other gateways within seconds and keep their leases alive; the rest expire within one TTL, so presence heals without a cleanup job.',
    'Presence shard crash: its users would all look offline until heartbeats repopulate the replacement within ~30 s. Report no status during that warm-up and suppress offline events instead of flipping millions of users to offline.',
    'Reconnect storm after a gateway or network outage: millions of reconnects and subscribe calls at once. Clients reconnect with jittered exponential backoff, and gateways rate-limit subscription fetches.',
    'Lost status event (dropped push or gateway restart): clients re-subscribe after reconnecting and receive fresh statuses in the reply, so a missed event is corrected on the next subscribe.',
    'Privacy leak: a user who hides last seen must not leak it through pushes, logs or the subscribe reply. Apply the same visibility check on every path that returns presence.',
  ],
  code: {
    label:
      'TypeScript: per-device leases, offline grace period, multi-device aggregation and subscriber notifications',
    language: 'TypeScript',
    code: `export type PresenceEvent = { userId: string; online: boolean; at: number };
export type Status = { online: boolean; lastSeen?: number };
type Listener = (event: PresenceEvent) => void;
type UserState = { leases: Map<string, number>; lastActive: number }; // deviceId -> lease end

/** One presence shard: users are hashed to shards, gateways forward heartbeats here. */
export class PresenceTracker {
  private readonly users = new Map<string, UserState>(); // users currently announced online
  private readonly lastSeen = new Map<string, number>(); // persisted on the offline transition
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly graceMs: number;

  constructor(now: () => number, ttlMs = 60_000, graceMs = 15_000) {
    if (!(ttlMs > 0 && graceMs >= 0)) throw new RangeError('need ttlMs > 0 and graceMs >= 0');
    this.now = now;
    this.ttlMs = ttlMs;
    this.graceMs = graceMs;
  }

  /** Connect or heartbeat from one device: the lease lives until now + ttlMs (exclusive). */
  heartbeat(userId: string, deviceId: string): void {
    const now = this.now();
    const state = this.users.get(userId);
    if (state) {
      state.leases.set(deviceId, now + this.ttlMs);
      state.lastActive = now;
      return;
    }
    this.users.set(userId, { leases: new Map([[deviceId, now + this.ttlMs]]), lastActive: now });
    this.emit({ userId, online: true, at: now });
  }

  /** Clean close: keep the lease at most graceMs longer, so a quick reconnect is never shown. */
  disconnect(userId: string, deviceId: string): void {
    const now = this.now();
    const state = this.users.get(userId);
    const end = state?.leases.get(deviceId);
    if (state === undefined || end === undefined || end <= now) return;
    state.leases.set(deviceId, Math.min(end, now + this.graceMs));
    state.lastActive = now;
  }

  /** Runs every second: drops dead leases, announces users with no live device left. */
  tick(): void {
    const now = this.now();
    const offline: PresenceEvent[] = [];
    for (const [userId, state] of this.users) {
      for (const [deviceId, end] of state.leases) if (end <= now) state.leases.delete(deviceId);
      if (state.leases.size > 0) continue;
      this.users.delete(userId);
      this.lastSeen.set(userId, state.lastActive);
      offline.push({ userId, online: false, at: state.lastActive });
    }
    for (const event of offline) this.emit(event);
  }

  /** Lazy read: correct even between ticks. Online if any device holds a live lease. */
  status(userId: string): Status {
    const state = this.users.get(userId);
    const now = this.now();
    if (state) for (const end of state.leases.values()) if (end > now) return { online: true };
    return { online: false, lastSeen: state?.lastActive ?? this.lastSeen.get(userId) };
  }

  /** Interested parties only (open chats, online contacts); returns an unsubscribe function. */
  subscribe(userId: string, listener: Listener): () => void {
    const set = this.listeners.get(userId) ?? new Set<Listener>();
    this.listeners.set(userId, set);
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0 && this.listeners.get(userId) === set) this.listeners.delete(userId);
    };
  }

  private emit(event: PresenceEvent): void {
    for (const listener of [...(this.listeners.get(event.userId) ?? [])]) {
      try {
        listener(event);
      } catch {
        // A failing subscriber must not block delivery to the others.
      }
    }
  }
}`,
  },
  followUps: [
    {
      question: 'How do you implement a hide-last-seen setting?',
      answer:
        'Store a visibility setting (everyone, contacts, nobody) and apply it on every path that returns presence, the subscribe reply and pushed events, based on how the viewer relates to the subject. Optionally make it reciprocal, so users who hide their own last seen cannot see anyone else’s. Hiding online status works the same way: the shard never publishes that user’s changes.',
    },
    {
      question: 'How would you add typing indicators?',
      answer:
        'Typing is even more ephemeral than presence: send a typing event over the existing connection to the participants of that one chat only, store nothing, and let the receiver clear it after a few seconds unless it is refreshed. It follows the message routing path, not the presence shards.',
    },
    {
      question: 'How does this work across multiple regions?',
      answer:
        'Gateways in every region forward heartbeats to the presence shard in the user’s home region, so each user has one authoritative state. Changes are published to other regions only where gateways have subscribers, adding cross-region latency, which presence tolerates. If a home region fails, users re-home and reappear online after their next heartbeat.',
    },
  ],
};
