import type { SystemDesignDifficulty, SystemDesignQuestion } from '../types/system-design';
import { adClickAggregator } from './system-design/ad-click-aggregator';
import { chatMessaging } from './system-design/chat-messaging';
import { chatgpt } from './system-design/chatgpt';
import { collaborativeEditor } from './system-design/collaborative-editor';
import { distributedCache } from './system-design/distributed-cache';
import { distributedKvStore } from './system-design/distributed-kv-store';
import { enterpriseSearchRag } from './system-design/enterprise-search-rag';
import { fileSync } from './system-design/file-sync';
import { inMemoryDatabase } from './system-design/in-memory-database';
import { jobScheduler } from './system-design/job-scheduler';
import { llmInferenceServing } from './system-design/llm-inference-serving';
import { newsFeed } from './system-design/news-feed';
import { notificationService } from './system-design/notification-service';
import { parkingGarage } from './system-design/parking-garage';
import { paymentSystem } from './system-design/payment-system';
import { presenceService } from './system-design/presence-service';
import { rateLimiter } from './system-design/rate-limiter';
import { rideHailing } from './system-design/ride-hailing';
import { shoppingCart } from './system-design/shopping-cart';
import { ticketBooking } from './system-design/ticket-booking';
import { typeahead } from './system-design/typeahead';
import { urlShortener } from './system-design/url-shortener';
import { userSettingsService } from './system-design/user-settings-service';
import { videoStreaming } from './system-design/video-streaming';
import { viewCounter } from './system-design/view-counter';
import { webCrawler } from './system-design/web-crawler';
import { webhookDelivery } from './system-design/webhook-delivery';

/** Ordered from easy to hard; the page groups them by difficulty. */
export const systemDesignQuestions: readonly SystemDesignQuestion[] = [
  // Easy
  urlShortener,
  inMemoryDatabase,
  viewCounter,
  presenceService,
  userSettingsService,
  parkingGarage,
  shoppingCart,
  // Medium
  rateLimiter,
  typeahead,
  notificationService,
  chatMessaging,
  newsFeed,
  ticketBooking,
  videoStreaming,
  webhookDelivery,
  chatgpt,
  distributedCache,
  // Hard
  llmInferenceServing,
  collaborativeEditor,
  distributedKvStore,
  paymentSystem,
  rideHailing,
  adClickAggregator,
  fileSync,
  webCrawler,
  jobScheduler,
  enterpriseSearchRag,
];

export const DIFFICULTY_DESCRIPTIONS: Record<SystemDesignDifficulty, string> = {
  Easy: 'One service with a clear data model. Common in phone screens and junior to mid-level loops; the bar is a clean, complete design with sensible numbers.',
  Medium:
    'Several components with fan-out, real-time delivery or consistency trade-offs. The core of most onsite loops.',
  Hard: 'Hard correctness, scale or hardware constraints that need careful deep dives. Typical of senior and staff loops.',
};

export interface FrameworkStep {
  step: string;
  minutes: string;
  goal: string;
}

/** A time budget for a typical 45-minute system design round. */
export const INTERVIEW_FRAMEWORK: readonly FrameworkStep[] = [
  {
    step: 'Clarify requirements',
    minutes: '~5 min',
    goal: 'Agree on the core use cases, users and scale. Write down functional and non-functional requirements and what is out of scope.',
  },
  {
    step: 'Estimate scale',
    minutes: '~3–5 min',
    goal: 'Turn users into requests per second, storage and bandwidth. Only estimate what changes the design.',
  },
  {
    step: 'API and data model',
    minutes: '~5 min',
    goal: 'Define the endpoints or events, the core entities and their keys, and the main access patterns.',
  },
  {
    step: 'High-level design',
    minutes: '~10 min',
    goal: 'Draw the request path end to end with the fewest boxes that meet the requirements, then walk one request through it.',
  },
  {
    step: 'Deep dives',
    minutes: '~15 min',
    goal: 'Go deep on the two or three hardest parts — bottlenecks, consistency, failure handling — and let the interviewer steer.',
  },
  {
    step: 'Wrap up',
    minutes: '~5 min',
    goal: 'Summarize the trade-offs, name the failure modes and say what you would change at 10× scale.',
  },
];

export const ESTIMATION_CHEAT_SHEET: readonly string[] = [
  '1 day ≈ 86,400 s ≈ 10^5 s, so 1 million requests a day ≈ 12 requests per second on average.',
  'Plan for peaks of roughly 2–3× the average, and more for event-driven spikes such as ticket sales.',
  'Latency orders of magnitude: memory reference ~100 ns, SSD random read ~100 µs, round trip within a data center ~0.5 ms, cross-continent round trip ~150 ms.',
  'Storage: 1 million × 1 KB ≈ 1 GB and 1 billion × 1 KB ≈ 1 TB.',
  'Per-node throughput depends heavily on hardware and workload, but as orders of magnitude: a relational database serves thousands to tens of thousands of simple queries per second, and an in-memory store such as Redis around 100,000 operations per second.',
];
