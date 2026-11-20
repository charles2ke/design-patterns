import type { SystemDesignQuestion } from '../../types/system-design';

export const jobScheduler: SystemDesignQuestion = {
  slug: 'job-scheduler',
  title: 'Design a distributed job scheduler',
  difficulty: 'Hard',
  companies: ['Amazon', 'Microsoft', 'OpenAI', 'Uber'],
  prompt:
    'Design a distributed job scheduler. Tenants submit one-off jobs, delayed jobs that run at a given time, recurring cron jobs, and workflows whose steps depend on each other, such as a CI pipeline. A shared fleet of workers with different capabilities (GPU, operating system) runs the jobs, and no accepted job may be lost when schedulers or workers crash. Assume 100 million job runs per day with a 3× peak, an average run time of two minutes and 30 days of run history.',
  signals: [
    'States the delivery contract up front: at-least-once execution with leases, retries and idempotent jobs, plus fencing tokens so a worker whose lease expired cannot commit a result.',
    'Finds due work with indexed or time-bucketed scans spread across shards, each with its own leader, instead of one hot scheduler loop.',
    'Treats time precisely: cron in an explicit time zone, defined behavior across DST gaps and overlaps, and a missed-schedule policy after downtime.',
    'Keeps a shared fleet fair and well matched: per-tenant quotas, priorities without starvation, capability-based worker pools and DAG dependencies.',
  ],
  requirements: {
    functional: [
      'Submit one-off jobs (run now), delayed jobs (run at or after a timestamp) and recurring jobs defined by a cron expression and an IANA time zone.',
      'Submit workflows as a DAG of steps: a step starts only after all of its dependencies succeed, and a failed step skips its dependents.',
      'Retry failed runs with exponential backoff up to a maximum number of attempts, then move them to a dead-letter queue for inspection and replay.',
      'Honor priorities, per-tenant quotas and worker requirements such as GPU type, operating system or custom labels.',
      'Pause, resume, trigger and cancel jobs, and show every run’s state, attempts, timing and last error.',
    ],
    nonFunctional: [
      'Durable, at-least-once execution: an accepted job is never lost, and a run whose worker dies is retried once its lease expires.',
      'Timely: p99 schedule delay (actual start minus due time) under ~5 s at peak for runs that are not held back by quotas.',
      'No single scheduler process: losing a node pauses time-driven work for its shards for seconds, and capacity grows by adding shards and workers.',
      'Fair: one tenant’s burst cannot starve other tenants, and low-priority work still runs eventually.',
      'Observable: queue lag per pool (now minus the oldest due run), schedule delay, run duration percentiles, and retry, lease-expiry and dead-letter rates.',
    ],
    outOfScope: [
      'Sandboxing the job code itself (assume workers run each job in a container).',
      'Log storage and build artifacts (assume an object store and a log pipeline).',
      'Autoscaling the worker fleet; the scheduler only exports per-pool queue depth and lag as the scaling signal.',
    ],
  },
  estimates: [
    'Run starts: 100M/day ÷ 86,400 s ≈ 1,160/s on average; plan for a 3× peak ≈ 3,500/s.',
    'Cron bursts: if 1M jobs are scheduled for 00:00, starting them at 3,500/s takes 1M ÷ 3,500 ≈ 286 s (almost 5 minutes), so popular times need opt-in jitter or spare capacity.',
    'In flight (Little’s law): 3,500/s × 120 s ≈ 420,000 concurrent runs at peak; at 8 slots per worker that is 420,000 ÷ 8 ≈ 52,500 workers.',
    'State changes: 4 row writes per run (insert, claim, finish, history row) × 3,500/s ≈ 14,000 writes/s at peak.',
    'Heartbeats: 420,000 leases ÷ 10 s ≈ 42,000 renewals/s, 3× all state changes. Batch them per worker (52,500 ÷ 10 ≈ 5,250 RPCs/s); 56,000 writes/s ÷ 16 clusters ≈ 3,500/s per primary.',
    'History: 100M runs/day × ~1 KB ≈ 100 GB/day; 30 days ≈ 3 TB, ≈ 190 GB per cluster, kept in daily partitions that are dropped whole instead of deleted row by row.',
  ],
  api: `POST /v1/jobs                                 Idempotency-Key: <uuid>  (dedupes retries)
{
  "name": "nightly-report",
  "schedule": { "cron": "0 9 * * 1-5", "timeZone": "America/New_York",
                "misfire": "run_once", "overlap": "forbid" },  (or "runAt" for one-off)
  "requires": ["os=linux", "gpu=a100"], "priority": 5, "timeoutSec": 3600,
  "retry": { "maxAttempts": 5, "baseBackoffMs": 1000, "maxBackoffMs": 300000 },
  "payload": { "image": "reports:1.4", "args": ["--day", "yesterday"] }
}
-> 201 Created  { "jobId": "j_7Qx2", "nextRunAt": "2026-01-15T14:00:00Z" }
-> 400 Bad Request (bad cron, zone or labels)  |  429 Too Many Requests (tenant quota)

POST /v1/workflows  { "steps": [{ "id": "build" }, { "id": "test", "needs": ["build"] }] }
-> 201 Created  { "workflowId": "w_31" }  |  400 Bad Request (cycle or unknown step)

POST /v1/jobs/{jobId}:pause | :resume | :trigger        POST /v1/runs/{runId}:cancel
-> 200 OK  |  404 Not Found  |  409 Conflict (run already finished)

Worker RPCs (gRPC; Claim long-polls for up to 20 s)
Claim(pools, labels, maxRuns)         -> [{ runId, fence, attempt, leaseUntil, payload }]
Heartbeat([{ runId, fence }])         -> per run: { leaseUntil, cancel } | LEASE_LOST
Complete(runId, fence, result)        -> OK | LEASE_LOST
Fail(runId, fence, error, retryable)  -> RETRY_AT(time) | DEAD_LETTERED | LEASE_LOST`,
  dataModel: `jobs           PostgreSQL: 256 logical shards by hash(root_id) on 16 clusters
  job_id         uuid         primary key; root_id = workflow_id for DAG steps
  tenant_id      uuid         not null; quotas and fairness are per tenant
  schedule       text         cron expression + IANA zone; null for one-off jobs
  misfire        text         skip | run_once | catch_up (bounded)
  next_run_at    timestamptz  index (shard_id, next_run_at) WHERE enabled
  spec           jsonb        required labels (pool), priority, retry policy, payload

runs           hot table: unfinished runs only, on the same shard as their job
  run_id         uuid         primary key
  job_id         uuid         unique (job_id, scheduled_for): one run per occurrence
  scheduled_for  timestamptz  the cron occurrence or requested time this run is for
  pool, tenant_id, priority, payload        copied from the job so claims need no join
  state          text         scheduled | blocked | queued | leased
  run_at         timestamptz  earliest start; now + backoff after a failure
  attempt        int          claims so far; dead-letter at max attempts
  fence          bigint       +1 on every claim; heartbeat and finish must match it
  lease_until    timestamptz  set while leased; judged by the database clock
  pending_deps   int          DAG step: unfinished upstream steps; queued at 0
  index (pool, tenant_id, priority DESC, run_at) WHERE state = 'queued'
  index (run_at) WHERE state = 'scheduled'; index (lease_until) WHERE state = 'leased'

run_history    finished runs; daily partitions, dropped after 30 days
dead_letters   run snapshot + last error; kept until replayed or purged

Claim (per pool and tenant; concurrent dispatchers skip rows that are already locked):
  WITH due AS (
    SELECT run_id FROM runs
    WHERE pool = $1 AND tenant_id = $2 AND state = 'queued'
    ORDER BY priority DESC, run_at LIMIT $3
    FOR UPDATE SKIP LOCKED)
  UPDATE runs r SET state = 'leased', attempt = r.attempt + 1, fence = r.fence + 1,
         lease_until = now() + interval '30 seconds'
  FROM due WHERE r.run_id = due.run_id
  RETURNING r.run_id, r.fence, r.attempt, r.payload;`,
  architecture: {
    diagram: `  Clients                           +--------+
     |  submit jobs and workflows   |  etcd  |
     v                              +---+----+
+---------+                             ^
| Job API |                             | per-shard leader lease
+----+----+                    +--------+--------+
     |                         |  Shard leaders  |
     | write jobs and runs     +--------+--------+
     |                                  | materialize cron, promote
     v                                  v due runs, reap leases
+-----------------------------------------------------------------+
|   PostgreSQL x16: jobs, runs (hot), run_history, dead_letters   |
+--------------------------------+--------------------------------+
                                 ^
                                 | claim with SKIP LOCKED; fenced
                                 | heartbeat, complete and fail
                        +--------+--------+
                        |   Dispatchers   |
                        +--------+--------+
                                 ^
                                 | long-poll Claim, Heartbeat,
                                 | Complete and Fail
                  +--------------+--------------+
                  |  Workers, pooled by labels  |
                  |  (gpu, os, region)          |
                  +-----------------------------+`,
    flow: [
      'Submit: the Job API checks the cron expression and zone, DAG acyclicity and the tenant quota, then writes the job and its first run (or next_run_at) to the shard chosen by hash(root_id).',
      'Schedule: each shard’s leader, elected through an etcd lease, materializes due cron occurrences, promotes scheduled runs whose run_at has passed to queued, and requeues or dead-letters runs whose lease expired.',
      'Claim: a worker long-polls a dispatcher with its pools and free slots; the dispatcher picks a tenant fairly, claims queued runs with FOR UPDATE SKIP LOCKED and returns each with a fence and a 30 s lease.',
      'Run: the worker heartbeats every 10 s to extend the lease and passes the fence to downstream writes; a heartbeat answered with LEASE_LOST or cancel makes it stop.',
      'Finish: Complete or Fail commits only if the fence still matches. Success moves the run to history and unblocks DAG dependents; failure schedules a backoff retry or dead-letters the run.',
    ],
  },
  deepDives: [
    {
      heading: 'Finding due work without a hot scheduler',
      points: [
        'Jobs and runs are sharded by hash(root_id) into 256 logical shards on 16 PostgreSQL clusters. Scheduler nodes compete for one etcd lease per shard, so time-driven work is spread across nodes instead of one global loop.',
        'Each leader polls its shard every second with batched range scans on time indexes: cron jobs whose next_run_at has passed, scheduled runs whose run_at has passed (promoted to queued) and leased runs whose lease_until has passed.',
        'A cron occurrence is materialized in one transaction that locks the job row (FOR UPDATE SKIP LOCKED), inserts the run and advances next_run_at. A crash before commit changes nothing, and the unique (job_id, scheduled_for) key blocks duplicates.',
        'Every leader action is an idempotent, conditional update, so two leaders overlapping during a handover waste work but cannot corrupt state. The leader is an efficiency device, not a correctness one.',
        'Claims need no leader: queued rows are already due, so stateless dispatchers take the top rows of a partial index with SKIP LOCKED and never block on, or double-claim, a row another dispatcher is claiming.',
      ],
    },
    {
      heading: 'Leases, fencing tokens and retries',
      points: [
        'A claim is a lease, like an SQS visibility timeout: the run is invisible to other claimers until lease_until, and the worker renews its 30 s lease every 10 s. Expiry is judged by the database clock, so worker clock skew cannot stretch a lease.',
        'An expired lease means the worker is presumed dead: the run becomes claimable again and the expiry counts as a failed attempt. The worker may only be paused (GC, network partition), so expiry alone cannot stop it from finishing later.',
        'Fencing tokens close that gap: each claim increments fence, and heartbeat, complete and fail are conditional updates that require the current fence and an unexpired lease. A stale worker matches zero rows, gets LEASE_LOST and discards its result.',
        'Execution is at-least-once, so jobs must be idempotent: run_id is the idempotency key for side effects, and downstream stores that receive the fence reject lower ones, as in the fencing-token scheme Martin Kleppmann describes for distributed locks.',
        'Failed runs retry after min(cap, base × 2^(attempt - 1)) with full jitter, so a downstream outage does not cause synchronized retry waves. Non-retryable errors and runs out of attempts go to dead_letters for alerting and manual replay.',
      ],
    },
    {
      heading: 'Cron, time zones and missed schedules',
      points: [
        'Store each cron expression with an IANA zone such as America/New_York and compute next_run_at in UTC with the tz database, never with server local time; recompute pending occurrences when a tzdata release changes a zone’s rules.',
        'Define DST behavior: on spring-forward day 02:30 does not exist, so run at the first valid instant after the gap (or skip, if configured); on fall-back day 01:30 occurs twice, so run only at the first.',
        'Fixed intervals ("every 15 minutes") are computed in elapsed UTC time, so DST never shortens or doubles their gaps; only wall-clock schedules need the rules above.',
        'After downtime or a pause, a misfire policy decides: skip to the next future occurrence, run once for all missed occurrences, or catch up each one up to a bound. Kubernetes CronJob exposes a related knob, startingDeadlineSeconds.',
        'An overlap policy covers a run that outlasts its interval: allow concurrent runs, forbid (skip the new occurrence) or replace (cancel the running one), like the Allow, Forbid and Replace values of the Kubernetes CronJob concurrencyPolicy.',
      ],
    },
    {
      heading: 'DAG workflows, fairness and capability pools',
      points: [
        'A workflow is a DAG, such as a CI pipeline where test and lint need build and deploy needs both. Submission validates it with Kahn’s topological sort (rejecting cycles and unknown steps), keeps every step on the workflow’s shard and queues the roots.',
        'A step’s fenced completion decrements each dependent’s pending_deps in the same transaction and queues those that reach zero, so no step starts early or twice. A dead-lettered step marks its descendants skipped unless they are always-run cleanup steps.',
        'Per-tenant token buckets cap submission and start rates, and a concurrency cap bounds running jobs. Dispatchers pick the next tenant by weighted deficit round robin, so one tenant’s million-run backlog cannot starve everyone else.',
        'Priority orders runs within a tenant’s share, and aging raises the effective priority of runs that have waited too long, so low-priority work still finishes under constant high-priority load.',
        'Jobs declare required labels (gpu=a100, os=windows); each distinct label set is a pool, and a worker claims only from pools whose labels are a subset of its own. Per-pool queue lag drives autoscaling.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Run store',
      choice: 'Sharded PostgreSQL with partial indexes and SKIP LOCKED',
      rationale:
        'Fences, DAG counters and history moves commit atomically, and ≈ 3,500 writes/s per cluster is moderate. A wide-column store with time-bucketed partitions scales writes further but lacks multi-row transactions; a Kafka log has no native per-message delay for backoff.',
    },
    {
      decision: 'Execution guarantee',
      choice: 'At-least-once with idempotent jobs and fenced commits',
      rationale:
        'Exactly-once cannot be guaranteed for arbitrary side effects, because a worker can act and then crash before reporting. At-most-once would silently drop work every time a worker dies.',
    },
    {
      decision: 'Dispatch model',
      choice: 'Workers pull with long-polling',
      rationale:
        'Pull gives natural backpressure: a worker asks only when it has a free slot and only for pools it can serve. Push would make the scheduler track every worker’s capacity and liveness and handle slow receivers.',
    },
    {
      decision: 'Lease length',
      choice: '30 s lease renewed every 10 s',
      rationale:
        'Crashes are detected within ≈ 30 s and two lost heartbeats are tolerated. A lease as long as the job timeout needs no heartbeats but delays recovery by up to that timeout; much shorter leases expire spuriously during GC pauses.',
    },
    {
      decision: 'Scheduler coordination',
      choice: 'A leader per shard for time scans; leaderless SKIP LOCKED claims',
      rationale:
        'Leaders avoid duplicate scans and spread load, and because their actions are idempotent a brief double leader is harmless. One global scheduler would cap throughput and be a single point of failure.',
    },
  ],
  failureModes: [
    'Worker crash or partition mid-run: heartbeats stop, the lease expires within 30 s and the run is re-claimed with a higher fence. If the old worker comes back, its heartbeat returns LEASE_LOST and its completion is rejected, so it aborts.',
    'Poison job that kills its worker every time: each crash shows up as a lease expiry that still counts as an attempt, so the run dead-letters after max attempts instead of cycling forever. Alert on dead-letter rate per job type.',
    'Shard leader loss: its etcd lease lapses and another node takes the shard within seconds. Claims and completions continue meanwhile; only cron materialization, promotion and lease reaping for that shard pause briefly.',
    'Database failover: claims and heartbeats fail for a few seconds while workers keep running and retry with backoff. Afterward the reaper first extends every lease by one full period, so a short outage does not requeue every healthy run at once.',
    'Backlog at popular cron times or in an under-provisioned pool: alert on queue lag (now minus the oldest queued run_at) and schedule delay rather than queue depth alone, and scale the pool on the same signal.',
  ],
  code: {
    label: 'TypeScript: lease-based run queue with fencing tokens, heartbeats, backoff and dead-lettering',
    language: 'TypeScript',
    code: `// Model of one shard's run queue: each method maps to one conditional SQL statement in production.
export interface Run {
  id: string;
  state: 'queued' | 'leased' | 'succeeded' | 'dead';
  runAt: number; // earliest claim time (epoch ms)
  attempts: number; // claims so far, including the current one
  token: number; // fencing token of the newest lease
  leaseUntil: number;
  lastError?: string;
}

export interface QueueOptions {
  now: () => number; // the store's clock, never a worker's clock
  leaseMs: number;
  maxAttempts: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
}

export class LeaseQueue {
  readonly runs = new Map<string, Run>(); // exposed for inspection; mutate only via methods
  private readonly opts: QueueOptions;
  private lastToken = 0;

  constructor(opts: QueueOptions) {
    this.opts = opts;
  }

  enqueue(id: string, runAt: number): boolean {
    if (this.runs.has(id)) return false; // idempotent submit: a retried request adds no copy
    this.runs.set(id, { id, state: 'queued', runAt, attempts: 0, token: 0, leaseUntil: 0 });
    return true;
  }

  claim(max: number): Run[] {
    const now = this.opts.now();
    const due: Run[] = [];
    for (const r of this.runs.values()) {
      if (r.state === 'leased' && now >= r.leaseUntil) { // no heartbeat: a failed attempt
        r.state = r.attempts >= this.opts.maxAttempts ? 'dead' : 'queued';
        r.runAt = r.leaseUntil;
        r.lastError = 'lease expired';
      }
      if (r.state === 'queued' && r.runAt <= now) due.push(r);
    }
    due.sort((a, b) => a.runAt - b.runAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return due.slice(0, Math.max(0, max)).map((r) => {
      r.state = 'leased';
      r.attempts += 1;
      r.token = ++this.lastToken; // strictly increasing: a newer lease always has a higher token
      r.leaseUntil = now + this.opts.leaseMs;
      return { ...r }; // the worker echoes token on heartbeat, complete and fail
    });
  }

  heartbeat(id: string, token: number): number | null {
    const r = this.owned(id, token);
    if (!r) return null; // lease lost: the worker must stop and discard its result
    r.leaseUntil = this.opts.now() + this.opts.leaseMs;
    return r.leaseUntil;
  }

  complete(id: string, token: number): boolean {
    const r = this.owned(id, token);
    if (r) r.state = 'succeeded';
    return r !== undefined;
  }

  fail(id: string, token: number, error: string): 'retry' | 'dead' | 'rejected' {
    const r = this.owned(id, token);
    if (!r) return 'rejected';
    r.lastError = error;
    r.state = r.attempts >= this.opts.maxAttempts ? 'dead' : 'queued'; // dead = dead-lettered
    r.runAt = this.opts.now() + this.backoffMs(r.attempts);
    return r.state === 'dead' ? 'dead' : 'retry';
  }

  /** base * 2^(attempt - 1), capped. Production adds full jitter: a random delay in [0, this]. */
  backoffMs(attempt: number): number {
    const exp = Math.min(Math.max(attempt - 1, 0), 30); // clamped so 2 ** exp stays finite
    return Math.min(this.opts.maxBackoffMs, this.opts.baseBackoffMs * 2 ** exp);
  }

  // Fencing: only the newest, unexpired lease may extend or finish a run.
  private owned(id: string, token: number): Run | undefined {
    const r = this.runs.get(id);
    const ok = r?.state === 'leased' && r.token === token && this.opts.now() < r.leaseUntil;
    return ok ? r : undefined;
  }
}`,
  },
  followUps: [
    {
      question: 'Can you guarantee exactly-once execution?',
      answer:
        'Not for arbitrary side effects: a worker can finish the work and crash before Complete is recorded, so the run executes again. Instead make effects idempotent with run_id as the idempotency key, have downstream stores reject stale fences, or commit the effect and the completion in one transaction when they share a database.',
    },
    {
      question: 'How do you cancel a run that is already executing?',
      answer:
        'Mark the run cancel-requested; the next heartbeat response tells the worker to stop, and it kills the process, runs cleanup and reports canceled. If the worker is unreachable, its lease expires and the reaper finalizes the run as canceled instead of requeueing it. Cancellation is cooperative, so jobs need cleanup hooks.',
    },
    {
      question: 'How would you fire millions of timers with sub-second precision?',
      answer:
        'Polling an index every second adds up to a second of delay. Each shard leader can instead load the next few minutes of runs into an in-memory hierarchical timing wheel (Varghese and Lauck, 1987), which inserts and cancels timers in O(1); Kafka uses the same structure for delayed requests. After a failover, the new leader rebuilds the wheel from the run_at index.',
    },
  ],
};
