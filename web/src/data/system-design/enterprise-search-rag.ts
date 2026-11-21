import type { SystemDesignQuestion } from '../../types/system-design';

export const enterpriseSearchRag: SystemDesignQuestion = {
  slug: 'enterprise-search-rag',
  title: 'Design an enterprise search assistant with RAG',
  difficulty: 'Hard',
  companies: ['OpenAI'],
  prompt:
    'Design an enterprise search assistant that answers employees’ questions in natural language from their company’s own documents, with citations. Content lives in drives, wikis, chat and ticketing systems, and answers must respect each source’s permissions. It is a multi-tenant SaaS product; size it for a large customer with 50,000 employees who each ask 20 questions per workday and 20 million documents averaging 2,000 tokens.',
  signals: [
    'Treats permissions as the top requirement: mirrors source ACLs, including nested groups, and trims results to what the asking user can read before anything is ranked, cached or sent to the model.',
    'Builds retrieval that finds the right passage: structure-aware chunking, BM25 plus vector search fused with reciprocal rank fusion and a cross-encoder reranker, all measured with recall@k.',
    'Keeps the index fresh: incremental sync from change feeds, fast propagation of deletes and permission changes, and a safe re-embedding plan for embedding-model upgrades.',
    'Grounds and defends generation: answers only from cited sources, abstains when they fall short, treats retrieved text as untrusted (prompt injection), isolates tenants and knows the cost and latency of a question.',
  ],
  requirements: {
    functional: [
      'Connect each tenant’s drives, wikis, chat and ticketing systems, index their existing content, then sync creates, edits, deletes and permission changes incrementally.',
      'Answer a natural-language question with a streamed, grounded answer whose statements cite numbered sources that link to the original documents.',
      'Use only content the asking user can open in the source system, including access granted through nested groups or domain-wide sharing.',
      'Say that the answer is not in the available documents instead of guessing, and support follow-up questions within a conversation.',
      'Offer plain search results (ranked documents with snippets) and collect thumbs-up or thumbs-down feedback on answers.',
    ],
    nonFunctional: [
      'No permission leaks: a user never sees, and the model never receives, content the user cannot read; when permission data is missing or too stale, fail closed.',
      'Freshness: revoked access and deleted documents disappear from results within 5 minutes at p99; edited content is searchable within 15 minutes.',
      'Latency: first answer token in about 1 s at p50 and under 3 s at p99; plain search results in under 300 ms.',
      'Tenant isolation: one company’s documents, vectors, caches and logs are never visible to another, and each tenant’s data is encrypted under its own key.',
      'Measured quality: retrieval recall@k, groundedness and citation accuracy gate every release, and online feedback is tracked per tenant.',
    ],
    outOfScope: [
      'Training or fine-tuning the language model; assume a hosted model endpoint that neither trains on nor retains customer data.',
      'Actions that change source systems, such as filing tickets or sending messages; the assistant is read-only.',
      'OCR, image understanding and audio or video transcription; parsers emit text only.',
    ],
  },
  estimates: [
    'Questions: 50,000 employees × 20/day = 1M/day; over a 10-hour workday that is 1M ÷ 36,000 s ≈ 28 QPS, or ≈ 83 QPS at a 3× peak. The request rate is modest; model tokens dominate cost and latency.',
    'Chunks: a 2,000-token document split into 500-token chunks with 100 tokens of overlap (stride 400) gives (2,000 - 100) ÷ 400 = 4.75, rounded up to 5 chunks, so 20M documents ≈ 100M chunks.',
    'Vectors: 100M × 1,024 dimensions × 4 bytes ≈ 410 GB as float32, plus ≈ 13 GB of HNSW links (M = 16 allows 32 neighbor ids × 4 bytes per vector on the base layer). int8 quantization shrinks the vectors to ≈ 102 GB.',
    'Embedding: the initial load is 100M chunks × 500 tokens = 50B tokens, ≈ 28 hours at an assumed 500k tokens/s. A 2% daily churn is only ≈ 1B tokens/day, so model upgrades (full re-embeds), not churn, size the embedding fleet.',
    'Generation: ≈ 5,000 prompt tokens (instructions plus 8 chunks × 500) and ≈ 300 output tokens per answer → 5B input + 0.3B output tokens/day. At an assumed $2 and $8 per million that is $10,000 + $2,400 = $12,400/day ≈ $0.012 per question.',
    'Time to first token: 10 ms (auth, cached principals) + 30 ms (embed the query) + 80 ms (BM25 and ANN in parallel) + 100 ms (rerank 50 candidates) + ≈ 700 ms (LLM queueing and prefill of 5,000 tokens) ≈ 920 ms at p50.',
  ],
  api: `POST /v1/ask                           Authorization: Bearer <user token from tenant SSO>
{
  "question": "How many weeks of parental leave do we get in Germany?",
  "conversationId": "c_81",                          (optional: follow-up questions)
  "filters": { "sources": ["wiki", "drive"], "updatedAfter": "2025-01-01" }  (optional)
}
-> 200 OK  Content-Type: text/event-stream
   event: sources  data: [{ "n": 1, "title": "Parental leave", "url": "https://..." }]
   event: delta    data: { "text": "Employees in Germany can take ... [1]" }
   event: done     data: { "answerId": "a_77", "abstained": false }
-> 401 Unauthorized  |  429 Too Many Requests (tenant or user quota)

GET /v1/search?q=parental+leave+germany&limit=10            (same ACL trimming, no LLM)
-> 200 OK  { "results": [{ "title": "...", "url": "...", "snippet": "..." }] }

POST /v1/answers/{answerId}/feedback   { "rating": "down", "reason": "wrong citation" }
-> 204 No Content

POST /v1/connectors/{connectorId}/notifications        (webhook from the source system)
-> 202 Accepted  after checking its signature or channel token; it only triggers a delta
                 pull with the stored cursor and is never indexed as content
-> 401 Unauthorized (bad signature)`,
  dataModel: `documents       PostgreSQL, sharded by tenant_id (every key starts with tenant_id)
  tenant_id, doc_id  primary key; doc_id = connector id + the item id in the source
  title, url         shown in citations
  acl                text[]       principal ids that may read: users, groups, domain
  acl_version        bigint       bumped on every permission change
  content_hash       bytea        sha-256 of the normalized text; unchanged -> skip work
  source_updated_at  timestamptz
  deleted_at         timestamptz  tombstone until every index has dropped the document

chunks          one row per chunk; text encrypted with the tenant's data key
  chunk_id           doc_id + ordinal
  heading_path       e.g. "Benefits > Leave > Germany"; prefixed to the text for embedding
  text               ~500 tokens; the first 100 repeat the end of the previous chunk
  acl, acl_version   copied from the document and rewritten on every permission change
  embedding_model    version of the model that produced the stored vector

index_jobs (tenant_id, doc_id, job_id)   captured acl_version; stale jobs cannot publish
index_fences (tenant_id, doc_id)         current acl_version and tombstone state in the index
Every upsert atomically requires its captured version to equal the fence and tombstone=false;
the fast lane advances the fence before changing ACLs or deleting chunks.

principals      (tenant_id, user_id) -> user id + transitive group ids; cached ~1 min
group_members   (tenant_id, group_id, member_id) mirrored from the identity provider
sync_state      (tenant_id, connector_id) -> delta cursor, last full reconciliation

Search indexes: dedicated per large tenant, or shared with a mandatory tenant_id filter
  bm25          inverted index on title + heading_path + text; acl as a keyword field
  vectors       HNSW (M = 16) over int8 embeddings with the same acl keyword field
Each query filters both indexes on "chunk acl overlaps the user's principals" and requires
chunk.acl_version = index_fences.acl_version with tombstone=false before returning content;
then it fuses, reranks and packs the survivors.`,
  architecture: {
    diagram: ` Drives, wikis, chat, ticketing           Identity provider
       | webhooks, change feeds                  | groups, members
       v                                         v
+--------------+   +---------------------+  +-----------------+
|  Connectors  |-->| Parse, chunk, embed |  |   ACL service   |
|  per tenant  |   | (batched on GPUs)   |  |  (principals)   |
+------+-------+   +----------+----------+  +--------+--------+
       |                      |                      ^
       | fast lane: ACL       | chunks, vectors      |
       | changes, deletes     v and ACLs             |
       |        +----------------------------+       |
       +------->| Tenant index: BM25, HNSW,  |       |
                | chunk text, acl field      |       |
                +-------------+--------------+       |
                              ^                      | user's
                              | ACL-filtered         | groups
                              | hybrid search        |
+--------+  question  +-------+----------------------+--+
|  User  |----------->|  Query service: fuse (RRF),     |
|        |<-----------|  rerank, pack, check citations  |
+--------+  streamed  +-------+-------------------+-----+
            answer            | numbered          ^
                              | sources           | answer
                              v                   | tokens
                      +---------------------------+-----+
                      |  LLM: answers only from sources |
                      +---------------------------------+`,
    flow: [
      'Ingest: per-tenant connectors receive webhooks or change-feed events, pull the delta with a stored cursor and send changed content to the parse, chunk and embed pipeline.',
      'Index: jobs capture the document and ACL version when they start; each chunk upsert atomically compares that version with the index-side fence and refuses a tombstoned document.',
      'Fast lane: permission changes advance the index fence before rewriting ACLs; deletes advance it and set its tombstone before removing chunks. Stale parse or embedding jobs fail the fence check and cannot restore old content or permissions.',
      'Retrieve: the query service gets the user’s principals (user id plus transitive groups) from the ACL service, then runs BM25 and ANN searches in parallel, each filtered to chunks whose ACL contains one of them.',
      'Rank and pack: the query service fuses both rankings with RRF, reranks the top 50 with a cross-encoder and packs the best chunks into the token budget as numbered sources for the LLM.',
      'Answer: the LLM answers only from those sources with [n] citations or says it does not know; the query service drops citations to unknown sources and streams the answer and source links to the user.',
    ],
  },
  deepDives: [
    {
      heading: 'Permissions: mirroring ACLs and trimming before ranking',
      points: [
        'Connectors copy every item’s ACL as principal ids: users, groups and domain-wide grants. Source accounts are mapped to the tenant’s identity provider, usually by verified email; an unmapped principal grants nothing, and an item without a readable ACL stays invisible.',
        'Nested groups are expanded per user, not per document: the ACL service resolves a user’s transitive memberships (Microsoft Graph exposes them as transitiveMemberOf) and caches the flat principal set for about a minute, so each query filters on one set of ids.',
        'Trimming happens inside both searches: a terms filter keeps only chunks whose ACL shares a principal with the user, so forbidden text never reaches ranking, the reranker, the prompt, snippets, result counts or a cache shared with other users.',
        'Post-filtering an ANN top 100 can leave nothing for a user who can read 0.1% of the corpus. Lucene applies the filter during HNSW traversal and falls back to exact search when the filter matches few documents.',
        'Link-only sharing grants access, not discovery: a Google Drive permission of type domain or anyone with allowFileDiscovery = false must not make the file findable, or search would reveal documents the user was never sent.',
      ],
    },
    {
      heading: 'Connectors, chunking and freshness',
      points: [
        'After an initial crawl, each connector follows the source’s change feed (Microsoft Graph delta queries, Google Drive changes.list with a saved page token) or event stream (Slack Events API). Webhooks just trigger an early pull; periodic pulls catch lost ones.',
        'Permission changes and deletes take a fast lane: first atomically advance the index-side document fence (and set its tombstone on deletion), then update ACLs or remove chunks. Every parse and embedding job carries its starting version and conditionally upserts only when it equals the fence and the tombstone is clear, so a stale job cannot win a check-then-write race or restore revoked content.',
        'A periodic full reconciliation lists every item and ACL and diffs them against the index to catch missed events. A sharing change on a folder or space recomputes the ACLs of everything beneath it, in batches.',
        'Parsers keep structure (headings, lists, tables, code) and split along sections into ~500-token chunks with ~100 tokens of overlap, prefixing each with its title and heading path before embedding. Section-aligned chunks keep edits local: unchanged chunks keep their hash and vector.',
        'An embedding-model upgrade is a blue/green migration, because vectors from different models are not comparable: build a new index (≈ 28 hours for 50B tokens), dual-write changes, compare recall offline, then switch reads. Each chunk records its embedding model version.',
      ],
    },
    {
      heading: 'Hybrid retrieval, reranking and grounded answers',
      points: [
        'BM25 (Lucene defaults: k1 = 1.2, b = 0.75) catches exact tokens such as error codes, ticket ids and product names that embeddings blur; dense vectors catch paraphrases such as "time off" for "leave". Each returns its top 100 permitted chunks.',
        'Reciprocal rank fusion (Cormack et al., SIGIR 2009) scores a chunk as the sum of 1/(60 + rank) over the lists that contain it. It uses only ranks, so BM25 and cosine scores, which live on different scales, need no normalization.',
        'A cross-encoder reads the question and each of the top 50 fused chunks together, so it judges relevance more accurately than either retriever, at ≈ 100 ms per query on a GPU. It is too slow for the whole corpus, so it only reorders candidates.',
        'The packer adds reranked chunks in order until the token budget is full, skipping (never splitting) chunks that do not fit, dropping near-duplicates and numbering sources [1]..[n]. Follow-up questions are first rewritten into standalone queries from the conversation.',
        'The model must answer only from the sources, cite [n] after each claim and say when the answer is not there; if the best rerank score is below a tuned threshold, the system abstains without calling the model. Citations to unknown source numbers are removed.',
      ],
    },
    {
      heading: 'Prompt injection, tenant isolation and evaluation',
      points: [
        'Retrieved text is untrusted: anyone who can edit a wiki page or post in a channel can plant "ignore previous instructions" (indirect prompt injection, OWASP LLM01). Passing sources as escaped data marked as non-instructions reduces the risk but does not remove it.',
        'So limit the blast radius: retrieval always runs with the asking user’s principals, tools are read-only (a write action would need the user’s explicit confirmation), and answers render no auto-loading images or non-allowlisted links that could smuggle data out in a URL.',
        'Large tenants get dedicated indexes; small ones share an index in which the query layer adds a mandatory tenant_id filter from the authenticated token, never from the request. Stores and backups use per-tenant keys in a KMS, so deleting a key crypto-shreds that tenant’s data.',
        'Offline, a labeled question set per domain measures retrieval recall@k and MRR, and an LLM judge calibrated against human ratings scores groundedness (every claim supported) and citation accuracy; regressions block chunker, embedder and prompt changes.',
        'Online, track thumbs-down, abstention and citation-click rates per tenant and sample failures for review with the tenant’s consent. Red-team fixtures (planted injections, restricted documents) run on every release: injections must not steer answers, and restricted documents must never surface for unauthorized test users.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Where permissions are enforced',
      choice: 'Inside retrieval, before ranking',
      rationale:
        'Post-filtering top-k results loses recall and lets forbidden text reach the reranker and logs; instructing the model to respect permissions is not a control at all. The cost is a denormalized acl field on every chunk that must be updated quickly.',
    },
    {
      decision: 'Retrieval method',
      choice: 'BM25 and dense vectors fused with RRF, then a cross-encoder',
      rationale:
        'Dense retrieval alone misses exact identifiers and rare names, and BM25 alone misses paraphrases. RRF needs no score calibration, and limiting the reranker to 50 candidates keeps its cost near 100 ms.',
    },
    {
      decision: 'Index layout',
      choice: 'Dedicated indexes for large tenants, a shared index with a mandatory tenant filter for small ones',
      rationale:
        'An index per tenant gives the strongest isolation and simple deletion but wastes memory on thousands of tiny tenants; one shared index is cheapest but turns a missing filter into a cross-tenant leak.',
    },
    {
      decision: 'Teaching the model company knowledge',
      choice: 'Retrieval at query time, no fine-tuning on documents',
      rationale:
        'A fine-tuned model cannot enforce per-user permissions, cite sources, stay current or forget a deleted document without retraining. Retrieval reflects changes within minutes, and every answer is traceable to its sources.',
    },
    {
      decision: 'Permission freshness',
      choice: 'Change-feed fast lane plus periodic full reconciliation',
      rationale:
        'Webhooks alone can be lost, and crawls alone leave revoked access searchable for hours. Checking every result against the source API at query time is the most current but too slow and rate-limited to do for all results.',
    },
  ],
  failureModes: [
    'A missed change (lost webhook, expired cursor) leaves a deleted document or revoked share searchable: periodic pulls and full reconciliation catch it, alerts fire on large reconciliation diffs, and sensitive tenants can re-check packed sources against the source API.',
    'Group sync from the identity provider stops: queries keep using the mirrored memberships while they are fresh, but once they are older than a set limit (say 15 minutes), queries fail closed with an error instead of running on stale or missing permissions.',
    'LLM or embedding outage or throttling: fall back to ACL-trimmed BM25 search results with a banner, and apply per-tenant rate limits so one tenant’s burst cannot exhaust shared model capacity.',
    'An instruction planted in a document steers the answer, for example toward a phishing link: output filtering drops non-allowlisted links and images, sources are always shown, and suspicious documents are flagged to the tenant admin.',
    'Quality regresses after a chunker, embedder or index change: offline recall@k and groundedness gates block the rollout, and blue/green indexes allow an instant rollback.',
  ],
  code: {
    label: 'TypeScript: ACL-trimmed hybrid retrieval with reciprocal rank fusion and a token-budgeted, cited context',
    language: 'TypeScript',
    code: `// Query-time core: security trimming, reciprocal rank fusion and prompt packing.
export interface Chunk {
  id: string;
  title: string;
  url: string;
  text: string;
  acl: readonly string[]; // principal ids allowed to read: users, groups, domain-wide grants
}

export interface Ranked {
  chunk: Chunk;
  score: number;
}

export interface Packed {
  context: string; // one JSON object per line, so document text cannot forge a source boundary
  sources: Chunk[]; // sources[i] is cited as [i + 1]
  usedTokens: number;
}

export const RRF_K = 60; // Cormack et al., SIGIR 2009: a large k favors agreement over one top rank

/** Fail closed: an unknown chunk or an empty ACL is readable by no one. */
export function canRead(chunk: Chunk | undefined, principals: ReadonlySet<string>): chunk is Chunk {
  return chunk !== undefined && chunk.acl.some((p) => principals.has(p));
}

/**
 * Reciprocal rank fusion of retriever rankings (chunk ids, best first). Unreadable chunks are
 * dropped BEFORE ranks are assigned, as the engines' ACL filters do in production, so they can
 * neither appear nor push readable chunks down.
 */
export function hybridRank(
  rankings: readonly (readonly string[])[], // e.g. [bm25Ids, vectorIds]
  chunks: ReadonlyMap<string, Chunk>, // keyed by chunk id
  principals: ReadonlySet<string>, // the user id plus every group, nested ones included
): Ranked[] {
  const hits = new Map<string, { chunk: Chunk; ranks: number[] }>();
  for (const ranking of rankings) {
    const seen = new Set<string>();
    for (const id of ranking) {
      const chunk = chunks.get(id);
      if (seen.has(id) || !canRead(chunk, principals)) continue;
      seen.add(id); // a repeated id counts once per list, at its best rank
      const hit = hits.get(id) ?? { chunk, ranks: [] };
      hit.ranks.push(seen.size); // 1-based rank among readable chunks only
      hits.set(id, hit);
    }
  }
  const out: Ranked[] = [];
  for (const { chunk, ranks } of hits.values()) {
    ranks.sort((a, b) => a - b); // fixed order: float addition is not associative
    let score = 0;
    for (const r of ranks) score += 1 / (RRF_K + r);
    out.push({ chunk, score });
  }
  // Ties are common (rank 1 in a single list always scores 1/61): break them by id.
  return out.sort((a, b) =>
    b.score - a.score || (a.chunk.id < b.chunk.id ? -1 : a.chunk.id > b.chunk.id ? 1 : 0));
}

/** Greedy packing in rank order: a chunk that does not fit is skipped, never split. */
export function packContext(
  ranked: readonly Ranked[],
  budgetTokens: number,
  countTokens: (s: string) => number, // the generator model's tokenizer
): Packed {
  const sources: Chunk[] = [];
  let context = '';
  let usedTokens = 0;
  for (const { chunk } of ranked) {
    const source = sources.length + 1;
    const line = JSON.stringify({ source, title: chunk.title, text: chunk.text }) + '\\n';
    const cost = countTokens(line);
    if (usedTokens + cost <= budgetTokens) { // false for NaN, so a bad count cannot overflow
      sources.push(chunk);
      context += line;
      usedTokens += cost;
    } // otherwise skip it: a later, shorter chunk may still fit
  }
  return { context, sources, usedTokens };
}`,
  },
  followUps: [
    {
      question: 'Why not fine-tune the model on the company’s documents instead?',
      answer:
        'Fine-tuning blends documents into the weights, so it cannot enforce per-user permissions, cite sources or forget a deleted document without retraining, and it goes stale between training runs. It can still help with tone, output format or domain vocabulary, layered on top of retrieval.',
    },
    {
      question: 'How do you handle multi-turn conversations?',
      answer:
        'Rewrite each follow-up into a standalone query using the conversation ("what about France?" becomes "parental leave policy in France") and retrieve again on every turn. Chunks cited in earlier turns are stored as ids, not text, and re-checked against the user’s current principals on every turn, so access revoked mid-conversation also removes them from later answers.',
    },
    {
      question: 'What changes if the corpus grows 10×?',
      answer:
        '1B chunks need ≈ 4 TB of float32 vectors, so keep compressed vectors (int8 or product quantization) in RAM and re-score the top candidates with full vectors from SSD, or use an SSD-resident graph index such as DiskANN (Subramanya et al., NeurIPS 2019). Shard large tenants’ indexes by document and query the shards in parallel.',
    },
  ],
};
