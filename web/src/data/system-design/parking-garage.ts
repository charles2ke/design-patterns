import type { SystemDesignQuestion } from '../../types/system-design';

export const parkingGarage: SystemDesignQuestion = {
  slug: 'parking-garage',
  title: 'Design a parking garage reservation and payment system',
  difficulty: 'Easy',
  companies: ['Amazon'],
  prompt:
    'Design the reservation and payment system for a chain of parking garages. Drivers reserve a spot type (compact, regular, EV or accessible) for a time window or just drive up; gates recognize the car by plate or QR code, and the driver pays at exit, including any overstay. Assume 1,000 garages with about 500 spots each, and gates that must keep working through internet outages.',
  signals: [
    'Prevents double-booking with an invariant the database enforces on half-open time ranges, rather than a check-then-insert in application code.',
    'Models the reservation lifecycle (hold, authorize, confirm, check in, capture) with expiring holds and idempotency keys, so abandoned checkouts free spots and retries never charge twice.',
    'Keeps gates working offline with an edge controller in each garage, and reconciles queued events idempotently when the link returns.',
    'Computes fees deterministically in integer cents (hourly rounding, daily maximum, overstay) from a versioned rate card.',
  ],
  requirements: {
    functional: [
      'Search availability and price by garage, spot type and time window, then reserve with a short hold while the payment is authorized.',
      'Admit cars at entry by license plate recognition or a QR code, including drive-ups without a reservation when space allows.',
      'Compute the fee at exit (hourly rate, daily maximum, overstay past the reserved end) and capture the payment exactly once.',
      'Let drivers cancel or extend reservations, and operators manage levels, spots, blocked spots and rate cards, including dynamic prices.',
    ],
    nonFunctional: [
      'Never give two overlapping reservations the same spot, even when many drivers book the same window concurrently.',
      'Gates decide in under a second and keep working for hours without a connection to the cloud.',
      'Exactly-once charges from the driver’s point of view, despite client retries, payment timeouts and replayed gate events.',
      'Availability search may be a few seconds stale; booking itself is strongly consistent per garage.',
    ],
    outOfScope: [
      'Navigation to the garage and indoor wayfinding to the spot.',
      'The plate recognition model and the barrier hardware; the system consumes their events.',
      'Monthly permits, valet operations and street parking enforcement.',
    ],
  },
  estimates: [
    'Inventory: 1,000 garages × 500 spots = 500,000 spots; at ~3 stays per spot per day, 1.5M stays/day ÷ 86,400 s ≈ 17/s on average.',
    'Bookings: if 40% of stays are reserved, 600,000 reservations/day ≈ 7/s, ~70/s at a 10× peak before big events, which one Postgres primary handles easily.',
    'Gate events: 2 per stay = 3M/day ≈ 35/s overall, but bursty: emptying a 500-spot garage in 30 minutes means ~17 exits/minute, so lanes must decide locally and fast.',
    'Plate images: 3M/day × ~200 KB ≈ 600 GB/day, ≈ 18 TB at 30-day retention, so images go to object storage and the database keeps references.',
    'Reservation rows: 600,000/day × 365 × ~1 KB ≈ 220 GB/year, so one Postgres cluster holds years of history; shard by garage only if write load demands it.',
    'Edge cache: a garage sees ~1,500 stays/day (500 × 3), ~600 of them reserved; at ~1 KB each, the next 24 hours fit in under 1 MB per controller.',
  ],
  api: `GET /v1/garages/{garageId}/availability?type=ev&start=2026-05-01T09:00Z&end=...T13:00Z
-> 200 OK  { "type": "ev", "available": 6, "quoteCents": 1600, "rateCardVersion": 31 }

POST /v1/reservations                       Idempotency-Key: 3f1c9a7e-...
{ "garageId": "g-42", "type": "ev", "plate": "7ABC123", "paymentMethodId": "pm_9",
  "start": "2026-05-01T09:00Z", "end": "2026-05-01T13:00Z" }
-> 201 Created  { "id": "r-81", "status": "held", "spot": "L2-114",
                  "holdExpiresAt": "2026-04-20T18:10Z", "quoteCents": 1600 }
-> 409 Conflict (sold out, or the same key is still in flight)
-> 422 Unprocessable Content (same key reused with a different body)

POST /v1/reservations/{id}/confirm          (after the payment authorization succeeds)
-> 200 OK  { "status": "confirmed", "qr": "<signed token>" }  |  410 Gone (hold expired)
DELETE /v1/reservations/{id}                (cancel: void the authorization)

Edge controller <-> cloud (mutual TLS, one controller pair per garage):
GET  /v1/edge/{garageId}/sync?since=8812    -> changes for the next 24 h, rate card, keys
POST /v1/edge/{garageId}/events             (batched, at-least-once, oldest first)
[{ "eventId": "uuid", "lane": "N2", "type": "exit", "plate": "7ABC123",
   "at": "2026-05-01T13:20Z", "feeCents": 2200 }]        -> 200 OK { "acked": [...] }`,
  dataModel: `spots              Postgres, one row per physical spot
  spot_id       uuid         primary key
  garage_id     uuid         index (garage_id, type, pool)
  label, level  text         e.g. "L2-114", "L2"
  type          enum         compact | regular | ev | accessible
  pool          enum         reservable | drive_up (operators can move spots)
  status        enum         active | blocked (maintenance)

reservations       Postgres; a booking touches one garage, so shard by garage_id if needed
  id            uuid         primary key
  user_id       uuid         UNIQUE (user_id, idempotency_key), plus request_hash
  spot_id       uuid         also plate, quote_cents, rate_card_version, payment_id
  during        tstzrange    [start, end): back-to-back bookings do not conflict
  status        enum         held, confirmed, checked_in, completed, expired, canceled
  hold_expires  timestamptz  lapsed holds are marked expired by bookings and a sweeper
  EXCLUDE USING gist (spot_id WITH =, during WITH &&)
    WHERE (status IN ('held', 'confirmed', 'checked_in'))      -- needs btree_gist

stays              one row per visit, reserved or drive-up
  stay_id, garage_id, plate, reservation_id (null for drive-ups), entered_at,
  exited_at, fee_cents; UNIQUE (entry_event_id) turns replayed events into no-ops

gate_events        append-only, partitioned by day
  event_id (lane-generated UUID, primary key), garage_id, lane, type, plate, at, image_key

A booking is one short transaction on one garage. Lanes never query Postgres;
they read the edge controller cache, which sync deltas keep current.`,
  architecture: {
    diagram: ` Driver app                              Lanes: plate camera, QR reader
      |                                        | plate / QR    ^ open
      v                                        v               |
 +-----------------+                     +---------------------+---+
 | Reservation API |                     | Edge controller per     |
 | holds, quotes   |                     | garage: 24 h cache,     |
 +---+---------+---+                     | fees, durable queue     |
     |         | authorize               +-----+---------------+---+
     |         v                               ^               |
     |   +-------------+    capture            | sync          | events
     |   | Payment svc |<-------------+        | deltas        | (UUIDs)
     |   +-------------+              |        |               |
     v                                |        |               v
 +----------------------+          +--+--------+------------------+
 | Postgres: spots,     |          | Edge sync + event ingest     |
 | reservations         |<-------->| (dedupes by event ID)        |
 | (EXCLUDE), stays     |  read,   +------------------------------+
 | and gate events      |  write
 +----------------------+`,
    flow: [
      'The driver app searches availability and posts a reservation with an Idempotency-Key; the reservation API inserts a held row on a free spot of that type, and the exclusion constraint in Postgres rejects any overlapping insert.',
      'The API has the payment service authorize the quoted amount and then confirms the reservation; a hold that is never confirmed expires after 10 minutes and frees its spot.',
      'The edge sync service sends each garage’s edge controller a versioned delta of the next 24 hours of reservations, the rate card and the QR signing keys.',
      'At entry and exit the lane sends the plate or QR code to the edge controller, which checks it against its cache, computes the exit fee and opens the barrier.',
      'The controller queues every gate event with a UUID and uploads it when online; ingest dedupes by event ID, records the stay in Postgres and has the payment service capture the final amount.',
    ],
  },
  deepDives: [
    {
      heading: 'Preventing double-booking',
      points: [
        'Store each reservation as a half-open range [start, end) on one spot, so a stay ending at 11:00 and one starting at 11:00 do not conflict, and let Postgres enforce it with EXCLUDE USING gist (spot_id WITH =, during WITH &&).',
        'A check-then-insert in application code races: two requests both see the spot free and both insert. With the constraint, the loser gets SQLSTATE 23P01 and the API retries on the next candidate spot, or returns 409 when none is left.',
        'The constraint’s WHERE clause cannot call now(), so a lapsed hold keeps blocking its range until it is marked expired. The booking transaction expires lapsed holds on its candidate spots first, and a sweeper catches the rest.',
        'On a key-value store, the equivalent is one item per spot and 15-minute slot, all written in one conditional transaction that fails if any slot exists. A day-long stay touches 96 items, so long stays favor the relational constraint.',
      ],
    },
    {
      heading: 'Spots, capacity and drive-ups',
      points: [
        'Booking a specific spot gives the driver a spot number and suits EV chargers and accessible spots, but fragments inventory: 9–11 on spot A and 11–13 on spot B reject a 10–12 request, though only one spot is busy at any instant.',
        'Alternatively, sell capacity per type and 15-minute bucket and assign any free spot at entry. That never runs out while cars stay within their windows, because the cars present at any instant never outnumber the reservations sold for it.',
        'Drive-ups have no end time, so they use a separate pool per type that operators can resize by time of day; the edge controller admits one only while that pool has free spots.',
        'Keep ~5% of each type unsold as a buffer for overstays, early arrivals and blocked spots, and let the controller reassign an arriving driver whose spot is still occupied.',
      ],
    },
    {
      heading: 'Holds, pricing and payment',
      points: [
        'Lifecycle: held (10-minute TTL) → confirmed (payment authorized) → checked_in → completed, or expired or canceled. Each transition is a conditional update on the current status, so a confirm after expiry fails cleanly with 410.',
        'The API stores (user, idempotency key, request hash, result). A retry returns the original reservation, the same key with a different body gets 422 and a retry while the first is in flight gets 409, as the IETF Idempotency-Key draft suggests.',
        'Authorize the quote at confirmation and capture at exit. Authorizations expire after a window set by the card network and processor, so bookings made far ahead are authorized closer to the start time.',
        'Fees are integer cents from a versioned rate card: each started hour charged in full, capped per 24 hours, plus overstay from the reserved end once past a grace period. A reservation keeps its quote even if dynamic pricing changes the rate card.',
      ],
    },
    {
      heading: 'Gates without the cloud',
      points: [
        'Each garage runs an active-standby pair of edge controllers that pull a versioned delta of the next 24 hours of reservations, the rate card and QR keys, so lanes decide locally in milliseconds.',
        'QR codes are signed tokens (reservation ID, plate, window, expiry) verified with a cached public key. An offline controller accepts only reservations in its synced active inventory; unknown reservations require online reconciliation.',
        'The cloud does not resell a canceled spot for a garage until that garage acknowledges the revocation delta. During a partition, cached cancellations are rejected and unsynchronized inventory remains reserved, preventing a canceled QR from sharing capacity with a new booking.',
        'Plates are matched against the cache with fuzzy matching for look-alike characters (O and 0, B and 8); a low-confidence read falls back to the QR code, a ticket or the intercom.',
        'Every entry and exit goes to a durable local queue with a UUID and is uploaded when the link returns; the cloud dedupes by event ID. Exits fail open: the barrier lifts and the fee is captured later.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Double-booking guard',
      choice: 'Exclusion constraint on (spot_id, time range)',
      rationale:
        'The database enforces the invariant under any concurrency. A FOR UPDATE lock on the spot row also works, but only if every code path remembers to take it.',
    },
    {
      decision: 'Unit of inventory',
      choice: 'A specific spot per reservation',
      rationale:
        'Drivers get a spot number, and EV and accessible spots need one anyway. Capacity counters per type and 15-minute bucket avoid fragmentation, but need up to 96 counter updates per day of stay and spot assignment at entry.',
    },
    {
      decision: 'Hold expiry',
      choice: 'Checked inside the booking transaction, plus a sweeper',
      rationale:
        'A lapsed hold frees its spot immediately. A timer or delayed queue alone leaves the spot blocked whenever the timer runs late or is lost.',
    },
    {
      decision: 'Gate decisions',
      choice: 'Local edge controller with a cached schedule',
      rationale:
        'Lanes keep working through outages and answer in milliseconds. Calling the cloud for every car is simpler but turns any network blip into a line of cars at the barrier.',
    },
    {
      decision: 'Payment timing',
      choice: 'Authorize at confirmation, capture at exit',
      rationale:
        'The final amount, including overstay, is known only at exit. Charging upfront needs refunds and second charges; authorizing only at exit risks a decline after the car has left.',
    },
  ],
  failureModes: [
    'A garage loses its internet link: lanes use cached reservation status and queue events durably; the cloud withholds resale of unsynchronized allocations, and the gate rejects unknown reservations until it can reconcile their status.',
    'Plate misreads from dirt, glare or look-alike characters: fall back to the QR code, a ticket or the intercom, and alert when a camera’s match rate drops, which usually means it is dirty or misaligned.',
    'Replayed or duplicated gate events after reconnecting: a unique entry_event_id on stays makes ingest idempotent, and an exit without a matching entry opens a review case instead of guessing a fee.',
    'An overstaying car occupies the next reservation’s spot: the controller reassigns the arriving driver to a free spot of the same type from the buffer and bills the overstay at exit.',
    'The payment provider times out during capture: the outcome is unknown, so retry with the same idempotency key (reservation ID + "capture") until it resolves; a new key could charge twice.',
  ],
  code: {
    label: 'TypeScript: half-open overlap checks, expiring holds, idempotency keys and capped fees',
    language: 'TypeScript',
    code: `export type SpotType = 'compact' | 'regular' | 'ev' | 'accessible';
export interface Interval { start: number; end: number } // epoch ms, half-open: [start, end)
export interface BookingRequest extends Interval { userId: string; plate: string; type: SpotType }
export interface Reservation extends BookingRequest {
  id: string; spotId: string; status: 'held' | 'confirmed' | 'expired'; holdExpiresAt: number;
}
export interface RateCard {
  hourlyCents: number; dailyMaxCents: number; // every started hour in full, capped per 24 h
  overstayHourlyCents: number; graceMs: number; // grace: lateness forgiven before overstay
}

const HOUR = 3_600_000;
// [9:00, 11:00) and [11:00, 13:00) do not overlap: back-to-back stays share a boundary.
export const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export class ReservationBook {
  private readonly spots: ReadonlyMap<string, SpotType>;
  private readonly now: () => number;
  private readonly holdMs: number;
  private readonly byId = new Map<string, Reservation>();
  private readonly byKey = new Map<string, { fingerprint: string; r: Reservation }>();
  private seq = 0;

  constructor(spots: ReadonlyMap<string, SpotType>, now: () => number, holdMs = 10 * 60_000) {
    this.spots = spots;
    this.now = now;
    this.holdMs = holdMs;
  }

  // Like the booking transaction: lapsed holds are expired before overlaps are checked.
  private refresh(r: Reservation): Reservation {
    if (r.status === 'held' && this.now() >= r.holdExpiresAt) r.status = 'expired';
    return r;
  }

  book(idempotencyKey: string, req: BookingRequest): Reservation {
    const key = JSON.stringify([req.userId, idempotencyKey]); // keys are scoped per user
    const fingerprint = JSON.stringify([req.plate, req.type, req.start, req.end]);
    const prior = this.byKey.get(key);
    if (prior !== undefined) {
      if (prior.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_KEY_REUSED'); // 422
      return { ...this.refresh(prior.r) }; // the original result, even if the hold expired
    }
    if (!Number.isSafeInteger(req.start) || !Number.isSafeInteger(req.end) ||
      req.start >= req.end || req.end <= this.now()) throw new RangeError('INVALID_WINDOW');
    const busy = new Set<string>();
    for (const r of this.byId.values()) {
      if (this.refresh(r).status !== 'expired' && overlaps(r, req)) busy.add(r.spotId);
    }
    for (const [spotId, type] of this.spots) {
      if (type !== req.type || busy.has(spotId)) continue;
      const r: Reservation = { ...req, id: 'r' + ++this.seq, spotId, status: 'held',
        holdExpiresAt: this.now() + this.holdMs };
      this.byId.set(r.id, r);
      this.byKey.set(key, { fingerprint, r });
      return { ...r };
    }
    throw new Error('SOLD_OUT'); // 409; not recorded, so a retry with the same key tries again
  }

  /** Called once the payment authorization succeeds; safe to repeat. */
  confirm(id: string): Reservation {
    const r = this.byId.get(id);
    if (r === undefined) throw new Error('NOT_FOUND');
    if (this.refresh(r).status === 'expired') throw new Error('HOLD_EXPIRED'); // 410
    r.status = 'confirmed';
    return { ...r };
  }
}

/** Integer cents for a stay of ms: started hours in full, at most dailyMax per 24 hours. */
export function charge(ms: number, hourlyCents: number, dailyMaxCents: number): number {
  if (!(ms > 0)) return 0;
  const hours = Math.ceil(ms / HOUR);
  const block = (h: number) => Math.min(h * hourlyCents, dailyMaxCents);
  return Math.floor(hours / 24) * block(24) + block(hours % 24);
}

/** At exit: the quote fixed at booking, plus overstay billed from the reserved end. */
export function exitFee(rate: RateCard, quoteCents: number, reservedEnd: number, exitAt: number) {
  const late = exitAt - reservedEnd;
  if (late <= rate.graceMs) return quoteCents;
  return quoteCents + charge(late, rate.overstayHourlyCents, rate.dailyMaxCents);
}`,
  },
  followUps: [
    {
      question: 'How would you add dynamic pricing?',
      answer:
        'A pricing job publishes versioned rate cards per garage, spot type and time bucket from occupancy forecasts and nearby events. A reservation stores its quote and rate card version, so later price changes never alter what the driver agreed to, and drive-ups pay the rate in effect at entry. Limit how fast prices move and show the current price at the entrance.',
    },
    {
      question: 'How does a driver extend a reservation while parked?',
      answer:
        'Extending updates the range to [start, new end) in one transaction, which the exclusion constraint accepts only if the spot stays free. If a later booking holds that spot, move that not-yet-arrived booking to another free spot of the same type, since the parked car cannot move itself. If nothing is free, decline the extension and let overstay pricing apply.',
    },
    {
      question: 'How do you stop a copied QR code from being used twice?',
      answer:
        'A signature proves the token is genuine, not that the reservation is still valid. Controllers check the synced active/revoked status and track entry state to prevent reuse. The cloud does not resell a canceled allocation until the garage acknowledges its revocation; an offline controller rejects unknown reservations and shares its local state with its standby.',
    },
  ],
};
