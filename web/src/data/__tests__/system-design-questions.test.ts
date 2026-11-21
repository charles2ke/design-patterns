import { describe, expect, it } from 'vitest';
import { systemDesignQuestions } from '../system-design-questions';
import {
  FEATURED_COMPANIES,
  SYSTEM_DESIGN_DIFFICULTIES,
  type Company,
} from '../../types/system-design';

const COMPANY_ORDER: readonly Company[] = [
  ...FEATURED_COMPANIES,
  'Airbnb',
  'Dropbox',
  'LinkedIn',
  'Lyft',
  'Netflix',
  'Stripe',
  'Uber',
];

function expectUnique(values: readonly string[], context: string) {
  expect(new Set(values).size, context).toBe(values.length);
}

function questionText(slug: string): string {
  const question = systemDesignQuestions.find((item) => item.slug === slug);
  if (question === undefined) throw new Error(`Unknown system design question: ${slug}`);
  return [
    question.api,
    question.dataModel,
    question.architecture.diagram,
    ...question.architecture.flow,
    ...question.deepDives.flatMap(({ heading, points }) => [heading, ...points]),
    ...question.tradeOffs.flatMap(({ decision, choice, rationale }) => [decision, choice, rationale]),
    ...question.failureModes,
    question.code.code,
    ...question.followUps.flatMap(({ question: prompt, answer }) => [prompt, answer]),
  ].join('\n');
}

describe('system design questions data', () => {
  it('uses unique slugs and titles', () => {
    expectUnique(
      systemDesignQuestions.map(({ slug }) => slug),
      'slugs',
    );
    expectUnique(
      systemDesignQuestions.map(({ title }) => title),
      'titles',
    );
  });

  it('offers several questions at every difficulty', () => {
    for (const level of SYSTEM_DESIGN_DIFFICULTIES) {
      expect(
        systemDesignQuestions.filter(({ difficulty }) => difficulty === level).length,
        level,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it('tags every featured company on at least one question', () => {
    for (const company of FEATURED_COMPANIES) {
      expect(
        systemDesignQuestions.some(({ companies }) => companies.includes(company)),
        company,
      ).toBe(true);
    }
  });

  it('lists each question’s companies once, in a consistent order', () => {
    for (const { slug, companies } of systemDesignQuestions) {
      expect(companies.length, slug).toBeGreaterThan(0);
      expect(companies, slug).toEqual(
        [...new Set(companies)].sort((a, b) => COMPANY_ORDER.indexOf(a) - COMPANY_ORDER.indexOf(b)),
      );
    }
  });

  it('keeps list entries unique because they double as React keys', () => {
    for (const question of systemDesignQuestions) {
      const lists: Record<string, readonly string[]> = {
        signals: question.signals,
        functional: question.requirements.functional,
        nonFunctional: question.requirements.nonFunctional,
        outOfScope: question.requirements.outOfScope,
        estimates: question.estimates,
        flow: question.architecture.flow,
        deepDives: question.deepDives.map(({ heading }) => heading),
        tradeOffs: question.tradeOffs.map(({ decision }) => decision),
        failureModes: question.failureModes,
        followUps: question.followUps.map(({ question: followUp }) => followUp),
        ...Object.fromEntries(
          question.deepDives.map(({ heading, points }) => [`deep dive "${heading}"`, points]),
        ),
      };
      for (const [name, values] of Object.entries(lists)) {
        expect(values.length, `${question.slug} ${name}`).toBeGreaterThan(0);
        expectUnique(values, `${question.slug} ${name}`);
      }
    }
  });

  it('keeps chat retry IDs with durable messages and checks the log before assigning a sequence', () => {
    const chat = systemDesignQuestions.find(({ slug }) => slug === 'chat-messaging');
    expect(chat).toBeDefined();
    expect(chat!.dataModel).toContain('client_msg_id    uuid       retry key stored with the message');
    expect(chat!.dataModel).not.toContain('client_msg_ids  PRIMARY KEY');
    expect(chat!.code.code.indexOf('await this.findByClientId(')).toBeLessThan(
      chat!.code.code.indexOf('await this.persist('),
    );
  });

  it('guards durable moderation, version-fenced indexing, block reuse and due scheduler claims', () => {
    expect(questionText('chatgpt')).toContain('appends only approved text');
    expect(questionText('enterprise-search-rag')).toContain('index_fences');
    expect(questionText('enterprise-search-rag')).toContain('tombstone=false');
    expect(questionText('file-sync')).toContain('Reuse always revalidates block_index');
    expect(questionText('file-sync')).toContain('fresh upload');
    expect(questionText('job-scheduler')).toContain("state = 'queued' AND run_at <= now()");
    expect(questionText('job-scheduler')).toContain('future retries retain their backoff');
  });

  it('documents offline inventory safety, per-operation PSP keys and Redis Cluster partial charges', () => {
    expect(questionText('parking-garage')).toContain('does not resell a canceled spot');
    expect(questionText('parking-garage')).toContain('rejects unknown reservations');
    expect(questionText('payment-system')).toContain('stable and unique per refund');
    expect(questionText('payment-system')).toContain('refund:<refund_id>');
    expect(questionText('rate-limiter')).toContain('one atomic script per subject');
    expect(questionText('rate-limiter')).toContain('later rejection may leave earlier');
  });

  it('freezes guest carts, surfaces stale offline edits, and confirms authoritative ticket holds', () => {
    expect(questionText('shopping-cart')).toContain('OPEN to FROZEN');
    expect(questionText('shopping-cart')).toContain('RESYNC_REQUIRED');
    expect(questionText('ticket-booking')).toContain('readHold(holdId)');
    expect(questionText('ticket-booking')).toContain('database now()');
    expect(questionText('ticket-booking')).toContain('confirmHold');
  });

  it('filters streaming suggestions and uses lookup-equivalent keys for aggregation', () => {
    const typeahead = questionText('typeahead');
    expect(typeahead).toContain('filterPublicCandidates');
    expect(typeahead).toContain('distinctUsers');
    expect(typeahead).toContain('isUnsafe');
    expect(typeahead).toContain('const folded = trieKey(query)');
    expect(typeahead).toContain('Aggregate on the lookup key');
  });

  it('keeps short codes retired and guards cache, client events, crawler fetches and webhooks', () => {
    expect(questionText('url-shortener')).toContain("'ACTIVE' | 'TOMBSTONE'");
    expect(questionText('url-shortener')).toContain('randomBytes(8)');
    expect(questionText('url-shortener')).toContain('without deleting the reservation');
    expect(questionText('user-settings-service')).toContain('cache_fences');
    expect(questionText('user-settings-service')).toContain('below that fence');
    expect(questionText('view-counter')).toContain('IndexedDB');
    expect(questionText('view-counter')).toContain('outbox.oldest(100)');
    expect(questionText('view-counter')).toContain('ack.durable');
    expect(questionText('web-crawler')).toContain('isPublicAddress');
    expect(questionText('web-crawler')).toContain('transport.get(url, addresses[0]!)');
    expect(questionText('web-crawler')).toContain('maxRedirects');
    expect(questionText('webhook-delivery')).toContain('dedupe on body.id');
    expect(questionText('webhook-delivery')).toContain('reject a mismatching Webhook-Id');
  });

  it('retains chat retry identity and repairs sequenced presence and location updates', () => {
    expect(questionText('chat-messaging')).toContain('or TTL');
    expect(questionText('chat-messaging')).toContain('full message-history lifetime');
    expect(questionText('presence-service')).toContain('periodic snapshot revalidation');
    expect(questionText('presence-service')).toContain('per-user sequence');
    expect(questionText('ride-hailing')).toContain('seqWatermarks');
    expect(questionText('ride-hailing')).toContain('beginDeviceSession');
    expect(questionText('ride-hailing')).toContain('activeSessions.get(id) !== sessionId');
  });

  it('keeps diagrams to printable ASCII so the monospace layout lines up', () => {
    for (const { slug, architecture } of systemDesignQuestions) {
      expect(architecture.diagram, slug).toMatch(/^[\x20-\x7e\n]+$/);
    }
  });
});
