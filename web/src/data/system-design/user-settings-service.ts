import type { SystemDesignQuestion } from '../../types/system-design';

export const userSettingsService: SystemDesignQuestion = {
  slug: 'user-settings-service',
  title: 'Design a user settings and preferences service',
  difficulty: 'Easy',
  companies: ['OpenAI'],
  prompt:
    'Design the backend for the settings page of an AI assistant app: theme, language, notification preferences, privacy toggles and model or response-style preferences. Settings sync across a user’s web, desktop and mobile clients, and workspace admins can enforce some of them. Assume 50 million daily active users who load their settings on every app start, about 10 times a day, while changes are rare.',
  signals: [
    'Defines a typed settings registry (type, default, allowed values, scope) and validates every write instead of storing client-supplied JSON blobs.',
    'Resolves layers (default → workspace policy → user → device) and enforces admin-locked settings on the server, not just in the UI.',
    'Prevents lost updates from concurrent devices with field-level patches and version checks (If-Match, 412 on conflict).',
    'Designs the read-heavy path around caching, small conditional responses and pushing changes to other open clients.',
  ],
  requirements: {
    functional: [
      'Return the effective settings for a user on a given device and mark which values are locked by workspace policy.',
      'Update one or more settings atomically; reject unknown keys, wrong types and values outside the allowed set.',
      'Let workspace admins set defaults and lock values (for example, forcing data sharing for model training off) that members cannot override.',
      'Reflect a change made on one device on the user’s other open clients within seconds.',
      'Audit changes to sensitive settings and support export and deletion of a user’s settings.',
    ],
    nonFunctional: [
      'Reads sit on the app-start path: p99 under ~50 ms, and clients fall back to cached values instead of blocking startup.',
      'No lost updates: concurrent writes to different keys both survive, and conflicting read-modify-write edits are detected.',
      'Read-your-writes on the writing device; other devices converge within a few seconds.',
      'Sensitive privacy choices are never silently reset by a client bug or a schema migration.',
    ],
    outOfScope: [
      'Feature flags and A/B experiments, which belong to a separate system (they may read settings such as language for targeting).',
      'The settings UI itself and per-conversation state such as chat history.',
      'Authentication and workspace membership (assume an identity service).',
    ],
  },
  estimates: [
    'Reads: 50M DAU × 10 app starts/day = 500M reads/day ÷ 86,400 s ≈ 5,800/s on average, ~17,000/s at a 3× peak.',
    'Writes: if 10% of DAU change one setting a day, that is 5M writes/day ÷ 86,400 s ≈ 58/s, so reads outnumber writes 100:1.',
    'Storage: 200M registered users × ~2 KB of overrides (only non-default values are stored) ≈ 400 GB, ≈ 1.2 TB with 3× replication, which a few shards keyed by user ID hold easily.',
    'Payload: ~200 keys × ~40 bytes ≈ 8 KB of resolved JSON; at peak 17,000/s × 8 KB ≈ 140 MB/s, most of which ETag revalidation (304, no body) eliminates.',
    'Cache: 50M daily users × ~2 KB ≈ 100 GB of Redis; the registry and workspace policies are tiny and live in every server’s memory.',
    'Propagation: polling every 30 s from 5M concurrently open clients (10% of DAU) would cost 5M ÷ 30 ≈ 167,000 requests/s, ~10× the app-start peak, so push invalidations instead.',
  ],
  api: `GET /v1/me/settings?device=ios-7f3a
If-None-Match: "42.7.12"        (versions of the user doc, workspace policy and registry)
-> 304 Not Modified              (the common case on app start: no body)
-> 200 OK  ETag: "42.7.12"  Cache-Control: private, no-cache
{
  "values": { "ui.theme": "dark", "ui.language": "fr", "privacy.train_on_chats": false },
  "locked": ["privacy.train_on_chats"]
}

PATCH /v1/me/settings            Content-Type: application/merge-patch+json
If-Match: "42.7.12"              (optional; the server compares the user-doc version, 42)
{ "ui.theme": "light", "notify.email_digest": null }       (null = reset to inherited)
-> 200 OK  ETag: "43.7.12"  { ...effective settings... }
-> 400 Bad Request  { "errors": [{ "key": "ui.theme", "code": "NOT_ALLOWED" }] }
-> 403 Forbidden (locked by policy)  |  412 Precondition Failed (stale: refetch, retry)

PATCH /v1/me/devices/{deviceId}/settings   (only keys the registry marks per-device)
GET   /v1/settings/registry                (versioned; cacheable by the CDN and clients)
PUT   /v1/admin/workspaces/{id}/policy     (admins only; validated and audited)
POST  /v1/me/settings/export  |  DELETE /v1/me/settings    (privacy requests, async)

Push to the other open clients: { "type": "settings.changed", "version": 43 }`,
  dataModel: `setting_definitions  registry: code-reviewed config, versioned, loaded by every server
  key            string   primary key, namespaced by owner, e.g. "notify.email_digest"
  type           enum     boolean | string | number
  default_value  json     used when no layer sets the key
  allowed        json     enum values or {min, max}
  per_device     bool     may be overridden per device
  sensitive      bool     changes are written to the audit log
  status         enum     active | deprecated (with replaced_by) | removed

workspace_policies   one row per workspace, cached in memory by version
  workspace_id   string   primary key
  version        int64    part of the ETag of every member
  defaults       json     { key: value } used unless the user overrides it
  locked         json     { key: value } enforced over user and device values

user_settings        partitioned by user_id (key-value store or sharded Postgres)
  user_id        string   primary key
  version        int64    bumped on every write; writes are conditional on it
  user_values    json     overrides only, typically < 2 KB
  device_values  json     { deviceId: { key: value } }

cache_fences         Redis, per user_id; minimum version allowed in cache or returned to clients
  Writers advance the fence before committing a newer version; reads and cache refills use a Lua
  CAS that rejects values below the fence. Keep it beyond the maximum in-flight read time.

settings_audit       append-only, partitioned by user_id, sorted by ts
  user_id, ts, key, old_value, new_value, actor, device_id, request_id

App start = one get by user_id (Redis first) + the in-memory registry and policy.
A write = one conditional update: ... SET ..., version = version + 1 WHERE version = $v`,
  architecture: {
    diagram: ` Web / desktop / mobile clients <---------------+
      |  GET   (If-None-Match)                  | settings.changed
      |  PATCH (If-Match)                       | (SSE / WebSocket)
      v                                         |
 +--------------------+               +---------+--------+
 |  Settings service  |               | Realtime gateway |
 |  registry + policy |               +---------+--------+
 |  cached in memory  |                         ^
 +---+------------+---+                         |
     |            |                   +---------+--------+
     | get,       | read on miss,     |  Kafka: changes  |--> audit log
     | delete     | conditional write +---------+--------+
     v            v                             ^
 +-------+  +----------------------------+      |
 | Redis |  | user_settings + outbox     |------+
 +-------+  +----------------------------+  outbox relay`,
    flow: [
      'On app start the client sends GET with its last ETag; the settings service reads the user document from Redis (the user_settings table on a miss) and resolves it against the in-memory registry and workspace policy.',
      'If the ETag (user-doc, policy and registry versions) still matches, it answers 304 with no body; otherwise 200 with the effective values and the list of locked keys.',
      'A PATCH carries only the changed keys; the service validates them against the registry and the policy locks, commits them with one conditional update that bumps the version, and deletes the cached document.',
      'An outbox row written in the same transaction is relayed to Kafka as settings.changed, which feeds the audit log and the realtime gateway.',
      'The gateway nudges the user’s other open clients over SSE or WebSocket; they refetch with If-None-Match, and offline clients catch up on their next start or reconnect.',
    ],
  },
  deepDives: [
    {
      heading: 'Typed registry and layered resolution',
      points: [
        'Every setting is declared in a code-reviewed registry: key, type, default, allowed values or range, whether it may vary per device, sensitivity and owner. Unknown keys and invalid values fail with 400, so clients can never store arbitrary blobs.',
        'Resolution order is locked workspace value → device override → user override → workspace default → registry default. The response lists locked keys so the UI can disable them and explain that an admin manages them.',
        'Only overrides are stored. Changing a default reaches everyone who never touched the setting, and "reset to default" just deletes the override.',
        'Locks are enforced on the server: writing a locked key returns 403 and resolution ignores existing overrides of it, so an old or modified client cannot bypass policy.',
      ],
    },
    {
      heading: 'Concurrent writes from multiple devices',
      points: [
        'Whole-document PUTs lose updates: the phone switches the theme while the laptop turns off email digests, and whichever save lands second silently erases the other.',
        'PATCH carries only the changed keys (JSON Merge Patch, null = reset), so edits to different keys both survive; same-key races resolve last-writer-wins, which is acceptable for preferences.',
        'Read-modify-write values, such as a list of muted topics or a free-text instruction, send If-Match with the version they read; a mismatch returns 412 and the client refetches, reapplies its edit and retries.',
        'The server must also write atomically: a conditional update (WHERE version = $v) retried on a lost race, or per-key updates inside the store. Checking the version first and writing later reintroduces the race.',
      ],
    },
    {
      heading: 'Read path, caching and change propagation',
      points: [
        'Every app start reads settings, so the hot path is one Redis get of a ~2 KB document by user ID, with the registry and workspace policies held in process memory.',
        'The ETag combines the user-doc, policy and registry versions, so a new lock or default also changes it; an up-to-date client gets a 304 with no body.',
        'Other open clients receive a settings.changed nudge carrying only the new version over the app’s existing realtime channel. It carries no values, so a lost or duplicated push is harmless: the client just revalidates.',
        'Clients also revalidate on foreground and reconnect, with a slow conditional poll as a safety net, so a missed push delays convergence but never leaves a client stale for long.',
      ],
    },
    {
      heading: 'Schema evolution, audit and privacy',
      points: [
        'Adding a setting is a registry change with a default. Nothing is backfilled because only overrides are stored, and older clients ignore keys they do not know.',
        'Renames and type changes use expand and contract: add the new key, translate old values on read and in a background backfill, stop writing the old key, then delete it once no supported client reads it.',
        'A stored value that no longer validates (say, a removed enum option) falls through to the next layer instead of breaking resolution, and a migration rewrites it explicitly.',
        'Keys marked sensitive write an audit record (actor, old and new value, device, request ID). Export returns overrides and audit history; deletion removes them, keeping only what a retention rule requires.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Storage shape',
      choice: 'One small document per user holding only overrides',
      rationale:
        'One key lookup per app start and a single version for If-Match. A row per (user, key) avoids read-modify-write but turns every load into a range read with no document version.',
    },
    {
      decision: 'Write semantics',
      choice: 'Field-level PATCH with optional If-Match',
      rationale:
        'Edits to different keys from different devices never conflict. A whole-document PUT with mandatory If-Match is also correct, but turns every concurrent edit into a 412 and a retry.',
    },
    {
      decision: 'Change propagation',
      choice: 'Version-only push plus ETag revalidation',
      rationale:
        'Idempotent and order-insensitive. Pushing full values needs per-client ordering and dedup, and polling alone every 30 s would cost ~167,000 requests/s.',
    },
    {
      decision: 'Schema',
      choice: 'Central typed registry with server-side validation',
      rationale:
        'Enables validation, admin locks and safe migrations. Free-form client JSON ships faster but accumulates junk keys and cannot enforce policy.',
    },
    {
      decision: 'Settings vs. feature flags',
      choice: 'Separate systems',
      rationale:
        'Settings are durable, user-owned and audited; flags are operator-owned, targeted and usually temporary. One shared store would mix lifecycles and let experiments overwrite user choices.',
    },
  ],
  failureModes: [
    'Settings service or store down at app start: clients render from their last cached copy (or built-in defaults), queue edits and replay them as field-level PATCHes later, so an outage costs freshness, not startup.',
    'Stale cache refill: a slow reader can return with version 42 after version 43 commits. Writers advance a per-user minimum-version fence before commit; cache refill atomically rejects any value below that fence, and readers retry from the database instead of restoring stale data.',
    'Lost change events after a crash between commit and publish: the transactional outbox makes the event part of the commit; the relay delivers at least once and consumers dedupe by (user_id, version).',
    'A buggy client release resets a privacy toggle for many users: validation cannot catch a valid but wrong value, so the audit log identifies affected users and prior values for a targeted restore, and per-user write rate limits contain runaway loops.',
    'An admin locks the wrong value for a large workspace: policies are versioned and audited, so rollback is one write, and it changes every member’s ETag so clients pick it up.',
  ],
  code: {
    label: 'TypeScript: typed validation, layered resolution with admin locks and versioned patches',
    language: 'TypeScript',
    code: `export type Value = string | number | boolean;
export type ErrorCode = 'UNKNOWN_KEY' | 'WRONG_TYPE' | 'NOT_ALLOWED' | 'LOCKED' | 'STALE_VERSION';

export interface SettingDef {
  type: 'string' | 'number' | 'boolean';
  default: Value;
  allowed?: readonly Value[]; // e.g. ['system', 'light', 'dark']
  min?: number; max?: number; // inclusive range for numbers
  perDevice?: boolean; // may differ per device, e.g. notification sound
}
// Maps rather than plain objects, so a key such as "__proto__" is simply unknown.
export type Registry = ReadonlyMap<string, SettingDef>;
export type Layer = ReadonlyMap<string, Value>;
export interface Policy { defaults: Layer; locked: Layer } // set by workspace admins
export interface UserDoc {
  version: number; // bumped by every write; the user-doc part of the ETag
  user: Layer; // overrides only, never resolved values
  devices: ReadonlyMap<string, Layer>;
}

const fail = (code: ErrorCode, key: string): never => {
  throw Object.assign(new Error(code + ': ' + key), { code });
};

function problem(def: SettingDef | undefined, v: unknown): ErrorCode | null {
  if (def === undefined) return 'UNKNOWN_KEY';
  if (typeof v !== def.type) return 'WRONG_TYPE';
  const inRange = typeof v !== 'number' ||
    (Number.isFinite(v) && v >= (def.min ?? -Infinity) && v <= (def.max ?? Infinity));
  return inRange && (def.allowed?.includes(v as Value) ?? true) ? null : 'NOT_ALLOWED';
}

/** Locked policy value > device > user > workspace default > registry default. */
export function resolve(reg: Registry, policy: Policy, doc: UserDoc, deviceId: string) {
  const device = doc.devices.get(deviceId);
  const out = new Map<string, { value: Value; locked: boolean }>();
  for (const [key, def] of reg) {
    const locked = policy.locked.has(key);
    const own = [def.perDevice ? device?.get(key) : undefined, doc.user.get(key)];
    // A lock hides user values; a value that no longer validates (old schema) falls through.
    const value = (locked ? [policy.locked.get(key)] : [...own, policy.defaults.get(key)])
      .find((v) => v !== undefined && problem(def, v) === null) ?? def.default;
    out.set(key, { value, locked });
  }
  return out;
}

export interface Patch {
  changes: ReadonlyMap<string, unknown>; // untrusted; null resets a key (JSON Merge Patch)
  deviceId?: string; // write the device layer instead of the user layer
  ifMatch?: number; // version from If-Match; omit for per-key last-writer-wins
}

export function applyPatch(reg: Registry, policy: Policy, doc: UserDoc, patch: Patch): UserDoc {
  const { deviceId, ifMatch } = patch;
  if (ifMatch !== undefined && ifMatch !== doc.version) fail('STALE_VERSION', 'If-Match'); // 412
  // Validate every change before applying any, so a patch is all-or-nothing.
  for (const [key, value] of patch.changes) {
    const def = reg.get(key);
    const code = value === null && def ? null : problem(def, value); // null resets the key
    if (code !== null) fail(code, key); // HTTP 400
    if (value !== null && policy.locked.has(key)) fail('LOCKED', key); // HTTP 403
    if (deviceId !== undefined && !def?.perDevice) fail('NOT_ALLOWED', key);
  }
  // Copy-on-write: readers holding the old document never see a half-applied patch.
  const layer = new Map(deviceId === undefined ? doc.user : doc.devices.get(deviceId));
  for (const [key, value] of patch.changes) {
    if (value === null) layer.delete(key);
    else layer.set(key, value as Value);
  }
  const devices = deviceId === undefined ? doc.devices : new Map(doc.devices).set(deviceId, layer);
  return { version: doc.version + 1, user: deviceId === undefined ? layer : doc.user, devices };
}

export interface SettingsStore {
  get(userId: string): Promise<UserDoc>;
  // Atomic compare-and-set: UPDATE ... SET doc = $3 WHERE user_id = $1 AND version = $2
  putIfVersion(userId: string, expected: number, next: UserDoc): Promise<boolean>;
}

// Even without If-Match the write must be atomic: if another device won, re-read and re-apply.
export async function update(store: SettingsStore, reg: Registry, policy: Policy,
  userId: string, patch: Patch): Promise<UserDoc> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await store.get(userId);
    const next = applyPatch(reg, policy, doc, patch); // throws if If-Match is now stale
    if (await store.putIfVersion(userId, doc.version, next)) return next;
  }
  throw new Error('Too much contention, retry later'); // HTTP 503
}`,
  },
  followUps: [
    {
      question: 'How is this different from a feature-flag or experimentation service?',
      answer:
        'Settings are explicit, durable user choices with a schema, read-your-writes and an audit trail. Flags and experiments are operator-controlled rules evaluated against attributes, usually temporary, and need sticky, unbiased assignment. Keep them separate: a flag can decide whether a new setting is shown and experiments can target on settings such as language, but an experiment must never overwrite a stored preference.',
    },
    {
      question: 'How do you handle privacy export and deletion requests?',
      answer:
        'Both run as idempotent background jobs keyed by request ID. Export gathers overrides, device values and audit history into a machine-readable file and notifies the user. Deletion removes the user_settings row, cache entries and any audit records not covered by a retention rule; backups and analytics copies age out within their own retention windows.',
    },
    {
      question: 'What if a user belongs to several workspaces?',
      answer:
        'Declare in the registry whether a key is account-wide (language, theme) or per workspace (default model, data sharing), and store per-workspace overrides keyed by (user, workspace). Resolution takes the active workspace as an input, and the ETag includes that workspace’s policy version.',
    },
  ],
};
