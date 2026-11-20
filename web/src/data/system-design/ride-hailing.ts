import type { SystemDesignQuestion } from '../../types/system-design';

export const rideHailing: SystemDesignQuestion = {
  slug: 'ride-hailing',
  title: 'Design a ride-hailing service (Uber / Lyft)',
  difficulty: 'Hard',
  companies: ['Amazon', 'Lyft', 'Uber'],
  prompt:
    'Design a ride-hailing service like Uber or Lyft. A rider sees a price, requests a ride and is matched with a nearby driver; both sides follow the trip in real time, and the rider pays automatically at the end. Driver phones report GPS every few seconds. Assume 1 million drivers online at peak, each sending a location update every 4 seconds, and 10 million trips per day.',
  signals: [
    'Separates the firehose of short-lived driver locations from the low-rate, durable trip and payment records, and keeps locations out of the primary database.',
    'Builds nearest-driver search on a geospatial cell index with a correct ring-expansion stopping rule, then ranks candidates by road-network ETA rather than straight-line distance.',
    'Prevents double assignment with an atomic compare-and-set on driver state and runs each trip through an explicit, idempotent state machine.',
    'Partitions matching by geography and has concrete answers for region boundaries, surge pricing, stale locations and payment failures.',
  ],
  requirements: {
    functional: [
      'Show an upfront price for a pickup and destination, including any surge multiplier, and let the rider request the ride.',
      'Ingest driver GPS updates every ~4 s and offer each request to a nearby available driver, who accepts or declines.',
      'Track the trip through pickup, start and drop-off, pushing the driver’s live location and the trip status to the rider.',
      'Charge the rider automatically when the trip completes; either side can cancel before the trip starts.',
    ],
    nonFunctional: [
      'Fast matching: candidate search and ranking take well under a second, so time-to-match is dominated by the driver’s response.',
      'A driver is never assigned to two trips, and client retries never create duplicate rides or double charges.',
      'Locations may be a few seconds stale, but trips and payments must be durable.',
      'Fault isolation by geography: losing one city’s partition or one region must not stop matching elsewhere.',
    ],
    outOfScope: [
      'Maps, turn-by-turn navigation and routing-engine internals (assume an ETA service exists).',
      'Driver onboarding, ratings, support tooling and driver payouts.',
      'Pooled rides, scheduled rides and delivery.',
    ],
  },
  estimates: [
    'Location writes: 1M drivers ÷ 4 s = 250,000 updates/s, each useful for only a few seconds, so they belong in memory, not in the primary database.',
    'Ride requests: 10M/day ÷ 86,400 s ≈ 116/s on average and ~350/s at a 3× peak, so location updates outnumber requests ≈ 700:1.',
    'Geo index: 1M drivers × ~200 bytes (position, cell, seq, timestamp, status) ≈ 200 MB, which fits in one machine’s RAM; partitioning is for write throughput and fault isolation, not size.',
    'Live trips: ~350 requests/s × ~20 min from request to drop-off ≈ 420,000 concurrent trips; one position push per trip every 4 s ≈ 105,000 WebSocket messages/s.',
    'Trip-state writes: ~350 rides/s × ~6 transitions ≈ 2,100 writes/s at peak, easy for a sharded relational database.',
    'Location history: 250,000/s × ~100 bytes ≈ 25 MB/s, at most ≈ 2.2 TB/day, streamed through Kafka to object storage.',
  ],
  api: `POST /v1/quotes
{ "pickup": {"lat": 40.7484, "lng": -73.9857}, "dropoff": {...}, "product": "standard" }
-> 200 { "quoteId": "q_81f", "fareCents": 2350, "surgeMultiplier": 1.4,
         "expiresAt": "2025-06-10T18:02:00Z" }

POST /v1/rides                  Idempotency-Key: <uuid created once per request tap>
{ "quoteId": "q_81f", "paymentMethodId": "pm_123" }
-> 201 Created { "rideId": "r_9c2", "status": "MATCHING" }   (retries get the same ride)
-> 409 Conflict (another ride is active)  |  410 Gone (quote expired: re-quote)

Driver WebSocket, client -> server every ~4 s:
{ "type": "location", "seq": 4812, "lat": 40.7411, "lng": -73.9897, "ts": 1749578520000 }
Driver WebSocket, server -> client:
{ "type": "offer", "offerId": "o_77", "rideId": "r_9c2", "pickup": {...}, "ttlSec": 10 }

POST /v1/offers/{offerId}/accept   (or /decline)
-> 200 { "rideId": "r_9c2" }  |  409 Conflict (offer expired or withdrawn)

POST /v1/rides/{rideId}/events   { "type": "ARRIVED" | "START" | "COMPLETE" | "CANCEL" }
-> 200 { "status": "IN_PROGRESS", "version": 7 }  |  409 Conflict (invalid transition)

Rider WebSocket, server -> client: ride_status events and driver_location every ~4 s`,
  dataModel: `geo index        in memory, one per city partition (soft state, rebuilt from updates)
  cell_id   -> set<driver_id>                         H3 res 8-9 (or S2) cell
  driver_id -> (lat, lng, seq, updated_at, cell_id)   evicted ~30 s after last update

driver_state     strongly consistent KV (e.g. DynamoDB), key driver_id
  status        AVAILABLE | OFFERED | ASSIGNED | OFFLINE
  ride_id       nullable: the ride being offered or served
  updated_at    timestamp: a sweeper releases OFFERED rows past the offer timeout

rides            sharded SQL, shard key ride_id
  ride_id       uuid      primary key
  rider_id      uuid      not null
  driver_id     uuid      nullable until ACCEPTED
  status        MATCHING | ACCEPTED | ARRIVED | IN_PROGRESS | COMPLETED | PAID |
                CANCELED | PAYMENT_FAILED
  quote_id, fare_cents, pickup, dropoff, version, created_at, updated_at
outbox           same shard as the ride; rows are published to Kafka after commit

active_rides     key rider_id -> ride_id (insert-if-absent; deleted when the ride ends)
rider_trips      key (rider_id, created_at desc) -> ride_id, for trip history
surge            key (city, cell_id) -> multiplier, refreshed by the stream job

Location writes and nearest-driver queries touch memory only; the databases see trip
transitions (~2k writes/s) and single-key reads.`,
  architecture: {
    diagram: `   Rider app                                    Driver app
       |  HTTPS + WebSocket            WebSocket  |
       v                                          v
 +--------------------------------------------------------+
 |          API gateway  +  WebSocket gateways            |
 +-----+----------------+---------------------+-----------+
       | 2. quote       | 3. request,         | 1. GPS every 4 s
       v                |    trip events      v
 +-----------+          v              +-------------+
 |  Pricing  |   +----------------+    |    Kafka    |---> history,
 |  (surge)  |   |  Ride service  |    |  (by city)  |     surge job
 +-----------+   | state machine  |    +------+------+
                 +---+--------+---+           |
                     |        |               |
                     |        | 4. dispatch   v
                     |        |      +-----------------+
                     |        +----->| Matching (city) |<--> ETA
                     v               | geo index (RAM) |---> offers
              +------------+         +--------+--------+
              |  rides DB  |                  | 5. CAS
              |  + outbox  |                  v
              +-----+------+         +-----------------+
                    | 6. capture     | driver_state KV |
                    v                +-----------------+
              +------------+
              |  Payments  |
              +------------+`,
    flow: [
      'Drivers send GPS points over their WebSocket every 4 s. Gateways publish them to Kafka keyed by city, and that city’s Matching partition applies each point to its in-memory cell index; history archiving and the surge job consume the same topic.',
      'Quote: Pricing prices the route with the pickup cell’s current surge multiplier from the surge job, stores a quote that expires in ~2 minutes and returns it.',
      'Request: the Ride service creates the ride in MATCHING, deduplicated by the idempotency key and an insert-if-absent on active_rides, and asks the city’s Matching partition to dispatch it.',
      'Dispatch: Matching searches expanding rings of cells around the pickup for the nearest fresh, available drivers and ranks that shortlist by road ETA from the ETA service.',
      'Matching claims the best driver with a compare-and-set on driver_state (AVAILABLE → OFFERED) and sends the offer with a ~10 s timeout. An accept sets OFFERED → ASSIGNED and the ride to ACCEPTED; a decline or timeout releases the driver and tries the next one.',
      'Trip events update the ride row conditionally while the rider’s app receives the driver’s position. COMPLETE writes the final fare and an outbox event in one transaction, and a worker captures the payment with ride_id as the idempotency key.',
    ],
  },
  deepDives: [
    {
      heading: 'Location ingestion and the geospatial index',
      points: [
        'Each city partition keeps two in-memory maps: cell → set of driver IDs, and driver → (position, seq, updated_at). Raw points also go to Kafka for history, but nothing on the matching path reads a database.',
        'Cells come from geohash (base-32 rectangles whose edge neighbors can have unrelated prefixes), Google’s S2 (cube faces ordered along a Hilbert curve) or Uber’s open-source H3 (hexagons). H3 cells at resolutions 8 and 9 average about 0.7 and 0.1 square kilometers.',
        'Each update moves the driver from its old cell to the new one, and a per-device sequence number stops delayed packets from moving the car backwards. Locations silent for ~30 s are evicted on read or by a background sweep, so a phone in a tunnel gets no offers.',
        'The index is soft state, rebuilt after a restart from the next 4 s of updates or by replaying the last 30 s of Kafka. Its copy of each driver’s status is only a hint: the authoritative CAS on driver_state turns a stale hint into a skipped candidate, never a double assignment.',
      ],
    },
    {
      heading: 'Finding the best driver and dispatching the offer',
      points: [
        'Search the pickup cell, then expanding rings of neighbors (H3’s gridDisk, formerly kRing). The search is complete only once the next ring’s minimum possible distance exceeds the k-th best distance found; stopping at the first ring with k hits can miss a closer driver just across a cell edge.',
        'Straight-line distance only builds a shortlist of ~10 drivers within a few kilometers. An ETA service ranks it over the road network with live traffic, because a driver 300 m away across a river or a divided highway can be 10 minutes out.',
        'Sequential dispatch offers the ride to one driver at a time with a ~10 s timeout. Batched matching instead collects an area’s requests for 1–2 s and solves an assignment problem that minimizes total ETA, trading a little latency for better global matches in dense areas.',
        'If every candidate declines or times out, widen the radius and retry a bounded number of times, then tell the rider no cars are available instead of retrying forever.',
      ],
    },
    {
      heading: 'Preventing double assignment: driver CAS and the trip state machine',
      points: [
        'Concurrent rides can shortlist the same driver, so claiming is a compare-and-set on driver_state, AVAILABLE → OFFERED(ride): exactly one claim wins and the loser moves to its next candidate. Accept is OFFERED(ride) → ASSIGNED(ride), so a late accept for an offer that already went to another ride fails.',
        'driver_state needs atomic conditional writes that survive failover, such as a DynamoDB condition expression or a single-row UPDATE with WHERE status = AVAILABLE on a synchronously replicated database. A Redis primary replicates asynchronously, so a failover can lose an acknowledged claim and let a second ride take the driver.',
        'A ride moves MATCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED → PAID, with CANCELED allowed before IN_PROGRESS and PAYMENT_FAILED as a retryable branch. Each transition is a conditional update on (ride_id, expected status, version), so duplicate or reordered events from flaky phones become no-ops or 409s.',
        'Driver and ride state live in different stores and are never committed atomically: the driver is claimed first and the ride updated second, and a sweeper releases drivers stuck in OFFERED past the timeout or ASSIGNED to a ride that already ended.',
        'Every client retry carries an idempotency key: POST /rides with the same key returns the same ride, and an insert-if-absent on active_rides stops a double tap from creating two rides.',
      ],
    },
    {
      heading: 'Surge pricing and payment',
      points: [
        'A stream job counts demand (requests and quotes) and supply (available drivers) per H3 cell over a sliding window of a few minutes. A capped, smoothed function turns demand ÷ supply into a multiplier, blended with neighboring cells to avoid sharp price edges.',
        'Pricing locks the pickup cell’s current multiplier into a quote that expires in ~2 minutes, so the rider pays the price they saw; an expired quote returns 410 and the app re-quotes.',
        'Payment is a hold, then a capture: authorize the estimated fare when the ride is requested and capture the final amount at completion. The capture runs from an outbox event with ride_id as the payment provider’s idempotency key, so retries after timeouts never double-charge.',
        'A failed capture (for example an expired card) moves the ride to PAYMENT_FAILED and blocks the next request until the rider fixes the payment method; it never rewinds the completed trip.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Where driver locations live',
      choice: 'In-memory cell index per city, raw points to Kafka',
      rationale:
        'A database with a spatial index (e.g. PostGIS) would pay index maintenance, write-ahead logging and replication for 250,000 writes/s of data that is worthless after 30 s. Redis GEO (geohash scores in a sorted set, GEOSEARCH since 6.2) is a reasonable choice at smaller scale.',
    },
    {
      decision: 'Cell scheme',
      choice: 'H3 hexagons (S2 is equally defensible)',
      rationale:
        'Hexagons have a single kind of neighbor at a near-uniform distance, which keeps ring search and per-cell surge smooth. Geohash is simpler, but its rectangles narrow toward the poles and adjacent cells can share no prefix.',
    },
    {
      decision: 'Dispatch strategy',
      choice: 'Sequential exclusive offers; batched matching in dense areas',
      rationale:
        'Broadcasting each request to many drivers and taking the first accept is faster but makes drivers race for offers that vanish. Greedy nearest-first matching is globally worse than batching when many requests compete for the same drivers.',
    },
    {
      decision: 'Real-time updates',
      choice: 'WebSockets through a gateway tier, push notifications as fallback',
      rationale:
        'Polling every few seconds from hundreds of thousands of apps multiplies request load and adds up to a full interval of latency. Gateways register user → connection so any service can push to a user.',
    },
    {
      decision: 'Partitioning',
      choice: 'Matching partitioned by city, large cities split into groups of cells',
      rationale:
        'Matching is local, so a global index would make every update and query pay cross-region latency and share one failure domain. Boundary requests also query the neighbor partition, and the driver CAS is keyed by driver_id, so no cross-partition lock is needed.',
    },
  ],
  failureModes: [
    'Driver app offline (tunnel, dead battery): updates stop, the location expires after ~30 s so no new offers arrive, and an outstanding offer times out and moves on. Mid-trip, the rider sees the last known position with a reconnecting indicator; the trip is not canceled automatically.',
    'Matching partition crash: a standby acquires the city’s lease (etcd or ZooKeeper) and rebuilds the index from fresh updates or a Kafka replay. Rides stuck in MATCHING are re-dispatched, and the driver CAS and ride transitions are idempotent, so retries cannot double-assign.',
    'WebSocket gateway crash: clients reconnect with backoff to another gateway, re-register in the connection registry and fetch the current ride state over REST, so missed pushes are recovered by reading state rather than replaying messages.',
    'Demand spike (a stadium empties): one area’s requests explode. Surge raises prices and draws drivers in, batching avoids offer storms, and per-partition admission control sheds load before the hot partition falls over.',
    'Payment provider outage: trips still start and finish; capture events wait in the outbox and retry with the same idempotency key, and an alert fires when the backlog’s age grows.',
  ],
  code: {
    label: 'TypeScript: grid index with a correct ring search, stale-location expiry and CAS-based dispatch',
    language: 'TypeScript',
    code: `// Planar sketch: x/y are meters on a local projection (no longitude wrap-around or poles).
// Production keys cells by H3 or S2 instead; the ring-search idea and the CAS carry over.
export interface DriverState { status: 'AVAILABLE' | 'OFFERED' | 'ASSIGNED'; rideId: string | null }
export interface Candidate { id: string; dist: number }
type Position = { x: number; y: number; seq: number; at: number; cell: string };
export const AVAILABLE: DriverState = { status: 'AVAILABLE', rideId: null };
const key = (cx: number, cy: number): string => cx + ':' + cy;

export class DriverIndex {
  private readonly cells = new Map<string, Set<string>>();
  private readonly positions = new Map<string, Position>();
  private readonly states = new Map<string, DriverState>(); // survives location expiry
  private readonly size: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(cellSize: number, ttlMs: number, now: () => number) {
    if (!(cellSize > 0)) throw new RangeError('cellSize must be positive');
    [this.size, this.ttlMs, this.now] = [cellSize, ttlMs, now];
  }

  /** Last write wins by device sequence number, so retried or reordered updates are no-ops. */
  update(id: string, x: number, y: number, seq: number): void {
    const prev = this.positions.get(id);
    if (prev && seq <= prev.seq) return;
    const cell = key(Math.floor(x / this.size), Math.floor(y / this.size));
    if (prev && prev.cell !== cell) this.remove(id, prev.cell);
    this.cells.set(cell, (this.cells.get(cell) ?? new Set<string>()).add(id));
    this.positions.set(id, { x, y, seq, at: this.now(), cell });
    if (!this.states.has(id)) this.states.set(id, AVAILABLE);
  }

  /** Up to k AVAILABLE drivers with a fresh location within maxDist, sorted by (dist, id). */
  nearest(x: number, y: number, k: number, maxDist: number): Candidate[] {
    if (!(maxDist >= 0 && maxDist < Infinity)) throw new RangeError('maxDist must be finite');
    if (!Number.isInteger(k) || k < 1) return [];
    const [cx, cy, now] = [Math.floor(x / this.size), Math.floor(y / this.size), this.now()];
    const best: Candidate[] = [];
    for (let r = 0; ; r++) {
      for (let dx = -r; dx <= r; dx++) {
        // Visit only ring r: full columns where |dx| = r, just the top and bottom cell elsewhere.
        for (let dy = -r; dy <= r; dy += Math.abs(dx) === r ? 1 : 2 * r) {
          const cell = key(cx + dx, cy + dy);
          for (const id of this.cells.get(cell) ?? []) {
            const p = this.positions.get(id);
            if (!p || now - p.at > this.ttlMs) this.remove(id, cell); // expire silent phones
            else if (this.states.get(id)?.status === 'AVAILABLE') {
              const dist = Math.hypot(p.x - x, p.y - y);
              if (dist <= maxDist) best.push({ id, dist });
            }
          }
        }
      }
      best.sort((a, b) => a.dist - b.dist || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).splice(k);
      // Keep the k best. Unvisited cells are all more than r * size away, so stop once the k-th
      // best is closer than that; stopping at the first k hits could miss a nearer driver.
      if (r * this.size > Math.min(maxDist, best[k - 1]?.dist ?? Infinity)) return best;
    }
  }

  /** Atomic compare-and-set; in production a conditional write (e.g. a DynamoDB condition). */
  transition(id: string, from: DriverState, to: DriverState): boolean {
    const cur = this.states.get(id);
    const ok = [from, to].some((s) => cur?.status === s.status && cur.rideId === s.rideId);
    if (ok) this.states.set(id, to); // already in the target state: a retried call is idempotent
    return ok;
  }

  private remove(id: string, cell: string): void {
    const members = this.cells.get(cell);
    if (members?.delete(id) && members.size === 0) this.cells.delete(cell);
    this.positions.delete(id);
  }
}

/** Offer to one driver at a time in road-ETA order; sendOffer is false on decline or timeout. */
export async function dispatch(
  index: DriverIndex, rideId: string, pickup: { x: number; y: number },
  rankByEta: (ids: string[]) => Promise<string[]>, sendOffer: (id: string) => Promise<boolean>,
): Promise<string | null> {
  const offered: DriverState = { status: 'OFFERED', rideId };
  const shortlist = index.nearest(pickup.x, pickup.y, 10, 5_000).map((c) => c.id);
  for (const id of await rankByEta(shortlist)) { // straight-line shortlist, road-ETA order
    if (!index.transition(id, AVAILABLE, offered)) continue; // claimed by another ride meanwhile
    const accepted = await sendOffer(id);
    if (accepted && index.transition(id, offered, { status: 'ASSIGNED', rideId })) return id;
    index.transition(id, offered, AVAILABLE); // declined or timed out: release the driver
  }
  return null;
}`,
  },
  followUps: [
    {
      question: 'How do you handle a rider right at a partition boundary?',
      answer:
        'When the search radius crosses the partition edge, query the neighboring partition in parallel and merge the candidates by ETA. Alternatively, each partition also indexes drivers within a halo of a few kilometers beyond its border. Claims stay correct either way, because the compare-and-set is on driver_state keyed by driver_id, not on the partition.',
    },
    {
      question: 'How do you make ETA ranking fast enough?',
      answer:
        'A routing engine runs shortest-path queries over the road graph with live traffic weights. Speed-up techniques such as contraction hierarchies (or customizable variants that absorb new traffic weights quickly) answer a query in milliseconds, and one-to-many queries rank all ~10 candidates in one call. Uber’s 2022 DeepETA blog post describes a deep learning model that predicts a correction on top of the routing engine’s ETA.',
    },
    {
      question: 'How does the rider’s app get the driver’s live position?',
      answer:
        'Each WebSocket gateway records user_id → gateway_id in a registry (e.g. Redis with a TTL refreshed by heartbeats). A tracking consumer reads the location topic, maps each on-trip driver to the rider through the active ride, and uses the registry to route the update to the rider’s gateway, which pushes it down the socket. One update every ~4 s is enough; the app animates the car between points.',
    },
  ],
};
