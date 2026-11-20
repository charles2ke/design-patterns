import type { SystemDesignQuestion } from '../../types/system-design';

export const chatgpt: SystemDesignQuestion = {
  slug: 'chatgpt',
  title: 'Design ChatGPT (a conversational LLM product)',
  difficulty: 'Medium',
  companies: ['OpenAI', 'Anthropic'],
  prompt:
    'Design a ChatGPT-style assistant. Users see their past conversations, send a message and watch the reply stream in token by token, can stop a generation, and can edit an earlier message or regenerate a reply, which starts a new branch. Assume 20 million daily active users sending 10 messages a day each, and that trained models are served by GPU pools behind an internal API.',
  signals: [
    'Separates the product layer (conversations, branches, streaming) from model serving, and treats GPU capacity as the scarce, expensive resource it is.',
    'Makes streaming robust: generation outlives the HTTP connection, deltas carry sequence numbers, and a reconnecting client resumes without losing or duplicating text.',
    'Models edits and regenerations as a message tree and builds the model context from the selected branch within a token budget.',
    'Meters, limits and prioritizes in tokens rather than requests, and backs that with cost arithmetic.',
  ],
  requirements: {
    functional: [
      'List, open, rename and delete conversations, most recently active first.',
      'Send a message and stream the reply token by token; Stop ends generation and keeps the partial reply.',
      'Edit an earlier message or regenerate a reply, creating a branch; users can switch between sibling versions.',
      'A reply keeps generating and is saved if the tab closes or the network drops; reopening the conversation resumes the stream.',
      'Enforce per-user and per-plan usage limits measured in tokens, and moderate both prompts and replies.',
    ],
    nonFunctional: [
      'The product layer adds under 100 ms to time to first token and under 50 ms per streamed delta; model latency is budgeted separately.',
      'No acknowledged message or finished reply is lost; a crash or disconnect loses at most about a second of a streaming reply.',
      'Conversation history stays available (99.9%+) even when GPUs are saturated; overload degrades free and background traffic first.',
      'Conversations are private to their owner, encrypted at rest and deletable on request.',
    ],
    outOfScope: [
      'Model training and the internals of GPU serving (batching, KV cache, parallelism) behind the inference API.',
      'Billing and payments: the system only emits metered token usage.',
      'Voice, image generation and shared or team workspaces.',
    ],
  },
  estimates: [
    'Traffic: 20M DAU × 10 messages = 200M messages/day ÷ 86,400 s ≈ 2,300/s on average; plan for ~3× peak ≈ 7,000/s.',
    'Streams: a 400-token reply at ~40 tokens/s lasts ~10 s, so by Little’s law 7,000/s × 10 s ≈ 70,000 concurrent SSE streams at peak, a small fleet of connection servers.',
    'Tokens: assume ~2,000 input tokens (system prompt + history) and ~400 output tokens per message → 400B input and 80B output tokens/day; 80B ÷ 86,400 ≈ 930k output tokens/s on average, ≈ 2.8M/s at peak.',
    'GPUs: at an assumed ~1,000 output tokens/s per GPU with continuous batching, peak decode alone needs ≈ 2,800 GPUs. Kept all day at an assumed $2.50 per GPU-hour, 2,800 × 24 × $2.50 ≈ $168k/day ≈ $0.00084 per message.',
    'Storage: each exchange adds a ~100-token prompt and a ~400-token reply (~4 bytes per token) plus metadata ≈ 2.5 KB; 200M × 2.5 KB ≈ 500 GB/day ≈ 180 TB/year, ≈ 550 TB with 3× replication.',
    'Cost: a year of replicated history (≈ 550 TB) at an assumed $0.08/GB-month ≈ $44k/month ≈ $1,500/day, under 1% of the GPU bill: inference dominates, so token quotas, context trimming and prefix caching matter far more than storage tuning.',
  ],
  api: `POST   /v1/conversations                          -> 201 { "id": "c_9" }
GET    /v1/conversations?cursor=<c>&limit=20
-> 200 { "items": [{ "id": "c_9", "title": "Rome trip", "updatedAt": "..." }],
         "next": "<cursor>" }
GET    /v1/conversations/{cid}
-> 200 { "currentLeafId": "m_43", "version": 7,
         "messages": [{ "id", "parentId", "role", "content", "status" }, ...] }
   (every branch; the client renders the path from currentLeafId to the root)
PATCH  /v1/conversations/{cid}  { "title"?, "currentLeafId"?, "version": 7 }
-> 200 | 409 (changed on another device: refetch)
DELETE /v1/conversations/{cid}                    -> 204 (purged asynchronously)

POST /v1/conversations/{cid}/messages      (send; an edit is a new sibling message)
Idempotency-Key: <uuid>
{ "parentId": "m_41", "content": "Plan 3 days in Rome", "model": "standard" }
-> 200 Content-Type: text/event-stream   (read with fetch(); EventSource only does GET)
   event: meta   data: {"userMessageId":"m_42","assistantMessageId":"m_43"}
   id: 1         data: {"delta":"Day 1:"}
   id: 2         data: {"delta":" the Colosseum"}
   event: done   data: {"status":"complete","inputTokens":1830,"outputTokens":412}
-> 404 | 409 (parent not in conversation) | 413 (too long) | 429 (quota, Retry-After)

GET  /v1/conversations/{cid}/messages/{mid}/stream    Last-Event-ID: 2
-> 200 replays deltas after seq 2, then live ones (the saved message if finished)
POST /v1/conversations/{cid}/messages/{mid}/regenerate  -> new sibling reply, streamed
POST /v1/conversations/{cid}/messages/{mid}/stop        -> 202 (partial text kept)`,
  dataModel: `conversations     partitioned by user_id (DynamoDB, Cassandra or sharded Postgres)
  user_id          string     partition key
  conversation_id  string     sort key: ULID (time-ordered)
  title            string     generated asynchronously after the first exchange
  current_leaf_id  string     tip of the selected branch
  version          int        compare-and-set guard for current_leaf_id
  updated_at       timestamp  index (user_id, updated_at desc) feeds the sidebar

messages          partitioned by conversation_id
  conversation_id  string     partition key
  message_id       string     sort key: ULID
  parent_id        string     null for a first message; siblings = edits or regenerations
  role             string     user | assistant | tool
  content          text       attachments live in object storage, referenced by ID
  status           string     streaming | complete | stopped | interrupted | flagged
  token_count      int        cached per tokenizer for the context builder
  model, usage, idempotency_key, heartbeat_at, created_at

token_log         Redis Stream per in-flight reply, TTL ~10 min: seq -> delta
usage_ledger      (user_id, day) -> input, cached and output tokens: quotas and billing

Opening a conversation is one partition read, and the thread is rebuilt by walking
parent_id from current_leaf_id. The sidebar is one index range scan per user.`,
  architecture: {
    diagram: `+---------+  POST /messages  +----------------+  tail    +-------------+
| Browser |----------------->| API / SSE tier |<---------| Token log   |
|         |<-----------------| auth, limits   |          | (Redis      |
|         |  SSE, id = seq   |                |          |  Streams)   |
+---------+                  +-------+--------+          +-------------+
                                     |                          ^
                                     v                          |
+------------+              +-------------------+               |
| Moderation |<--- check ---| Chat orchestrator |--- append ----+
+------------+              | context builder   |
                            +----+---------+----+
                                 |         |
                      read/write |         | generate
                                 v         v
              +-------------------+   +-------------------+
              | Conversation DB   |   | Inference gateway |
              | (by conv. id)     |   | quotas, priority, |
              +-------------------+   | model routing     |
                                      +---------+---------+
                                                |
                                                v
                                      +-------------------+
                                      |  GPU model pools  |
                                      +-------------------+`,
    flow: [
      'The browser POSTs the message with its parent ID and an Idempotency-Key. The API/SSE tier authenticates, rate-limits and hands it to a chat orchestrator, which saves the user message and a placeholder reply with status streaming.',
      'The orchestrator sends the prompt to the moderation service (no tokens reach the user until it passes) and builds the context: it walks parent_id from the new message to the root, keeping the system prompt plus the newest turns that fit the token budget.',
      'The inference gateway admits the request against the user’s token quota and plan priority, routes it to a GPU model pool and streams tokens back.',
      'The orchestrator appends each delta with a sequence number to the token log (Redis Streams), moderates the growing reply in chunks and checkpoints the partial text to the conversation DB about once a second.',
      'The API/SSE tier tails the token log and relays deltas as SSE events whose id is the sequence number; after a reconnect it resumes from Last-Event-ID.',
      'On completion or Stop, the orchestrator saves the final text and status, records token usage and moves current_leaf_id to the new reply.',
    ],
  },
  deepDives: [
    {
      heading: 'Streaming, stop and resume',
      points: [
        'SSE fits: tokens flow one way and user actions (send, stop, regenerate) are ordinary POSTs. Serve it over HTTP/2, since browsers allow only about six HTTP/1.1 connections per host, and send a comment heartbeat every ~15 s so proxies do not cut idle streams.',
        'Generation is decoupled from the connection: the orchestrator owns the inference call and appends numbered deltas to a per-reply token log. SSE handlers only tail that log, so any API instance can serve any stream and several devices can watch one reply.',
        'On reconnect the client calls the stream endpoint with Last-Event-ID (EventSource sends it automatically; a fetch() reader sets it), and the handler replays deltas after that sequence number, then tails live ones. If the log has expired, the saved message is served instead.',
        'If nobody is listening, generation still finishes (bounded by max output tokens) and the partial text is checkpointed about once a second, so a refresh or crash loses at most a second of output.',
        'Stop is an explicit POST that publishes a cancel signal for the reply; the orchestrator that owns it cancels the upstream inference call to free the GPU slot, saves the partial reply as stopped and bills only the tokens generated.',
      ],
    },
    {
      heading: 'Message tree and context building',
      points: [
        'Messages form a tree through parent_id. Editing a message adds a sibling under the same parent and regenerating adds a sibling reply; nothing is overwritten, so every branch stays viewable behind "2 / 3" arrows.',
        'The conversation stores current_leaf_id, and the visible thread is the path from that leaf to the root. Switching to another sibling selects the newest leaf beneath it.',
        'The model input is the system prompt plus the newest whole turns that fit in the context window minus the reply reservation. Turns are never split, so a reply never loses its prompt and a tool result never loses its tool call.',
        'When turns are dropped, a rolling summary of them goes right after the system prompt. A cheap model writes it asynchronously, and it is cached with the ID of the last message it covers.',
        'Re-sending history makes total input tokens grow quadratically with conversation length. Dropping old turns in large blocks rather than one per message keeps the prompt prefix stable, so the serving tier’s prefix (KV) cache keeps hitting.',
      ],
    },
    {
      heading: 'Inference gateway: quotas, priority and routing',
      points: [
        'Every model call goes through the gateway, so policy lives in one place: per-user and per-plan token quotas, a cap of one or two concurrent generations per user, and per-model capacity limits.',
        'Quotas count tokens, not requests: admission reserves the input tokens plus max output tokens from Redis token buckets (per minute and per day), and the unused part is refunded when the stream ends.',
        'Requests wait in per-model priority queues: paid interactive, then free interactive, then background work such as titles and summaries. When queue time breaches its SLO, shed the lowest class first (429 with Retry-After) or route free traffic to a smaller model.',
        'Route by model, region and load; keeping a conversation on the same replica raises prefix-cache hits. Usage (input, cached and output tokens) is recorded in a ledger from the inference response, never from client claims.',
      ],
    },
    {
      heading: 'Safety moderation',
      points: [
        'Classify the prompt with a fast moderation model in parallel with the start of inference and hold the first tokens until it passes. A flagged prompt cancels generation and returns a refusal, so moderation adds little latency.',
        'Moderate the reply in chunks (a sentence or ~50 tokens) as it streams. On a violation, stop generation, replace the visible text with a notice and mark the message flagged.',
        'Holding each chunk until it passes avoids showing text that is later retracted, at the cost of some latency; the chunk size tunes that trade-off.',
        'Store verdicts with the message for appeals and policy tuning; repeated violations feed account-level abuse scores and stricter limits.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Streaming transport',
      choice: 'Server-Sent Events over HTTP/2',
      rationale:
        'Output is one-way and client actions are plain POSTs; SSE reuses HTTP auth and load balancers and defines reconnection with Last-Event-ID. WebSockets add stateful two-way connections and a custom resume protocol, worth it only for bidirectional features such as voice.',
    },
    {
      decision: 'Client disconnect mid-reply',
      choice: 'Finish and persist the reply; only an explicit Stop cancels',
      rationale:
        'Mobile connections drop constantly, and canceling on disconnect would discard answers users already waited for and trigger costlier regenerations. The wasted work is bounded by max output tokens.',
    },
    {
      decision: 'Conversation history model',
      choice: 'Message tree (parent_id) plus current_leaf_id',
      rationale:
        'Edits and regenerations become cheap inserts and every branch stays reproducible. A linear list with in-place edits loses alternatives and lets two devices overwrite each other.',
    },
    {
      decision: 'Context strategy',
      choice: 'System prompt + newest whole turns + rolling summary',
      rationale:
        'Cost is predictable and recent turns stay verbatim. Sending everything fails at the context limit and costs grow quadratically; retrieval over old turns adds an index and can miss implicit context.',
    },
    {
      decision: 'Quota unit',
      choice: 'Tokens per user and per plan',
      rationale:
        'GPU time scales with tokens, so a long-context request costs many times a short one. Request-count limits would let a few heavy users exhaust shared capacity.',
    },
  ],
  failureModes: [
    'Orchestrator crash mid-reply: the message stays streaming with a stale heartbeat_at. A sweeper marks replies silent for ~30 s as interrupted (keeping the last checkpoint) and ends their streams, and the UI offers Regenerate; the orphaned inference call hits its deadline.',
    'GPU capacity exhausted by a launch spike or a pool outage: queue time and 429 rates climb. Shed background and free traffic first, fall back to a smaller model or another region, and keep headroom, because new GPU replicas take minutes to load weights.',
    'Duplicate sends: a retried POST after a network blip would create two branches and two generations. The Idempotency-Key is stored with the user message, so a retry attaches to the existing stream.',
    'Moderation service slow or down: enforce a strict timeout and fall back to a lightweight local classifier and blocklist rather than failing open, and alert on the fallback rate.',
    'Abuse: scripts on free accounts drain GPU capacity. Per-user, per-IP and per-plan token quotas, the concurrency cap, bot detection and alerts on anomalous token spend contain it.',
  ],
  code: {
    label: 'TypeScript: walk the selected branch and keep the newest whole turns within a token budget',
    language: 'TypeScript',
    code: `export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface Message {
  id: string;
  parentId: string | null; // edits and regenerations are siblings that share a parent
  role: Role;
  content: string;
}

/** Plug in the model's tokenizer, or read a token_count cached on each stored message. */
export type TokenCounter = (message: Message) => number;

export interface ModelContext {
  messages: Message[]; // system prompt first, then the kept messages from oldest to newest
  tokens: number;
  droppedMessages: number; // older messages left out; summarize them when this is > 0
}

/** The visible thread: follow parent_id from the selected leaf up to the root (newest first). */
export function threadFromLeaf(
  messages: ReadonlyMap<string, Message>,
  leafId: string | null,
): Message[] {
  const thread: Message[] = [];
  const seen = new Set<string>();
  for (let id = leafId; id !== null; ) {
    const message = messages.get(id);
    if (message === undefined) throw new Error('Unknown message ' + id);
    // A corrupt parent pointer must fail the request, not loop forever.
    if (seen.has(id)) throw new Error('Cycle at message ' + id);
    seen.add(id);
    thread.push(message);
    id = message.parentId;
  }
  return thread;
}

/**
 * budget = the model's context window minus the tokens reserved for the reply.
 * The system prompt is always kept. Whole turns (a user message plus the replies and tool
 * results after it) are then added from the newest backwards until one does not fit, so no
 * message is split, the kept turns are contiguous and a reply never loses its prompt.
 */
export function buildContext(
  messages: ReadonlyMap<string, Message>,
  leafId: string | null,
  systemPrompt: string,
  budget: number,
  countTokens: TokenCounter,
): ModelContext {
  const count = (message: Message): number => {
    const n = countTokens(message);
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('Bad token count: ' + message.id);
    return n;
  };
  if (!Number.isFinite(budget)) throw new RangeError('Budget must be a finite number');
  const system: Message = { id: 'system', parentId: null, role: 'system', content: systemPrompt };
  let tokens = count(system);
  if (tokens > budget) throw new RangeError('System prompt exceeds the token budget');

  const thread = threadFromLeaf(messages, leafId);
  let kept = 0; // kept messages always form a prefix of the newest-first thread
  let turnTokens = 0;
  for (const [i, message] of thread.entries()) {
    turnTokens += count(message);
    // Stop at the first turn that does not fit: adding older turns would leave a gap.
    if (tokens + turnTokens > budget) break;
    // A turn starts at a user message (or the root); until then, keep collecting it.
    if (message.role !== 'user' && message.parentId !== null) continue;
    tokens += turnTokens;
    turnTokens = 0;
    kept = i + 1;
  }
  if (thread.length > 0 && kept === 0) {
    // Answering without the newest message would be wrong: reject it (HTTP 413) instead.
    throw new RangeError('Latest message does not fit in the token budget');
  }
  return {
    messages: [system, ...thread.slice(0, kept).reverse()],
    tokens,
    droppedMessages: thread.length - kept,
  };
}`,
  },
  followUps: [
    {
      question: 'How would you add file attachments and tools such as web search?',
      answer:
        'Upload files to object storage via pre-signed URLs and extract, chunk and embed them asynchronously; the context builder inlines small files and retrieves relevant chunks of large ones. Tools run in a sandbox: the orchestrator executes each tool call the model emits, appends the result as a tool message and calls the model again, up to a step limit. Tool output may carry prompt injection, so it is treated as data, and tools with side effects need user confirmation.',
    },
    {
      question: 'Where would you look first to cut inference cost?',
      answer:
        'Raise prefix-cache hit rates (stable system prompt, block-wise truncation, sticky routing), route easy requests to a smaller model, cap max output tokens per plan and summarize long histories. Use cheaper models for titles and summaries, and move bulk jobs to off-peak batch capacity. Validate each change with offline evals and A/B tests so quality does not silently regress.',
    },
    {
      question: 'What happens when the same conversation is open on a phone and a laptop?',
      answer:
        'Both devices can tail the same token log, so a reply streams to both. If both send at once, each message becomes a child of the leaf that device saw, producing sibling branches instead of a corrupted thread. The conversation’s current_leaf_id is updated with compare-and-set on its version, so the losing device refetches and shows the other branch.',
    },
  ],
};
