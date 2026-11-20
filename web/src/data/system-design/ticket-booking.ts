import type { SystemDesignQuestion } from '../../types/system-design';

export const ticketBooking: SystemDesignQuestion = {
  slug: 'ticket-booking',
  title: 'Design a ticket booking system (Ticketmaster)',
  difficulty: 'Medium',
  companies: ['Google', 'Amazon', 'Meta'],
  prompt:
    'Design a ticketing platform like Ticketmaster. Fans search for events, pick specific seats on a venue map, hold them for a few minutes while they pay, and receive tickets. Assume 100 million monthly users, and plan for the hardest case: a hot on-sale where about 1 million people try to buy 50,000 seats the moment sales open.',
  signals: [
    'Names the core correctness problem (a seat must never be sold twice, even when thousands of buyers click it at once) and solves it with a conditional write in the database that is the source of truth.',
    'Designs holds that expire on their own and closes the race between an expiring hold and a payment that completes late.',
    'Uses a virtual waiting room to turn a 1M-user stampede into a controlled, fair admission rate, sized from the stated numbers.',
    'Keeps the read-heavy browse path (search index, cached seat maps) apart from the small, strongly consistent booking path.',
  ],
  requirements: {
    functional: [
      'Search and browse events by performer, venue, city and date.',
      'View an event’s seat map with near-real-time availability, and hold up to 8 specific seats for 10 minutes while checking out.',
      'Pay to confirm the booking and receive tickets; released or expired holds return the seats to sale.',
      'Queue buyers fairly during high-demand on-sales.',
    ],
    nonFunctional: [
      'No double booking: each seat is sold at most once, even under extreme contention for the same seats.',
      'Stay up and fair during on-sales: a 1M-user spike must turn into a queue rather than errors, and early refreshers or bots must not get ahead.',
      'Holds and confirmations are strongly consistent; browsing and seat maps may be a few seconds stale.',
      'Fast answers on the booking path: p99 under ~500 ms for a hold, so buyers quickly learn whether they got the seats.',
    ],
    outOfScope: [
      'Pricing, dynamic pricing and the resale marketplace.',
      'Ticket delivery (barcodes, wallet passes) and venue entry scanning.',
      'Organizer tools for creating events and drawing venue maps.',
    ],
  },
  estimates: [
    'Browsing: assume 1B searches and event-page views per month ÷ 2,592,000 s ≈ 390/s on average (≈ 1,200/s at a 3× peak), which a search index and CDN-cached pages handle easily.',
    'Hot on-sale demand: 50,000 seats ÷ ~2.5 seats per order = 20,000 orders, so with 1M people competing only 2% can succeed; 98% leave without tickets and should learn that quickly and fairly.',
    'Stampede: 1M users × ~3 requests in the first minute ÷ 60 s ≈ 50,000 requests/s at the edge, which must land on a static waiting-room page on the CDN, not on the booking service.',
    'Admitting 100 buyers/s with ~5-minute checkouts keeps 100/s × 300 s ≈ 30,000 shoppers active. At 50% conversion, 20,000 orders need 40,000 admissions ≈ 400 s ≈ 7 minutes; draining all 1M would take 10,000 s ≈ 2.8 h, so the other 960,000 learn it sold out.',
    'Database: 100 admissions/s × ~3 hold attempts × 2.5 seats ≈ 750 conditional row updates/s, easy for one relational primary; the hard part is contention on the same rows, not throughput.',
    'Seat map: 50,000 seats × 1 bit = 6,250 bytes ≈ 6 KB availability bitmap. 30,000 shoppers refreshing every 2 s ≈ 15,000 reads/s, so it is served from a cache rebuilt every 1-2 s, never from the seats table.',
  ],
  api: `GET  /v1/events?q=jazz&city=Seattle&from=2025-07-01&cursor=<opaque>
-> 200 { events: [{ eventId, name, venue, startsAt, onSaleAt, minPrice }], nextCursor }
GET  /v1/events/{id}/seats
-> 200 { layoutUrl, asOf, available: "<base64 bitmap, 1 bit per seat>" }
       layoutUrl is the static venue map on the CDN; the bitmap may be ~2 s stale

POST /v1/events/{id}/holds     X-Admission-Token: <signed token>
     { seatIds: ["A-12", "A-13"] }
-> 201 Created { holdId, seatIds, expiresAt }   (expires in 10 minutes)
-> 409 Conflict (a seat is held or sold; nothing was held, so refresh the map)
-> 403 Forbidden (missing or expired admission token)  |  429 (per-account hold limit)

POST /v1/holds/{id}/confirm    Idempotency-Key: <uuid>
     { paymentMethodId }
-> 200 OK { bookingId, tickets }   (a retry with the same key returns the same booking)
-> 410 Gone (hold expired or released; the card authorization is voided)
-> 402 Payment Required (card declined; the hold remains until it expires)
DELETE /v1/holds/{id}          -> 204 No Content  |  403 Forbidden (not the holder)`,
  dataModel: `events       PRIMARY KEY (event_id)   venue_id, name, starts_at, on_sale_at, status
             streamed by CDC into the search index (full text, location, date range)
seat_layouts PRIMARY KEY (venue_id, layout_version)   static JSON published to the CDN

seats        PRIMARY KEY (event_id, seat_id)   one row per seat per event
  status          text       AVAILABLE | HELD | SOLD
  hold_id         uuid       set while HELD; kept after the sale as the booking reference
  holder_id       bigint     the buyer who owns the hold
  hold_expires_at timestamp  a HELD row past this time counts as AVAILABLE
  version         bigint     bumped on every write; the compare-and-set token

holds        PRIMARY KEY (hold_id)          event_id, user_id, seat_ids, expires_at, state
bookings     PRIMARY KEY (booking_id)       UNIQUE (hold_id), user_id, amount, created_at
payments     PRIMARY KEY (idempotency_key)  hold_id, provider_auth_id, state, amount

Hold = one transaction, one statement per seat in seat_id order:
  UPDATE seats SET status = 'HELD', hold_id = ?, holder_id = ?, hold_expires_at = ?,
         version = version + 1
  WHERE event_id = ? AND seat_id = ? AND version = ?   -- the version just read as free
Any UPDATE that changes 0 rows -> ROLLBACK and 409. Confirm checks hold_id, holder_id
and hold_expires_at > now(), then sets SOLD with the same version CAS.`,
  architecture: {
    diagram: `  Buyers (web and mobile apps)
    |
    v
  +----------------------+ on-sale traffic +-----------------------+
  | CDN / edge           |---------------->| Waiting room          |
  | static pages and     |<----------------| random queue order,   |
  | seat layouts         | admission token | admits N buyers/s     |
  +----------------------+                 +-----------------------+
    | requests carrying a valid token
    v
  +----------------------+ search, browse  +-----------------------+
  | API gateway          |---------------->| Event search index    |
  | token check,         |                 | (fed from the events  |
  | rate limits          |                 | table by CDC)         |
  +----------------------+                 +-----------------------+
    | seat map, hold, confirm
    v
  +----------------------+ authorize,      +-----------------------+
  | Booking service      | capture, void   | Payment provider      |
  |                      |---------------->| (idempotency keys)    |
  |                      |<----------------|                       |
  +----------------------+ result          +-----------------------+
    |                 |
    | conditional     | availability
    | UPDATEs         | bitmap reads
    v                 v
  +-------------+   +-----------------------+
  | Inventory   |-->| Seat-map cache        |
  | DB (source  |   | refreshed every 1-2 s |
  | of truth)   |   +-----------------------+
  +-------------+`,
    flow: [
      'Buyers reach the site through the CDN, which serves static pages and venue layouts; the API gateway sends searches and browsing to an event search index that change data capture keeps in sync with the events table.',
      'During a hot on-sale, the edge routes buyers to the waiting room, which orders them randomly and admits N buyers per second by issuing short-lived signed admission tokens; the gateway rejects booking calls without a valid token.',
      'An admitted buyer loads the seat map: the layout from the CDN plus an availability bitmap that the booking service reads from the seat-map cache, which is rebuilt from the inventory database every 1-2 seconds.',
      'To hold seats, the booking service runs one transaction of conditional UPDATEs on the seat rows (AVAILABLE or expired → HELD for 10 minutes, version + 1); if any seat does not match, it rolls back and returns 409.',
      'At checkout, it authorizes the payment with the provider, marks the seats SOLD in one transaction only if the hold is unexpired and owned by the buyer, and then captures the payment; if the confirm fails, it voids the authorization.',
    ],
  },
  deepDives: [
    {
      heading: 'Holding seats without double booking',
      points: [
        'Seat rows in a relational database are the source of truth. A hold reads the requested seats, checks that each is AVAILABLE or HELD with an expired hold, and then updates every row in one transaction WHERE version matches the version it read.',
        'Row locks serialize concurrent writers on the same seat: of thousands of simultaneous holds, exactly one matches the version, and the rest change 0 rows, roll back and get 409. All-or-nothing transactions mean a group never ends up with half its seats.',
        'Updating rows in seat_id order makes overlapping multi-seat holds take row locks in the same order, so they cannot deadlock. A single UPDATE whose WHERE clause checks status and expiry directly works too and saves the read.',
        'Expired holds count as free in the check itself, so a seat returns to sale the instant its hold lapses; a sweeper only tidies rows and refreshes the seat map, and correctness never depends on it running on time.',
        'A Redis lock per seat (SET NX with a 10-minute TTL) can shed load before the database, but it is only an optimization: Redis replication is asynchronous, so a lock can vanish in a failover, and the database write still decides.',
      ],
    },
    {
      heading: 'Hold expiry versus payment completion',
      points: [
        'The race: a buyer submits payment at 9:59, the hold expires at 10:00, and another buyer takes the seat at 10:01 while the first payment is still processing. Charging a buyer who gets no seat and selling the seat twice must both be impossible.',
        'Order the steps: authorize the card (no money moves), confirm in one transaction that flips the seats HELD → SOLD only if the hold ID and buyer match and the hold is unexpired, then capture. If the confirm fails, void the authorization.',
        'Extend the hold once by a few minutes when the buyer starts paying, so slow card checks or 3-D Secure challenges rarely expire a hold mid-payment; a single, bounded extension keeps seats from being held indefinitely.',
        'Confirm is idempotent: payment calls carry an idempotency key derived from the hold, and a retry after a timeout finds the seats already SOLD by that hold and returns the same booking instead of charging again.',
        'A reconciliation job compares the provider’s authorizations and captures with bookings, voiding or refunding orphans left by crashes between steps.',
      ],
    },
    {
      heading: 'Waiting room and bots during an on-sale',
      points: [
        'Before the sale, buyers wait on a static queue page served by the CDN. At on-sale time, everyone already waiting gets a random position, so arriving a few seconds early or refreshing gives no advantage.',
        'The waiting room admits buyers at a set rate by issuing short-lived signed tokens (an HMAC over user, event and expiry) that the gateway verifies without a database lookup; booking calls without a valid token get 403.',
        'The rate follows feedback: it slows when hold latency or database load climbs and speeds up as shoppers finish. Once every seat is held or sold, admission pauses, and the queue hears it is sold out as soon as nothing is left.',
        'Against bots: verified accounts (phone or payment card), per-account and per-card ticket limits enforced in the booking path, challenges for suspicious sessions, and device and behavior signals; orders that break the limits are canceled after the sale.',
      ],
    },
    {
      heading: 'Search and seat maps',
      points: [
        'Events live in the relational database, and change data capture streams them into a search index (for example OpenSearch) for full-text, location and date queries, so browsing never touches the booking database.',
        'A seat map has two parts: a static layout (coordinates, sections, price tiers) published to the CDN once per venue configuration, and a small availability bitmap that changes every second during an on-sale.',
        'The bitmap is rebuilt from the seats table every 1-2 s and served from a cache with a matching TTL. Staleness is harmless because the hold is decided in the database, and a 409 tells the client to refresh its map.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Source of truth for seat state',
      choice: 'Relational database with transactional conditional updates',
      rationale:
        'Transactions give all-or-nothing multi-seat holds and row locks that serialize buyers of the same seat. A Redis-only design can lose recent writes in a failover because its replication is asynchronous, and at ~750 row updates/s the database is not the bottleneck.',
    },
    {
      decision: 'Concurrency control',
      choice: 'Optimistic version checks (compare-and-set)',
      rationale:
        'Losers learn at once that the seat is gone, and no lock is held across a round trip to the application. Pessimistic SELECT ... FOR UPDATE is also correct but queues every buyer of a hot seat behind the current lock holder.',
    },
    {
      decision: 'Hold length',
      choice: '10 minutes, extended once when payment starts',
      rationale:
        'Long enough to enter payment details, short enough that abandoned carts free seats quickly. Without holds, buyers could lose a seat after typing their card number; open-ended holds would let bots sit on inventory.',
    },
    {
      decision: 'On-sale traffic control',
      choice: 'Virtual waiting room with signed admission tokens',
      rationale:
        'Admitting a controlled rate keeps the booking path fast and the order random and fair. Letting 1M users hit the APIs would overload the stack and reward bots, and plain rate limiting rejects requests at random instead of queueing people.',
    },
    {
      decision: 'Seat-map freshness',
      choice: 'Cached availability bitmap, 1-2 s stale',
      rationale:
        'Querying the seats table for every refresh would add ≈ 15,000 reads/s to the database during an on-sale. A stale map only causes an occasional 409, which the hold path already handles.',
    },
  ],
  failureModes: [
    'Inventory database primary fails during an on-sale: holds and confirms error. Fail over to a synchronously replicated standby so no committed hold or sale is lost, pause admission while it is promoted, and let clients retry; holds survive because they are rows, not server memory.',
    'Payment provider slow or down: confirms back up and holds expire mid-payment. Alert on provider latency and errors, apply the one-time extension to holds already in payment, slow admission, and route to a second provider if one is integrated.',
    'Abandoned holds: buyers close the tab and the map shows seats taken that nobody will buy. Expired holds count as free in the hold check immediately, a sweeper resets the rows and refreshes the bitmap, and the waiting room admits more buyers as seats return.',
    'Bots and scalpers: bursts of holds from many accounts, or hold-and-release cycles that keep seats off the market. Detect them with per-account, per-card and per-device velocity checks, cap holds per buyer, challenge suspicious sessions, and cancel violating orders.',
    'Hot seats: thousands of buyers click the same front-row seats, so most holds fail and retries pile up. Offer best-available allocation that picks free seats with SELECT ... FOR UPDATE SKIP LOCKED, spreading buyers across the section instead of colliding on a few rows.',
  ],
  code: {
    label: 'TypeScript: seat holds with version checks, expiry and idempotent confirm',
    language: 'TypeScript',
    code: `export interface Seat {
  id: string;
  status: 'AVAILABLE' | 'HELD' | 'SOLD';
  version: number; // bumped on every write: the compare-and-set token
  holdId: string | null; // kept after the sale as the booking reference
  holderId: string | null;
  expiresAt: number; // only meaningful while HELD
}

export interface Hold {
  holdId: string;
  seatIds: string[];
  expiresAt: number; // for the checkout countdown; the seat rows are the source of truth
}

/** The database: commit applies all writes only if every row still has its expected version. */
export interface SeatStore {
  read(seatIds: readonly string[]): Promise<Seat[]>; // rows that exist, in request order
  commit(writes: { expected: number; next: Seat }[]): Promise<boolean>;
}

const HOLD_MS = 10 * 60_000;
const MAX_SEATS = 8;
const ATTEMPTS = 3;

const write = (seat: Seat, patch: Partial<Seat>) =>
  ({ expected: seat.version, next: { ...seat, ...patch, version: seat.version + 1 } });

// Expired holds count as free, so seats return to sale without waiting for a sweeper.
const isFree = (s: Seat, now: number): boolean =>
  s.status === 'AVAILABLE' || (s.status === 'HELD' && s.expiresAt <= now);

export class SeatInventory {
  private readonly store: SeatStore;
  private readonly now: () => number;

  constructor(store: SeatStore, now: () => number) {
    this.store = store;
    this.now = now;
  }

  /** All or nothing: null (HTTP 409) if any seat is held or sold by someone else. */
  async hold(userId: string, seatIds: string[]): Promise<Hold | null> {
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const seats = await this.load(seatIds);
      const now = this.now();
      if (!seats.every((s) => isFree(s, now))) return null;
      const holdId = crypto.randomUUID();
      const expiresAt = now + HOLD_MS;
      const patch: Partial<Seat> = { status: 'HELD', holdId, holderId: userId, expiresAt };
      if (await this.store.commit(seats.map((s) => write(s, patch)))) {
        return { holdId, seatIds: [...seatIds], expiresAt };
      }
    }
    return null; // still contended after retries: report the seats as taken
  }

  /** Runs after the payment is authorized; retrying with the same hold is safe. */
  async confirm(userId: string, hold: Hold): Promise<'CONFIRMED'> {
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const seats = await this.load(hold.seatIds);
      const ours = (s: Seat) => s.holdId === hold.holdId && s.holderId === userId;
      if (seats.every((s) => s.status === 'SOLD' && ours(s))) return 'CONFIRMED'; // a retry
      const now = this.now();
      if (!seats.every((s) => s.status === 'HELD' && ours(s) && now < s.expiresAt)) {
        throw new Error('Hold expired or not yours'); // the caller voids the authorization
      }
      const sold = seats.map((s) => write(s, { status: 'SOLD' }));
      if (await this.store.commit(sold)) return 'CONFIRMED'; // else re-check: rows changed
    }
    throw new Error('Seats changed concurrently; retry');
  }

  /** False if the hold no longer covers any seat, or if a concurrent write ended it first. */
  async release(userId: string, hold: Hold): Promise<boolean> {
    const seats = await this.load(hold.seatIds);
    const held = seats.filter((s) => s.status === 'HELD' && s.holdId === hold.holdId);
    if (held.some((s) => s.holderId !== userId)) throw new Error('Not the holder');
    const patch: Partial<Seat> = { status: 'AVAILABLE', holdId: null, holderId: null };
    return held.length > 0 && this.store.commit(held.map((s) => write(s, patch)));
  }

  private async load(seatIds: readonly string[]): Promise<Seat[]> {
    const n = new Set(seatIds).size; // an empty list would make every() vacuously true
    if (n < 1 || n > MAX_SEATS || n !== seatIds.length) throw new RangeError('Invalid seat list');
    const seats = await this.store.read(seatIds);
    if (seats.length !== n) throw new RangeError('Unknown seat');
    return seats;
  }
}`,
  },
  followUps: [
    {
      question: 'How would you sell general-admission tickets with no assigned seats?',
      answer:
        'Replace seat rows with a counter per section: a hold increments held by n only while sold + held + n ≤ capacity and inserts a hold row with an expiry; a sweeper subtracts expired holds from held. One counter row is a hot spot, so split capacity into several bucket rows and try them in random order.',
    },
    {
      question: 'How do you handle the traffic spike when an on-sale is announced?',
      answer:
        'Announcement traffic is read-only (event pages and search), so the CDN and the search index serve it with long cache lifetimes. Pre-registration or presale codes measure demand ahead of time, size the waiting room, and allow a lottery when demand far exceeds supply.',
    },
    {
      question: 'How would this run across multiple regions?',
      answer:
        'Give each event a home region whose database owns its seat rows and serves all its holds and confirms, while the CDN, search and waiting-room pages run everywhere. Inventory partitions naturally by event, so cross-region consensus on every write would add latency for little benefit. If the home region fails, the event fails over to a replica in another region.',
    },
  ],
};
