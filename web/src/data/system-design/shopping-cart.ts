import type { SystemDesignQuestion } from '../../types/system-design';

export const shoppingCart: SystemDesignQuestion = {
  slug: 'shopping-cart',
  title: 'Design a shopping cart that syncs across devices',
  difficulty: 'Easy',
  companies: ['Amazon'],
  prompt:
    'Design the shopping cart for a large online store. Shoppers add, change and remove items from the app and the website, on several devices, sometimes offline or before signing in, and expect the same cart everywhere. Adding to the cart should essentially never fail. Assume 100M active carts with about 5 items each.',
  signals: [
    'Treats add to cart as a write that must always succeed, and explains how replicas that diverge during offline or concurrent edits converge without losing adds.',
    'Resolves conflicts per line item with a deterministic order and tombstones, and can argue why the merge is commutative, associative and idempotent.',
    'Handles guest carts safely and merges them into the user’s cart at login, with retries that cannot double quantities.',
    'Keeps the cart to product IDs and quantities, and re-validates price and stock at checkout instead of treating the cart as an inventory reservation.',
  ],
  requirements: {
    functional: [
      'Add an item, set its quantity or remove it from any device; the change shows up on the user’s other open devices within seconds.',
      'Let guests build a cart without signing in, and merge the guest cart into the user’s cart at login.',
      'Show the cart with current prices and availability, and hand it to checkout, which re-validates both.',
      'Emit cart change events for analytics, recommendations and abandoned-cart reminders.',
    ],
    nonFunctional: [
      'Add to cart is always accepted, even offline or during a partial outage: the client applies it locally and syncs later.',
      'Replicas converge: concurrent edits from several devices end in the same cart everywhere, and a removed item does not come back.',
      'Cart reads are fast (p99 under ~50 ms), since every page shows the cart badge.',
      'Guest carts expire 30 days after their last change; signed-in carts persist until checkout or removal.',
    ],
    outOfScope: [
      'Payment and order placement beyond the hand-off to checkout.',
      'Catalog, search, pricing rules and recommendations, which the cart calls as services.',
      'Inventory reservation, which happens when the order is placed.',
    ],
  },
  estimates: [
    'Lines: 100M carts × 5 lines = 500M lines; at ~100 B per line, ≈ 50 GB of live data.',
    'With tombstones and metadata, budget ~1 KB per cart: 100M × 1 KB ≈ 100 GB, ≈ 300 GB with 3× replication, so storage is not the hard part.',
    'Writes: if 20M carts change on a given day with ~5 edits each, that is 100M/day ÷ 86,400 s ≈ 1,160/s, ~11,600/s at a 10× sale peak.',
    'Reads: ~10 per write (badge, cart page, checkout) = 1B/day ≈ 11,600/s, ~116,000/s at peak; each is one key lookup of ~1 KB, ≈ 116 MB/s.',
    'Contention: even 5 edits from 2 devices within 5 minutes, each holding a ~10 ms read-merge-write window, collide ≈ 0.03% of the time (4 × 20 ms ÷ 300 s), so compare-and-swap retries are rare.',
  ],
  api: `GET /v1/cart                    Cookie: session=... (signed in) or guest_cart=<128-bit ID>
-> 200 OK  ETag: "41"           (304 Not Modified when If-None-Match matches)
{ "cartId": "u-42", "version": 41, "lines": {
    "B0C1": { "qty": 2, "ts": 1777651200123, "device": "web-9" },
    "B0D7": { "qty": 0, "ts": 1777651300456, "device": "ios-2" } } }
(qty 0 is a tombstone; clients keep it so that their next timestamp is larger)

PUT /v1/cart/lines/{productId}  (set quantity; qty 0 removes; safe to retry)
{ "qty": 3, "ts": 1777651400789, "device": "ios-2" }
-> 200 OK  { "line": { "qty": 3, ... }, "version": 42 }   (line is the winning write)
-> 400 Bad Request  qty outside 0-99, or ts more than 60 s ahead of server time

POST /v1/cart/sync              (after offline edits: send lines, get the merged cart)
{ "lines": { "B0C1": { "qty": 1, "ts": 1777651500000, "device": "ios-2" } } }
-> 200 OK  same body as GET

POST /v1/cart/merge-guest       (at login; the guest cart ID is read only from the cookie)
-> 200 OK  merged cart, Set-Cookie: guest_cart=; Max-Age=0
-> later writes to that guest cart: 410 Gone, and the client re-sends them

Event on the event bus (key cartId):
  CartChanged { cartId, version, changes: [{ productId, qty, prevQty }] }`,
  dataModel: `carts             replicated key-value store (3 AZs), key cart_id; one item per cart
  cart_id       string   "u-<userId>", or "g-<128-bit random>" for a guest cart
  lines         map      productId -> { qty, ts, device }; qty 0 is a tombstone
  version       int      compare-and-swap counter; also the ETag
  owner         string   user ID, or null for a guest cart
  merged_into   string   set on a guest cart after login; later writes get 410
  expires_at    epoch s  store TTL for guest carts: 30 days after the last write
  updated_at    epoch ms last change, for abandoned-cart reminders

A write reads the item, merges, and puts it back only if version is unchanged; on a
conflict it re-reads and re-merges, which is safe because merging is idempotent.`,
  architecture: {
    diagram: ` Devices: apps, browsers                 Other devices of the user
 (local replica + queue)                      ^ "cart changed":
      | line writes, sync                     | refetch with ETag
      v                                       |
 +--------------------------------+      +----+-----------+
 | Cart API (stateless): resolve  |      | Notifier       |
 | cart ID, merge lines, write    |      | (push / SSE)   |
 | by compare-and-swap; merge     |      +----+-----------+
 | the guest cart at login        |           ^
 +----+--------------------+------+           |
      |                    | checkout         |
      v                    v                  |
 +--------------+   +----------------+   +----+-----------+
 | Cart store:  |   | Checkout:      |   | Event bus:     |-> analytics,
 | one item per |   | re-validates   |   | cart changes   |   reminders
 | cart, 3 AZs, |   | price, stock   |   +------------+---+
 | guest TTL    |   +----------------+                ^
 +------+-------+                                     |
        |           change stream                     |
        +---------------------------------------------+`,
    flow: [
      'A device applies each edit to its local replica first, stamps the line with a timestamp and its device ID, and sends it to the cart API, retrying from a queue of pending writes while offline.',
      'The cart API resolves the cart from the session or the guest cookie, merges the incoming lines into the stored cart and writes it back with compare-and-swap, re-merging after a version conflict.',
      'The cart store’s change stream publishes cart-changed events to the event bus, which feeds analytics, abandoned-cart reminders and the notifier.',
      'The notifier tells the user’s other open devices that the cart changed; they refetch it with If-None-Match and merge the response into their replicas.',
      'At login the API merges the guest cart into the user cart with the same function. At checkout, the checkout service re-validates price and stock before the order reserves inventory.',
    ],
  },
  deepDives: [
    {
      heading: 'Merging concurrent edits',
      points: [
        'Each line carries a version (timestamp, device ID). Merging keeps, per product, the line that is greatest in the order (timestamp, then device ID, then quantity), so every replica picks the same winner in any merge order: a last-writer-wins map, a state-based CRDT.',
        'Removing an item writes a tombstone (quantity 0) instead of deleting the line, so an older add from an offline phone loses to the newer removal, and a later re-add beats the tombstone.',
        'A timestamp is max(wall clock, newest timestamp the device has seen + 1), as in a hybrid logical clock, so an edit always beats everything its device has already seen; clock order decides only truly concurrent edits.',
        'Tombstones are dropped after 30 days. An incoming line older than that could revive an item whose tombstone is gone, so it counts only if the product is still in the cart.',
        'The 2007 Amazon Dynamo paper uses the shopping cart as its example of an always-writeable service: divergent versions are merged so an add is never lost, and it notes that deleted items can resurface. Per-line versions with tombstones prevent that resurfacing.',
      ],
    },
    {
      heading: 'Guest carts and login',
      points: [
        'A guest cart ID is 128 random bits in an HttpOnly, Secure, SameSite=Lax cookie. It works as a bearer credential, so it must be unguessable, and guest carts expire 30 days after their last write through the store’s TTL.',
        'At login, the API reads the guest cart named by the cookie (never an ID from the request body), merges it into the user cart with the same function, marks it merged_into that user and clears the cookie.',
        'Because merging is idempotent, a retried or double-submitted login merge cannot double quantities. Late writes from another tab that still holds the guest cookie get 410 Gone, and the client re-sends them to the user’s cart.',
      ],
    },
    {
      heading: 'Writes that never fail, and sync',
      points: [
        'The client applies an edit locally first and queues it, so the page never waits on the server; retries resend the same version, which makes them idempotent.',
        'The store keeps one item per cart, replicated across 3 availability zones. A write is read, merge, compare-and-swap on version; a conflict re-reads and re-merges, which is safe because merging is idempotent.',
        'Adding needs only a product ID, so it succeeds even when the catalog, pricing or inventory service is down; the cart page shows placeholders for what it cannot load.',
        'The notifier sends only a cart-changed message with the new version over the app’s push channel or an SSE connection. Each device refetches with If-None-Match and merges, so a duplicate or stale notification costs one 304.',
      ],
    },
    {
      heading: 'Checkout, prices and stock',
      points: [
        'The cart stores product IDs and quantities, not prices or stock levels; the cart page joins current price and availability from cached catalog and pricing data, so changes show up before checkout.',
        'At checkout, the checkout service re-validates price, stock, purchase limits and shipping eligibility, shows any change for the user to confirm, and only then does the order reserve inventory.',
        'A cart is not an inventory reservation: holding stock for 100M mostly abandoned carts would block real buyers, so adding to a cart never takes stock from another shopper.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Conflict resolution',
      choice: 'Last writer wins per line item, with tombstones',
      rationale:
        'Edits to different items never conflict, and removals stick. Whole-cart versions merged by the application, as the Dynamo paper describes for its cart, never lose an add but can resurface deleted items.',
    },
    {
      decision: 'Quantity semantics',
      choice: 'Set the quantity (last writer wins)',
      rationale:
        'It matches what the user sees and confirms at checkout. A per-device counter would sum two concurrent +1s from a quantity of 1 into 3 rather than 2, but makes set-quantity and remove awkward.',
    },
    {
      decision: 'Guest cart merge at login',
      choice: 'The newer line wins per product',
      rationale:
        'Summing quantities double-counts an item that the user re-added as a guest because they forgot it was already in their cart.',
    },
    {
      decision: 'Storage layout',
      choice: 'One document per cart, written with compare-and-swap',
      rationale:
        'A guest merge is one atomic write, and the guest TTL applies to the whole cart. A row per line avoids read-modify-write, but a cart sees a few writes a day, so conflicts are rare.',
    },
    {
      decision: 'Cross-device sync',
      choice: 'Change notification, then refetch the whole cart',
      rationale:
        'A cart is about 1 KB, so delta sync saves little and adds cursor bookkeeping. A missed notification is caught when the app next comes to the foreground.',
    },
  ],
  failureModes: [
    'A device clock far ahead would win every conflict until real time catches up: the API rejects timestamps more than 60 seconds ahead with 400, and the client corrects its clock from the server’s Date header and retries.',
    'A phone offline for weeks replays stale edits: each merges per line under the usual order, and lines older than the 30-day tombstone horizon count only for products still in the cart, so removed items stay removed.',
    'A cart store node or zone fails: the replicated store fails over, clients keep edits queued locally and retry with the same versions, and alerts fire on the write error rate and on client queue age.',
    'Price or stock changes between add and checkout: checkout re-validation shows the new price or the reduced quantity and asks the user to confirm, and the order’s inventory reservation is the final check.',
    'Lost or duplicated change events: consumers dedupe by (cart ID, version), analytics tolerates at-least-once delivery, and devices also refetch when the app comes to the foreground, so a missed notification only delays sync.',
  ],
  code: {
    label: 'TypeScript: per-line last-writer-wins merge with tombstones and a hybrid clock',
    language: 'TypeScript',
    code: `/** A cart line as last written. qty 0 is a tombstone: it remembers that the item was removed. */
export interface Line { qty: number; ts: number; device: string }
export type Cart = ReadonlyMap<string, Line>; // productId -> line

export const MAX_QTY = 99;

const valid = (l: Line) => Number.isSafeInteger(l.qty) && l.qty >= 0 && l.qty <= MAX_QTY &&
  Number.isSafeInteger(l.ts) && l.ts > 0 && typeof l.device === 'string' && l.device !== '';

/** A strict total order on writes: timestamp, then device ID, then quantity. */
export function newer(a: Line, b: Line): boolean {
  if (a.ts !== b.ts) return a.ts > b.ts;
  if (a.device !== b.device) return a.device > b.device;
  return a.qty > b.qty;
}

// Keeping the greater line per product makes merge commutative, associative and idempotent,
// so replicas converge whatever the order, grouping or repetition of merges.
export function merge(a: Cart, b: Cart): Cart {
  const out = new Map(a);
  for (const [id, line] of b) {
    const mine = out.get(id);
    if (mine === undefined || newer(line, mine)) out.set(id, line);
  }
  return out;
}

// Wall time, but always past every write this replica has seen: a re-add after a removal wins
// even when the clock of this device is behind the clock of the device that removed the item.
export function nextTs(cart: Cart, wallMs: number): number {
  let seen = 0;
  for (const line of cart.values()) seen = Math.max(seen, line.ts);
  return Math.max(Math.floor(wallMs), seen + 1);
}

export function setQty(cart: Cart, id: string, qty: number, device: string, wallMs: number): Cart {
  const line: Line = { qty, ts: nextTs(cart, wallMs), device };
  if (!valid(line)) throw new RangeError('INVALID_LINE');
  return new Map(cart).set(id, line);
}

export const remove = (cart: Cart, id: string, device: string, wallMs: number) =>
  setQty(cart, id, 0, device, wallMs);

/** What the cart page shows: live lines only, in a stable order. */
export function items(cart: Cart): [string, number][] {
  const live: [string, number][] = [];
  for (const [id, line] of cart) if (line.qty > 0) live.push([id, line.qty]);
  return live.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Server side: folds a device's lines or a guest cart into the stored cart, then drops
 * tombstones older than the horizon (e.g., 30 days ago). An incoming line that old could
 * revive an item whose tombstone is gone, so it counts only if the product is still stored.
 */
export function mergeIncoming(stored: Cart, incoming: Cart, horizonTs: number): Cart {
  const accepted = new Map<string, Line>();
  for (const [id, line] of incoming) {
    if (!valid(line)) throw new RangeError('INVALID_LINE');
    if (line.ts >= horizonTs || stored.has(id)) accepted.set(id, line);
  }
  const out = new Map<string, Line>();
  for (const [id, line] of merge(stored, accepted)) {
    if (line.qty > 0 || line.ts >= horizonTs) out.set(id, line);
  }
  return out;
}`,
  },
  followUps: [
    {
      question: 'How would you add saved for later?',
      answer:
        'Add a list field (cart or saved) to each line and version it together with the quantity, so moving an item is one last-writer-wins write and it can never end up in both lists or neither. Checkout reads only the cart list, and saved lines follow the same tombstone rules.',
    },
    {
      question: 'How would you send abandoned-cart reminders?',
      answer:
        'A stream processor consumes CartChanged events and keeps the last activity time per cart. If a signed-in user’s cart still has items after, say, 24 hours without activity or an order, it schedules a reminder, re-reads the cart just before sending, and respects marketing consent and frequency caps.',
    },
    {
      question: 'How would you support a cart shared by a household?',
      answer:
        'Make the cart a resource with members and access control, and keep the same per-line merge, since several people editing is the same problem as several devices. Record who made each change so the cart can show who added what.',
    },
  ],
};
