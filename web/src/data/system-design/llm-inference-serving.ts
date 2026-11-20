import type { SystemDesignQuestion } from '../../types/system-design';

export const llmInferenceServing: SystemDesignQuestion = {
  slug: 'llm-inference-serving',
  title: 'Design an LLM inference serving platform',
  difficulty: 'Hard',
  companies: ['OpenAI', 'Anthropic'],
  prompt:
    'Design the platform behind a public LLM API: clients send a chat prompt and receive the generated tokens as a stream. It hosts several models and versions, enforces per-tenant rate limits and must meet latency SLOs. Assume a 70B-parameter flagship model, 2,000 requests/s at peak, ~2,000-token prompts, ~400-token responses and 8-GPU nodes with 80 GB of memory per GPU.',
  signals: [
    'Separates prefill (compute-bound, sets time to first token) from decode (memory-bandwidth-bound, sets inter-token latency) and schedules for both.',
    'Identifies KV-cache memory, not FLOPs, as the limit on concurrency and sizes it with arithmetic.',
    'Meters and schedules in tokens rather than requests: token-based rate limits, admission control and SLO-aware priority queues.',
    'Treats GPUs as scarce, slow to start and failure-prone: model sharding, fast weight distribution, autoscaling and mid-stream recovery.',
  ],
  requirements: {
    functional: [
      'Generate a completion for a chat prompt and stream tokens over SSE as they are produced, ending with a usage summary (input and output tokens).',
      'Serve several models and pinned versions behind stable aliases (e.g. flagship-latest), with weighted canary rollouts.',
      'Enforce per-tenant limits on requests and tokens per minute, with an interactive tier and a cheaper, lower-priority batch tier.',
      'Stop generating and free GPU memory as soon as a client cancels or disconnects; honor max_tokens and stop sequences.',
    ],
    nonFunctional: [
      'Latency SLOs at p99: time to first token (TTFT) under ~1 s for a 2K-token prompt and inter-token latency under ~50 ms (≥ 20 tokens/s per stream).',
      'High GPU utilization: GPUs dominate cost, so batch aggressively, but never at the expense of the latency SLOs.',
      'A GPU or node failure disrupts only the streams on that replica, and those streams resume elsewhere instead of failing.',
      'Tenant isolation: one tenant’s burst of long prompts cannot starve other tenants or push them past their SLOs.',
    ],
    outOfScope: [
      'Training, fine-tuning and model evaluation pipelines.',
      'Safety classifier internals (assume a moderation service screens prompts and outputs).',
      'GPU kernels and quantization research (assume an inference engine provides tensor-parallel forward passes).',
    ],
  },
  estimates: [
    'Weights: 70B parameters × 2 bytes (bf16) ≈ 140 GB, more than one 80 GB GPU holds. Shard them across a node (8 × 80 GB = 640 GB), which leaves ≈ 400 GB for the KV cache after activations and runtime overhead.',
    'KV cache per token for a Llama-2-70B-like shape (80 layers, 8 KV heads via grouped-query attention, head dim 128, fp16) = 2 (K and V) × 80 × 8 × 128 × 2 bytes = 327,680 B = 320 KiB, so a 4,096-token sequence holds 1.25 GiB.',
    'Concurrency: 400 GB ÷ 320 KiB ≈ 1.2M cached tokens per node ≈ 300 sequences of 4K tokens. With 64 KV heads (no grouped-query attention) it would be 8× fewer, so memory, not compute, caps the batch.',
    'Decode reads all weights every step: 140 GB ÷ 8 GPUs ÷ ~3 TB/s of HBM ≈ 5.8 ms, so a lone sequence gets ≈ 170 tokens/s. A batch of 64 at 2K context adds ≈ 1.75 ms of KV reads per step for ≈ 50× the throughput.',
    'Prefill costs ≈ 2 FLOPs per parameter per token = 140 GFLOP/token: a 2,000-token prompt is 280 TFLOP ÷ (8 GPUs × ~400 TFLOP/s achieved) ≈ 90 ms, well inside a 1 s TTFT budget if queueing is controlled.',
    'Fleet: decode needs 2,000/s × 400 = 800K tokens/s ÷ ~5K tokens/s per node ≈ 160 nodes; prefill of 4M prompt tokens/s, half served from the prefix cache, needs 2M × 140 GFLOP ÷ 3.2 PFLOP/s ≈ 88 nodes. Total ≈ 250 nodes ≈ 2,000 GPUs.',
  ],
  api: `POST /v1/chat/completions
Authorization: Bearer <api-key>        (per-tenant request and token-per-minute limits)
{
  "model": "flagship-latest",          (alias, resolved to a pinned version)
  "messages": [{ "role": "user", "content": "Summarize this report ..." }],
  "max_tokens": 400,
  "priority": "interactive",           (or "batch": cheaper, may wait in a queue)
  "stream": true
}
-> 200 OK  Content-Type: text/event-stream
   data: {"delta": "The"}
   data: {"delta": " report"}
   data: {"finish_reason": "stop", "usage": {"input_tokens": 1873, "output_tokens": 212}}
   data: [DONE]
   event: error                         (only if mid-stream recovery fails)
   data: {"code": "overloaded"}
-> 400 (prompt + max_tokens exceed the context) | 401 | 404 (unknown model)
-> 429 (rate limited, Retry-After) | 503 (overloaded, Retry-After)

Internal gRPC
  Generate(request_id, token_ids, params, priority, deadline)   router -> model server
    -> stream TokenChunk { token_ids, finish_reason? }
  Cancel(request_id)                                 sent when the client disconnects
  ReportLoad { replica_id, queued_tokens, running, kv_free_blocks }  replica -> registry`,
  dataModel: `models                     control plane (Postgres), cached by every router
  model_id       string    PK, e.g. "flagship-70b@2025-06-01": immutable, pinned weights
  weights_uri    string    object-store prefix plus a checksum per shard
  tp_degree      int       GPUs per replica (8 for the 70B model)
  max_context    int       prompt + max_tokens above this is rejected with 400

model_aliases
  alias          string    PK, e.g. "flagship-latest"
  targets        json      [{ model_id, weight }]: canary rollout and instant rollback

tenant_limits
  tenant_id      string    PK
  tier           string    interactive | batch -> scheduling priority
  rpm, input_tpm, output_tpm   int    refill rates; live token buckets are Redis keys

replicas                   soft state from load reports (~2 s), expires after ~10 s
  replica_id, model_id, region, endpoint, queued_tokens, kv_free_blocks, updated_at

Per replica, in GPU and host memory only (rebuilt on restart):
  block_pool     N fixed-size KV blocks (16 tokens each) and a free list
  block_tables   request_id -> [block ids] in token order
  prefix_index   hash(all tokens through a full block) -> block id, ref-counted, LRU

The router reads models, aliases and replicas from memory on every request; usage events
(tenant, model, input and output tokens) go to Kafka for billing and quota reports.`,
  architecture: {
    diagram: `  Client
    |  POST /v1/chat/completions; tokens stream back over SSE
    v
 +------------------------+       +---------------------------+
 | API gateway            |------>| Redis token buckets       |
 | auth, tokenize,        |       | (RPM, input/output TPM)   |
 | limits, admission      |       +---------------------------+
 +-----------+------------+
             |
             v
 +------------------------+       +---------------------------+
 | Router                 |<------| Replica registry          |
 | model@version, region, |       | queue depth, KV-cache     |
 | load, prefix affinity  |       | use, heartbeats           |
 +-----------+------------+       +---------------------------+
             | gRPC stream                      ^ load reports
     +-------+--------------------------+       |
     v                                  v       |
 +------------------------+       +-------------+-------------+
 | Model server replica   |  ...  | Model server replica      |
 | 8 GPUs, TP = 8         |       | (another model/version)   |
 | scheduler + paged KV   |       |                           |
 +-----------+------------+       +-------------+-------------+
             ^                                  ^
             +----------------+-----------------+
                              | weights, scale-out
                +-------------+---------------+
                | Object store -> NVMe cache, |
                | P2P fan-out; autoscaler     |
                | with a warm pool            |
                +-----------------------------+`,
    flow: [
      'The client POSTs a chat request. The API gateway authenticates the key, tokenizes the prompt and reserves input tokens plus max_tokens from the tenant’s Redis token buckets, answering 429 with Retry-After when a bucket is empty.',
      'The router resolves the alias to a pinned model version, picks the nearest healthy region, and chooses a replica by prefix-cache affinity bounded by load, using the queue depth and free KV blocks each replica reports to the registry.',
      'The replica’s scheduler queues the request by priority and deadline. Once enough KV blocks are free it admits the request, reusing any cached prefix blocks, and runs prefill to produce the first token.',
      'Every step decodes one token for each running sequence (continuous batching), allocating a new KV block whenever a sequence crosses a block boundary and preempting the newest sequence if no block is free.',
      'Tokens stream over gRPC to the gateway, which detokenizes them into SSE events. On finish or disconnect the replica frees the blocks, and the gateway refunds unused tokens and emits a usage event.',
      'Out of band, the autoscaler adds replicas from a warm pool when queued tokens or KV-cache utilization stay high; new replicas load weights from local NVMe or peers rather than straight from the object store.',
    ],
  },
  deepDives: [
    {
      heading: 'Prefill vs decode and continuous batching',
      points: [
        'Prefill pushes the whole prompt through the model in parallel as large matrix multiplies, so it is compute-bound and its duration sets time to first token. Decode then emits one token per sequence per step and must re-read all weights each step, so it is memory-bandwidth-bound and sets inter-token latency.',
        'Batching is what makes decode affordable: one pass over the weights serves every sequence in the batch, so throughput grows almost linearly with batch size until compute saturates. Attention still reads each sequence’s own KV cache, so KV memory caps the useful batch.',
        'Static batching runs a fixed batch to completion, so short responses idle behind long ones and new requests wait for the next batch. Iteration-level (continuous) batching, described publicly in the Orca paper (OSDI 2022), re-forms the batch every step: finished sequences leave and waiting ones join at once.',
        'A long prompt admitted into a running batch stalls everyone’s next token. Chunked prefill splits prompts into chunks and caps the tokens processed per step, mixing one chunk with the decodes, which bounds inter-token latency at a small cost in TTFT.',
      ],
    },
    {
      heading: 'KV-cache memory: paging, prefix sharing and preemption',
      points: [
        'Each token’s keys and values are cached in every layer for later tokens to attend to: 2 × layers × KV heads × head dim × bytes per element, 320 KiB here. Grouped-query attention (64 query heads sharing 8 KV heads) makes this 8× smaller than full multi-head attention.',
        'Reserving max-context memory per request wastes most of it, and variable-size frees fragment memory. PagedAttention (the vLLM paper, SOSP 2023) stores KV in fixed-size blocks (e.g. 16 tokens) mapped through a per-sequence block table like virtual-memory pages, so waste is at most one partial block per sequence.',
        'Prefix caching keys each full block by a hash of every token up to its end, so requests sharing a system prompt map to the same physical blocks, shared read-only with reference counts. A hit skips that part of prefill; unreferenced blocks stay cached until LRU eviction.',
        'When a sequence needs a block and none is free, preempt the most recently admitted sequence: swap its blocks to CPU memory, or free them and later recompute from prompt plus generated tokens. The vLLM paper schedules first-come-first-served and preempts the latest requests first, so the oldest request always progresses.',
        'Reject at submit time any request whose prompt plus max_tokens exceeds the whole block pool, or it would be preempted forever, and keep a small free-block watermark at admission so running sequences rarely need preemption.',
      ],
    },
    {
      heading: 'Routing, admission control and SLOs',
      points: [
        'Rate limits count tokens, not just requests: the gateway reserves input tokens plus max_tokens from the tenant’s token-per-minute bucket up front and refunds unused output tokens when the stream ends, so a burst of long requests cannot overcommit capacity.',
        'The router sends requests that share a prompt prefix to the same replica (consistent hashing on a hash of the first prompt blocks) to keep prefix-cache hits high, with bounded loads: a replica above ~1.25× the average load passes the request to the next replica on the ring.',
        'Each replica schedules by priority and deadline: interactive before batch, earliest deadline first within a tier, with aging so batch work still completes. Admission predicts TTFT from queued prefill tokens ÷ prefill rate and rejects early with 503 + Retry-After instead of accepting work it will miss.',
        'Under overload, shed the batch tier first, then new interactive requests, and never let queues grow without bound: a request served after its client has given up wastes all the GPU time spent on it.',
      ],
    },
    {
      heading: 'Sharding, weight distribution and autoscaling',
      points: [
        'Tensor parallelism splits each layer’s weight matrices across the 8 GPUs of a node, so each GPU holds and reads only 17.5 GB per step, which also cuts decode latency. Each layer needs two all-reduces per forward pass, so it only scales over NVLink-class links inside a node.',
        'Pipeline parallelism places contiguous layer ranges on different nodes and passes only activations between them, which needs far less bandwidth. It is the tool for models too big for one node, at the cost of per-hop latency and pipeline bubbles unless several micro-batches are in flight.',
        'Cold starts are dominated by moving weights: 140 GB at 1 GB/s from object storage takes ≈ 2.3 minutes. Cache weights on local NVMe, fan them out peer-to-peer (nodes fetch different chunks and exchange the rest), pre-pull container images, and verify shard checksums before serving.',
        'Autoscale on queued prefill tokens and KV-cache utilization, not GPU utilization, which reads near 100% whenever any batch runs. Keep a warm pool of nodes with weights already loaded, sized to cover the minutes a cold replica needs, and scale down slowly.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Batching',
      choice: 'Continuous (iteration-level) batching with chunked prefill',
      rationale:
        'Static batches leave slots idle until the longest sequence ends and make new requests wait for the next batch; re-forming the batch every step keeps the GPUs full, and chunking bounds how long a prefill can stall decodes.',
    },
    {
      decision: 'KV-cache allocation',
      choice: 'Paged fixed-size blocks with per-sequence block tables',
      rationale:
        'Reserving max_context per request wastes memory on sequences that end far earlier and fragments the heap; paging bounds waste to one partial block per sequence and makes prefix sharing a reference count.',
    },
    {
      decision: 'Preemption under memory pressure',
      choice: 'Recompute newest-first; swap only long sequences',
      rationale:
        'Recompute needs no host memory or PCIe traffic and is cheap for short sequences because prefill is compute-efficient. Long sequences are swapped instead: re-prefilling 4K tokens costs ≈ 180 ms of the whole node, while copying their 1.25 GiB of KV takes far less.',
    },
    {
      decision: 'Replica selection',
      choice: 'Prefix-affinity consistent hashing with bounded loads',
      rationale:
        'Least-loaded routing scatters shared prompts and forfeits prefix-cache hits; pure hashing turns a popular system prompt into a hot replica. Bounded loads keep most hits while capping imbalance.',
    },
    {
      decision: 'Sharding the 70B model',
      choice: 'Tensor parallelism across the 8 GPUs of one node',
      rationale:
        'Two all-reduces per layer per step need NVLink bandwidth, which exists only within a node. Pipeline parallelism across nodes needs less bandwidth but adds hop latency and bubbles, so keep it for models larger than one node.',
    },
  ],
  failureModes: [
    'A GPU or node fails mid-stream: the gateway notices the broken gRPC stream or missed heartbeats and resubmits the prompt plus the tokens already sent to another replica, which re-prefills them and continues the same SSE stream. The client sees a pause, not an error, and is billed once.',
    'Preemption storm: many long generations grow at once, run out of KV blocks and thrash, with recomputation eating the GPUs. Alert on the preemption rate; raise the free-block watermark, cap concurrent long-context requests and route them to a dedicated pool.',
    'Bad model rollout (wrong weights, quality regression, crash loop): a new version gets a small canary weight behind the alias, error rates, latency and evaluation probes gate promotion, and rollback is an alias change because the old replicas stay warm.',
    'Regional outage: the router fails over to other regions, but new capacity there takes minutes. Admit interactive traffic first, shed the batch tier and cap failover volume to what warm pools can absorb, so retries do not cascade into a second overload.',
    'Slow or degraded replica (thermal throttling, a flaky NVLink, ECC errors): inter-token latency rises for its whole batch. Compare per-replica latency against peers, stop routing new requests to outliers, and drain them once their in-flight streams finish.',
  ],
  code: {
    label:
      'TypeScript: continuous-batching scheduler over paged KV blocks (FIFO admission, newest-first recompute preemption)',
    language: 'TypeScript',
    code: `export interface Request {
  id: string;
  promptTokens: number;
  outputTokens: number; // known to the simulation; a real server stops at EOS or max_tokens
}

export interface Sequence {
  req: Request;
  tokens: number; // prompt + generated so far; kept on preemption, so resume recomputes them
  blocks: number; // KV blocks held: ceil(tokens / blockSize) while running, 0 while waiting
}

const positiveInts = (...ns: number[]) => ns.every((n) => Number.isInteger(n) && n > 0);

/** One model replica: iteration-level batching over a fixed pool of fixed-size KV blocks. */
export class BatchScheduler {
  readonly blockSize: number;
  readonly totalBlocks: number;
  readonly maxBatch: number;
  freeBlocks: number;
  preemptions = 0;
  readonly waiting: Sequence[] = [];
  readonly running: Sequence[] = []; // admission order, so the tail is the newest
  readonly finished: Sequence[] = [];

  constructor(blockSize: number, totalBlocks: number, maxBatch: number) {
    if (!positiveInts(blockSize, totalBlocks, maxBatch)) throw new RangeError('Bad sizes');
    this.blockSize = blockSize;
    this.totalBlocks = totalBlocks;
    this.maxBatch = maxBatch;
    this.freeBlocks = totalBlocks;
  }

  blocksFor(tokens: number): number {
    return Math.ceil(tokens / this.blockSize);
  }

  submit(req: Request): boolean {
    const { promptTokens: p, outputTokens: o } = req;
    if (!positiveInts(p, o)) throw new RangeError('Bad token counts');
    // Reject what cannot fit even running alone: it would be preempted forever.
    if (this.blocksFor(p + o) > this.totalBlocks) return false;
    this.waiting.push({ req, tokens: p, blocks: 0 });
    return true;
  }

  /** One iteration: every running sequence decodes one token, then waiting requests join. */
  step(): void {
    for (const seq of [...this.running]) {
      if (!this.running.includes(seq)) continue; // preempted earlier in this step
      if (seq.tokens % this.blockSize === 0) { // the next token starts a new block
        let preemptedSelf = false;
        while (this.freeBlocks === 0 && !preemptedSelf) {
          const victim = this.running.pop()!; // newest first, so the oldest always progresses
          preemptedSelf = victim === seq;
          this.freeBlocks += victim.blocks;
          victim.blocks = 0;
          this.waiting.unshift(victim); // resumes first, by recomputing its KV cache
          this.preemptions++;
        }
        if (preemptedSelf) continue;
        this.freeBlocks--;
        seq.blocks++;
      }
      this.emit(seq);
    }
    // Strict FIFO: stop at the first request that does not fit, so long prompts never starve.
    while (this.waiting.length > 0 && this.running.length < this.maxBatch) {
      const seq = this.waiting[0]!;
      const need = this.blocksFor(seq.tokens + 1); // prefill + the first new token
      if (need > this.freeBlocks) break;
      this.waiting.shift();
      this.freeBlocks -= need;
      seq.blocks = need;
      this.running.push(seq);
      this.emit(seq);
    }
  }

  private emit(seq: Sequence): void {
    seq.tokens++;
    if (seq.tokens < seq.req.promptTokens + seq.req.outputTokens) return;
    this.freeBlocks += seq.blocks; // finished: its blocks are reusable within this step
    seq.blocks = 0;
    this.running.splice(this.running.indexOf(seq), 1);
    this.finished.push(seq);
  }
}`,
  },
  followUps: [
    {
      question: 'Should prefill and decode run on separate GPUs?',
      answer:
        'Disaggregated serving, described in the DistServe and Splitwise papers, runs prefill and decode in separate pools and ships the KV cache between them. It removes interference between the phases and lets each pool choose its own parallelism and batch size, but every request moves its KV: ≈ 655 MB for a 2,000-token prompt, ≈ 13 ms over a 400 Gb/s link. It pays off at scale with strict inter-token latency SLOs.',
    },
    {
      question: 'How does speculative decoding cut latency?',
      answer:
        'A small draft model proposes k tokens and the large model verifies all k in one forward pass, which costs about as much as a single decode step because decode is memory-bound. A modified rejection-sampling rule makes the output distribution exactly the large model’s, so quality is unchanged. It helps most at small batch sizes; in large batches the extra verification compute competes with throughput.',
    },
    {
      question: 'How would you support 128K-token contexts?',
      answer:
        'One 128K-token sequence holds 40 GiB of KV here (5 GiB per GPU, ≈ 10% of the node’s cache), so a few of them displace hundreds of short requests. Route long contexts to a dedicated pool, use chunked prefill so a huge prompt does not stall decodes, and consider fp8 KV (half the size) or offloading cold blocks to CPU memory.',
    },
  ],
};
