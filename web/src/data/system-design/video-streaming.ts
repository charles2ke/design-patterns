import type { SystemDesignQuestion } from '../../types/system-design';

export const videoStreaming: SystemDesignQuestion = {
  slug: 'video-streaming',
  title: 'Design a video streaming platform (YouTube / Netflix)',
  difficulty: 'Medium',
  companies: ['Google', 'Netflix'],
  prompt:
    'Design a video platform like YouTube or Netflix. Creators upload videos of any length, and viewers watch them on phones, browsers and TVs; playback should start within about two seconds and keep going on poor networks. Assume 500 hours of video uploaded per minute, 1 billion views per day and 10 million concurrent viewers at peak.',
  signals: [
    'Separates the write path (upload and transcode, ≈ 300 Gbps of ingest) from the read path (≈ 30 Tbps of egress) and sizes each with arithmetic.',
    'Makes large uploads and transcoding failure-tolerant: resumable chunked uploads, idempotent tasks and a retrying workflow instead of one long-running job.',
    'Explains adaptive bitrate streaming end to end: the encoding ladder, segmented HLS/DASH packaging and the player’s choice of rendition.',
    'Pushes delivery to CDN edges, tiers storage by popularity, and keeps metadata, search and view counting off the segment path.',
  ],
  requirements: {
    functional: [
      'Creators upload large files (tens of GB) that resume after a network drop instead of restarting.',
      'Each upload is transcoded into a ladder of resolutions and bitrates, packaged for HLS and DASH, given thumbnails and made playable within minutes.',
      'Viewers stream with adaptive quality on any device and can seek anywhere in the video.',
      'Viewers can search for videos and open a video page with title, description and an approximate view count.',
    ],
    nonFunctional: [
      'Playback starts in under ~2 s at p90, and rebuffering stays well under 1% of watch time.',
      'Playback is highly available (99.99%); an accepted upload is never lost, although processing may be delayed.',
      'Originals are stored durably so every rendition can be regenerated when codecs or ladders change.',
      'Cost-efficient at exabyte scale: storage and CDN egress dominate the bill, so both are tuned by popularity.',
    ],
    outOfScope: [
      'Recommendations and the home feed.',
      'Live streaming (covered as a follow-up).',
      'DRM license servers, ads and creator monetization.',
    ],
  },
  estimates: [
    'Uploads: 500 h/min × 1,440 min ≈ 720,000 hours/day, i.e. 30,000 seconds of video arriving per second. At a ~10 Mbps source bitrate (4.5 GB/hour) that is ≈ 300 Gbps of ingest and ≈ 3.2 PB/day of originals.',
    'Renditions: an assumed ladder of 0.4 + 0.8 + 1.4 + 2.8 + 5 = 10.4 Mbps ≈ 4.7 GB per hour of video, so ≈ 3.4 PB/day of new renditions and ≈ 1.2 EB/year before replication.',
    'Transcoding: assuming ~5 vCPU-seconds to encode one second of video across the whole ladder, keeping up takes 30,000 × 5 ≈ 150,000 vCPUs on average, so encoding must be massively parallel and run on cheap preemptible capacity.',
    'Egress: 10M concurrent viewers × ~3 Mbps average ≈ 30 Tbps at peak, about 100× the ingest, so delivery rather than upload shapes the architecture and the bill.',
    'Segment requests: with 4 s segments each viewer fetches one every 4 s, so 10M ÷ 4 ≈ 2.5M GETs/s; even at a 95% edge hit ratio, ≈ 125,000 GETs/s and ≈ 1.5 Tbps reach the next cache tier.',
    'Views: 1B/day ÷ 86,400 s ≈ 11,600 view events/s on average and ≈ 35,000/s at a 3× peak, concentrated on a few hot videos, so a stream job batches them instead of updating a row per view.',
  ],
  api: `POST /api/v1/uploads
Authorization: Bearer <token>
{ "fileName": "trip.mov", "sizeBytes": 8589934592, "contentType": "video/quicktime" }
-> 201 Created  { "videoId": "v_8f3k", "uploadId": "up_91c", "partSize": 16777216,
                  "parts": [ { "n": 1, "url": "https://raw.example/...&sig=..." }, ... ] }
-> 400 Bad Request (unsupported type, file too large)  |  429 Too Many Requests

PUT <pre-signed part URL>                    (bytes go straight to object storage)
-> 200 OK  ETag: "9b2c..."

GET /api/v1/uploads/up_91c                   (resume: parts received + fresh URLs)
-> 200 OK  { "receivedParts": [1, 2, 3], "parts": [ { "n": 4, "url": "..." }, ... ] }

POST /api/v1/uploads/up_91c/complete  { "parts": [ { "n": 1, "etag": "9b2c..." }, ... ] }
-> 202 Accepted  { "videoId": "v_8f3k", "status": "PROCESSING" }      (idempotent)

GET /api/v1/videos/v_8f3k
-> 200 OK  { "title": "...", "status": "READY", "views": 10432,
             "hls": "https://cdn.example/v/v_8f3k/master.m3u8",
             "dash": "https://cdn.example/v/v_8f3k/manifest.mpd" }
-> 404 Not Found  |  410 Gone (removed)

GET /api/v1/search?q=alps+hike&cursor=...
-> 200 OK  { "results": [ { "videoId": "v_8f3k", "title": "..." } ], "next": "..." }

GET https://cdn.example/v/v_8f3k/720p/seg_00042.m4s
-> 200 OK  Cache-Control: public, max-age=31536000, immutable

POST /api/v1/views  { "videoId": "v_8f3k", "sessionId": "s_77", "watchedSec": 30 }
-> 202 Accepted   (sent once per playback session after ~30 s of watching)`,
  dataModel: `videos           sharded by video_id; read through a cache (one row per page view)
  video_id      string     primary key
  owner_id      string     index (owner_id, created_at): a channel, newest first
  title, description, tags  text   copied to the search index via CDC
  status        enum       UPLOADING | PROCESSING | READY | FAILED | REMOVED
  duration_ms   int
  renditions    json       [{ "name": "720p", "kbps": 2800, "codec": "avc1" }, ...]
  storage_tier  enum       HOT | WARM | COLD, set by a daily popularity job
  created_at    timestamp

uploads          upload_id primary key; expires after 7 days with any unfinished parts
  video_id, owner_id, size_bytes, part_size, status, created_at

transcode_tasks  primary key (video_id, stage, chunk, rendition)
  status, attempt, lease_until, output_key   deterministic key: a retry overwrites

view_counts      video_id primary key; written only by the aggregation job
  approx_views  int64      exact count recomputed daily from the event log

Media objects are immutable keys (v/{video_id}/{rendition}/seg_{n}.m4s) in object
storage. Playback reads one cached videos row; segment requests never touch a database.`,
  architecture: {
    diagram: `+---------+ 1. start, complete  +------------+  2. start   +-----------+
| Creator |-------------------->| Upload API |------------>| Transcode |
+----+----+                     +------------+  workflow   | DAG       |
     | 1. PUT parts                                        | split,    |
     v    (pre-signed)                                     | encode,   |
+-------------+                                            | package,  |
| Raw uploads |---------------- 3. source ---------------->| thumbs    |
+-------------+                                            +--+-----+--+
                                    3. segments, manifests    |     |
+-------------------------------+                             |     |
| Media store (hot/warm/cold)   |<----------------------------+     |
+---------------+---------------+                         4. READY  |
                ^ miss                                              v
+---------------+---------------+    +------+-------+   +-------+------+
| Origin shield                 |    | View counter |-->| Metadata API |
+---------------+---------------+    | (stream job) |   | DB + search  |
                ^ miss               +------+-------+   +-------+------+
+---------------+---------------+           ^                   ^
| CDN edge / ISP caches         | 6. events |  5. page, search  |
+---------------+---------------+           |                   |
                ^ 5. manifest, segments     |                   |
+---------------+---------------------------+-------------------+------+
|                         Viewer (ABR player)                          |
+----------------------------------------------------------------------+`,
    flow: [
      'Upload: the creator’s client calls the Upload API to start, receives pre-signed part URLs, PUTs 16 MiB parts directly to raw object storage (re-sending only missing parts after a drop) and then calls complete.',
      'The Upload API completes the multipart object, marks the video PROCESSING and starts a transcoding workflow keyed by video_id, so a repeated complete call cannot start a second one.',
      'The transcode DAG reads the source, splits it at keyframes, encodes every chunk × rendition in parallel, packages HLS/DASH segments and manifests, extracts thumbnails and writes everything under immutable keys in the media store.',
      'It then marks the video READY in the metadata database; change data capture feeds the search index.',
      'Playback: the player loads the video page and search results from the Metadata API, then fetches the manifest and segments from the nearest CDN edge or ISP cache; misses go to the origin shield and then the media store.',
      'After ~30 s of watching, the player sends a view event to a stream job that deduplicates and aggregates events and periodically writes approximate counts to the metadata database.',
    ],
  },
  deepDives: [
    {
      heading: 'Resumable uploads and the transcoding DAG',
      points: [
        'The client splits the file into 16 MiB parts and PUTs each to a pre-signed URL (for example an S3 multipart upload), so bytes bypass the API tier, parts upload in parallel and a dropped connection costs one part, not the whole file.',
        'A probe step validates the container and codecs and rejects corrupt files early; the source is then split at keyframes into ~10 s chunks. A 10-minute video × 5 rungs becomes 300 independent encode tasks, so wall-clock time is close to one chunk’s encode.',
        'Encoders force a keyframe at every segment boundary (e.g. every 4 s) so all renditions align and the player can switch at any segment. Packaging as CMAF fragmented MP4 lets the same segments serve both HLS and DASH manifests.',
        'A workflow engine (e.g. Temporal or AWS Step Functions) runs the DAG with per-task retries and backoff. Tasks write to deterministic keys, so a retried or duplicated task overwrites identical output instead of corrupting it.',
        'Thumbnails and preview sprites run as a parallel branch. Publishing the low rungs first lets a video go READY within minutes while 4K and newer codecs finish later.',
      ],
    },
    {
      heading: 'Adaptive bitrate in the player',
      points: [
        'The player picks a rendition from the master manifest for every segment, with no server involvement; if a download runs far slower than expected, it aborts and refetches that segment at a lower rung before the buffer runs dry.',
        'Throughput rule: measure each segment download, smooth the samples and choose the highest bitrate under ~80% of the estimate. Shaka Player’s open-source estimator keeps a fast and a slow EWMA and uses the lower one, so it adapts down quickly but up slowly.',
        'Buffer rule: with only a few seconds buffered, drop to the lowest rung, since a stall hurts more than low quality. The 2014 SIGCOMM paper on buffer-based rate adaptation reports a 10–20% lower rebuffer rate than Netflix’s then-default algorithm in a Netflix experiment.',
        'Hysteresis prevents flapping: step down immediately, but step up only with ≥ 12 s of buffer and when the higher rung fits a stricter 65% of the estimate, so noise near a rung boundary does not toggle quality.',
        'At startup the buffer is empty, so the first pick comes from the previous session’s estimate if there is one, otherwise the lowest rung; quality climbs once the first segments are measured.',
      ],
    },
    {
      heading: 'CDN delivery, Open Connect and storage tiers',
      points: [
        'Segments are immutable, so edges cache them with year-long TTLs, while manifests, which change during processing or takedowns, get short TTLs. Versioned URLs mean a re-encode never needs a purge.',
        'Edges miss to a regional origin shield that coalesces concurrent misses for the same segment, so a viral video sends one request per segment to the media store rather than one per edge.',
        'Netflix publicly documents Open Connect: caching appliances it provides to ISPs to host inside their networks. Each stores part of the catalog and is push-filled nightly during off-peak hours as popularity changes. That suits a curated catalog; user uploads lean more on pull-through caching.',
        'Tier storage by popularity: hot renditions on fast replicated storage, the long tail on cheaper infrequent-access or erasure-coded storage, and originals in archive storage because only re-encodes read them. A daily job moves objects based on recent views.',
      ],
    },
    {
      heading: 'Metadata, search and view counts',
      points: [
        'Video metadata lives in a database sharded by video_id behind a cache; a page view is one cached read, and only creator edits and the transcoding workflow write to it.',
        'Search runs on an inverted index (e.g. Elasticsearch or OpenSearch) fed by change data capture from the metadata database, so the index can lag by seconds without affecting uploads or playback.',
        'View events go to Kafka; a stream job deduplicates by (session, video), filters bots and adds per-video deltas to the counters every few seconds, so ≈ 35,000 events/s become periodic batched increments.',
        'Counts are approximate and slightly delayed by design; a daily batch job recomputes exact counts from the raw event log and corrects any drift.',
      ],
    },
  ],
  tradeOffs: [
    {
      decision: 'Upload path',
      choice: 'Pre-signed, resumable multipart uploads straight to object storage',
      rationale:
        'Bytes never pass through API servers and only failed parts are re-sent. Proxying uploads through the API tier would need ≈ 300 Gbps of application capacity and lose progress on every dropped connection.',
    },
    {
      decision: 'Transcoding granularity',
      choice: 'DAG of chunk × rendition tasks',
      rationale:
        'Short idempotent tasks parallelize, retry cheaply and run on preemptible machines. Encoding the whole file per rendition on one machine is simpler but takes hours for long videos and restarts from zero after a crash.',
    },
    {
      decision: 'Bitrate selection',
      choice: 'Client-side ABR over HLS/DASH segments',
      rationale:
        'Only the client sees its own throughput and buffer, and segments stay cacheable static files. Server-side adaptation would need per-viewer state and would defeat CDN caching.',
    },
    {
      decision: 'Delivery network',
      choice: 'Multi-CDN with an origin shield; own edge caches only at very large scale',
      rationale:
        'Commercial CDNs are the cheapest way to start and allow failover between providers. Building appliances inside ISPs, as Netflix does with Open Connect, pays off only for very large and predictable traffic.',
    },
    {
      decision: 'View counting',
      choice: 'Asynchronous stream aggregation with approximate counts',
      rationale:
        'A synchronous increment per view would turn popular videos into hot rows on the page-load path; slightly stale, deduplicated counts are acceptable for display.',
    },
  ],
  failureModes: [
    'Interrupted upload: the client asks which parts arrived and re-sends only the rest; a lifecycle rule aborts multipart uploads still incomplete 7 days after they began, so orphaned parts stop costing storage.',
    'Transcoder crash or preemption: the task lease expires and the workflow reschedules it, and deterministic output keys make the retry safe. A corrupt source fails permanently at the probe step and the creator is notified instead of retrying forever.',
    'Viral thundering herd: millions of players request the same new segments at once. Shields coalesce misses into one origin fetch per segment, and trending videos can be pre-warmed to edges.',
    'CDN or region outage: health-based DNS or client-side steering moves traffic to another CDN, and manifests list alternate hosts (multiple DASH BaseURLs or redundant HLS variant streams) so players fail over mid-session.',
    'View-count fraud: bots inflate counts. Deduplicate per session, rate-limit per IP and account, and let the daily batch job discard suspicious traffic before counts become final.',
  ],
  code: {
    label: 'TypeScript: smoothed throughput estimate and buffer-aware rendition choice with hysteresis',
    language: 'TypeScript',
    code: `export interface Rendition {
  id: string;
  bitrateKbps: number;
}

export interface AbrConfig {
  safety: number; // share of the estimate a rendition may use
  upSafety: number; // stricter share required before stepping up
  panicBufferSec: number; // below this, drop straight to the lowest rendition
  upBufferSec: number; // never step up with less buffer than this
}

export const DEFAULT_ABR: AbrConfig = {
  safety: 0.8,
  upSafety: 0.65,
  panicBufferSec: 4,
  upBufferSec: 12,
};

// Tiny responses measure latency rather than bandwidth and would drag the estimate down.
const MIN_SAMPLE_BYTES = 16_000;

/** Fast and slow EWMAs of segment throughput; their minimum drops quickly and rises slowly. */
export class ThroughputEstimator {
  private fast = 0;
  private slow = 0;
  private samples = 0;
  private readonly fastHalfLifeSec: number;
  private readonly slowHalfLifeSec: number;

  constructor(fastHalfLifeSec = 2, slowHalfLifeSec = 5) {
    if (!(fastHalfLifeSec > 0 && slowHalfLifeSec > 0)) throw new RangeError('bad half-life');
    this.fastHalfLifeSec = fastHalfLifeSec;
    this.slowHalfLifeSec = slowHalfLifeSec;
  }

  addSample(bytes: number, durationMs: number): void {
    if (!Number.isFinite(bytes) || !Number.isFinite(durationMs)) return;
    if (bytes < MIN_SAMPLE_BYTES || durationMs <= 0) return;
    const kbps = (bytes * 8) / durationMs; // bits per ms = kilobits per s
    const first = this.samples++ === 0;
    // Weighting by download time lets a long download move the average more than a short one.
    const keepFast = first ? 0 : 0.5 ** (durationMs / 1000 / this.fastHalfLifeSec);
    const keepSlow = first ? 0 : 0.5 ** (durationMs / 1000 / this.slowHalfLifeSec);
    this.fast = keepFast * this.fast + (1 - keepFast) * kbps;
    this.slow = keepSlow * this.slow + (1 - keepSlow) * kbps;
  }

  estimateKbps(fallbackKbps = 0): number {
    return this.samples === 0 ? fallbackKbps : Math.min(this.fast, this.slow);
  }
}

/** Picks the rendition for the next segment; currentId is null at startup and after a seek. */
export function chooseRendition(
  ladder: readonly Rendition[],
  currentId: string | null,
  estimateKbps: number,
  bufferSec: number,
  cfg: AbrConfig = DEFAULT_ABR,
): Rendition | null {
  const rungs = ladder
    .filter((r) => Number.isFinite(r.bitrateKbps) && r.bitrateKbps > 0)
    .sort((a, b) => a.bitrateKbps - b.bitrateKbps);
  const lowest = rungs[0];
  if (lowest === undefined) return null;
  const bw = Number.isFinite(estimateKbps) && estimateKbps > 0 ? estimateKbps : 0;
  const highestFitting = (share: number): Rendition => {
    let best = lowest;
    for (const r of rungs) if (r.bitrateKbps <= bw * share) best = r;
    return best;
  };
  const current = rungs.find((r) => r.id === currentId);
  // The buffer is empty at startup by definition, so only the estimate can guide this pick.
  if (current === undefined) return highestFitting(cfg.safety);
  const buffer = Number.isFinite(bufferSec) ? bufferSec : 0;
  // About to stall: a rebuffer hurts viewers more than any drop in quality.
  if (buffer < cfg.panicBufferSec) return lowest;
  const target = highestFitting(cfg.safety);
  if (target.bitrateKbps < current.bitrateKbps) return target;
  // Up-switches need a healthy buffer and a stricter margin, so noise near a rung cannot flap.
  if (buffer < cfg.upBufferSec) return current;
  const up = highestFitting(Math.min(cfg.upSafety, cfg.safety));
  return up.bitrateKbps > current.bitrateKbps ? up : current;
}`,
  },
  followUps: [
    {
      question: 'How would you support live streaming?',
      answer:
        'Ingest RTMP or SRT, transcode the ladder in real time on dedicated machines and publish short segments, or Low-Latency HLS partial segments when seconds of delay matter. Playlists change every segment, so they get a TTL shorter than one segment while segments stay immutable. The CDN, shield and ABR player are reused, and the recording then goes through the normal on-demand pipeline.',
    },
    {
      question: 'How would you cut storage and CDN costs?',
      answer:
        'Re-encode popular videos with VP9 or AV1, which need fewer bits for the same quality but cost far more to encode, so they pay off only for widely watched content. Tune the ladder per title, as Netflix described in its 2015 per-title encoding post, and keep fewer rungs for long-tail videos.',
    },
    {
      question: 'Segments are cached for a year. How do you take a video down quickly?',
      answer:
        'Never rely on cache expiry. Mark the video REMOVED so the Metadata API returns 410, serve manifests and segments behind short-lived signed URLs or tokens that the CDN validates, and purge cached objects by path prefix or cache tag. Origin objects are deleted after a short grace period.',
    },
  ],
};
