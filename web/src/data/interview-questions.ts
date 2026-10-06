export type InterviewCategory = 'Design Patterns' | 'System Design';

export interface SolutionSection {
  heading: string;
  points: string[];
}

export interface InterviewCodeSample {
  label: string;
  code: string;
}

export interface InterviewQuestion {
  slug: string;
  category: InterviewCategory;
  title: string;
  question: string;
  whyItIsHard: string;
  solution: SolutionSection[];
  code: InterviewCodeSample;
  followUps: string[];
}

export const INTERVIEW_CATEGORIES: InterviewCategory[] = [
  'Design Patterns',
  'System Design',
];

export const interviewQuestions: InterviewQuestion[] = [
  // ---------------------------------------------------------------------------
  // Design patterns
  // ---------------------------------------------------------------------------
  {
    slug: 'thread-safe-singleton',
    category: 'Design Patterns',
    title: 'Make a Singleton thread-safe, lazy and testable',
    question:
      'Implement a lazily initialised Singleton that is safe under concurrent access without paying for a lock on every call. Then explain why many teams consider Singleton an anti-pattern and what you would use instead.',
    whyItIsHard:
      'Candidates must understand memory visibility (why double-checked locking is broken without volatile), class-loading guarantees, and the hidden-global-state cost of Singleton for testing.',
    solution: [
      {
        heading: 'Correct implementations',
        points: [
          'Initialization-on-demand holder: a nested static class holds the instance; the JVM guarantees class initialisation is lazy and thread-safe, with no explicit locking.',
          'Double-checked locking is only correct when the field is volatile; without it another thread can observe a reference to a partially constructed object.',
          'An enum with a single constant is the simplest serialization- and reflection-safe Singleton in Java.',
        ],
      },
      {
        heading: 'Why it is often an anti-pattern',
        points: [
          'It is global mutable state: any code can reach it, so dependencies are hidden from constructors.',
          'Tests cannot substitute a fake easily and state leaks between test cases.',
          'It couples "there is one instance" (a lifecycle decision) with the class itself.',
        ],
      },
      {
        heading: 'Preferred alternative',
        points: [
          'Create one instance at the composition root and inject it (dependency injection with singleton scope).',
          'Depend on an interface so tests can pass an in-memory implementation.',
        ],
      },
    ],
    code: {
      label: 'Java: holder idiom, volatile double-checked locking and DI-friendly usage',
      code: `public final class Config {
    private Config() { /* load once */ }

    // 1. Holder idiom: lazy + thread-safe via class-loading guarantees.
    private static final class Holder {
        static final Config INSTANCE = new Config();
    }
    public static Config getInstance() { return Holder.INSTANCE; }
}

public final class Registry {
    // 2. Double-checked locking: 'volatile' is mandatory.
    private static volatile Registry instance;
    private Registry() {}

    public static Registry getInstance() {
        Registry local = instance;            // one volatile read on the fast path
        if (local == null) {
            synchronized (Registry.class) {
                local = instance;
                if (local == null) {
                    instance = local = new Registry();
                }
            }
        }
        return local;
    }
}

// 3. Preferred: depend on an abstraction and inject one shared instance.
public final class CheckoutService {
    private final Clock clock;
    public CheckoutService(Clock clock) { this.clock = clock; }
}`,
    },
    followUps: [
      'How do you protect a Singleton against reflection and deserialization creating a second instance?',
      'What happens to a "Singleton" when two class loaders load the same class?',
    ],
  },
  {
    slug: 'undo-redo-editor',
    category: 'Design Patterns',
    title: 'Design undo/redo with macros for a text editor',
    question:
      'Design the undo/redo subsystem of a text editor. Users can undo and redo individual edits, record a macro of several edits that undoes as one step, and any new edit after an undo must discard the redo history.',
    whyItIsHard:
      'It combines Command, Composite and (optionally) Memento, and the candidate has to get the two-stack invariants and the "new edit clears redo" rule exactly right.',
    solution: [
      {
        heading: 'Patterns',
        points: [
          'Command: every edit is an object with execute() and undo(), so history is just a list of commands.',
          'Composite: a MacroCommand holds child commands, executes them in order and undoes them in reverse order.',
          'Memento: for edits that are hard to invert (e.g. a regex replace-all), snapshot the affected state instead of computing an inverse.',
        ],
      },
      {
        heading: 'History invariants',
        points: [
          'Keep an undo stack and a redo stack.',
          'execute(cmd): run it, push onto undo, clear redo.',
          'undo(): pop from undo, call undo(), push onto redo. redo(): the mirror image.',
          'Cap the undo stack (or coalesce consecutive keystrokes) to bound memory.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: Command + Composite history manager',
      code: `interface Command {
  execute(): void;
  undo(): void;
}

class Doc { text = ''; }

class InsertText implements Command {
  constructor(private doc: Doc, private pos: number, private value: string) {}
  execute() {
    const t = this.doc.text;
    this.doc.text = t.slice(0, this.pos) + this.value + t.slice(this.pos);
  }
  undo() {
    const t = this.doc.text;
    this.doc.text = t.slice(0, this.pos) + t.slice(this.pos + this.value.length);
  }
}

class MacroCommand implements Command {
  constructor(private steps: Command[]) {}
  execute() { this.steps.forEach((s) => s.execute()); }
  undo() { [...this.steps].reverse().forEach((s) => s.undo()); }
}

class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  constructor(private limit = 100) {}

  run(cmd: Command) {
    cmd.execute();
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = []; // a new edit invalidates the redo branch
  }
  undo() {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }
  redo() {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
  }
}

const doc = new Doc();
const history = new History();
history.run(new MacroCommand([
  new InsertText(doc, 0, 'Hello'),
  new InsertText(doc, 5, ' world'),
]));
history.undo(); // doc.text === ''
history.redo(); // doc.text === 'Hello world'`,
    },
    followUps: [
      'How would undo work in a collaborative editor where other users edit concurrently (operational transforms / CRDTs)?',
      'How would you coalesce 50 single-character inserts into one undo step?',
    ],
  },
  {
    slug: 'decorator-proxy-adapter',
    category: 'Design Patterns',
    title: 'Decorator vs Proxy vs Adapter — then build a resilient HTTP client',
    question:
      'All three patterns wrap an object. Explain the difference in intent, then add caching, retries with backoff and logging to an existing HTTP client without modifying it and without a subclass explosion.',
    whyItIsHard:
      'The class diagrams look almost identical, so the interviewer is checking whether you reason about intent and composition order rather than structure.',
    solution: [
      {
        heading: 'Intent',
        points: [
          'Adapter changes the interface so an incompatible class fits a client.',
          'Decorator keeps the same interface and adds behaviour; decorators stack.',
          'Proxy keeps the same interface and controls access (lazy loading, remote calls, authorization, caching).',
        ],
      },
      {
        heading: 'Solution',
        points: [
          'Define a small HttpClient interface and implement each concern as a decorator.',
          'Order matters: Logging(Cache(Retry(base))) logs every request once, serves cache hits without retries and only retries real network calls.',
          'Only retry idempotent requests (GET, PUT with idempotency keys) and add jitter to avoid thundering herds.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: stackable decorators',
      code: `interface HttpClient {
  get(url: string): Promise<string>;
}

class FetchClient implements HttpClient {
  async get(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.text();
  }
}

class RetryClient implements HttpClient {
  constructor(private inner: HttpClient, private attempts = 3, private baseMs = 100) {}
  async get(url: string) {
    for (let i = 0; ; i += 1) {
      try {
        return await this.inner.get(url);
      } catch (err) {
        if (i + 1 >= this.attempts) throw err;
        const delay = this.baseMs * 2 ** i * (0.5 + Math.random()); // backoff + jitter
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}

class CacheClient implements HttpClient {
  private cache = new Map<string, { value: string; expires: number }>();
  constructor(private inner: HttpClient, private ttlMs = 60_000) {}
  async get(url: string) {
    const hit = this.cache.get(url);
    if (hit && hit.expires > Date.now()) return hit.value;
    const value = await this.inner.get(url);
    this.cache.set(url, { value, expires: Date.now() + this.ttlMs });
    return value;
  }
}

class LoggingClient implements HttpClient {
  constructor(private inner: HttpClient) {}
  async get(url: string) {
    const start = Date.now();
    try {
      return await this.inner.get(url);
    } finally {
      console.info('GET', url, Date.now() - start, 'ms');
    }
  }
}

const client: HttpClient = new LoggingClient(
  new CacheClient(new RetryClient(new FetchClient())),
);`,
    },
    followUps: [
      'Where would a circuit breaker go in this stack and why?',
      'How do you prevent a cache stampede when many callers miss the same key at once?',
    ],
  },
  {
    slug: 'visitor-expression-problem',
    category: 'Design Patterns',
    title: 'Visitor, double dispatch and the expression problem',
    question:
      'You have an AST of expression nodes. Add new operations (evaluate, pretty-print, type-check) without editing each node class. Explain double dispatch and when Visitor is the wrong choice.',
    whyItIsHard:
      'Visitor is the least intuitive GoF pattern, and a strong answer explains the trade-off it makes: easy to add operations, hard to add node types.',
    solution: [
      {
        heading: 'How it works',
        points: [
          'Each node implements accept(visitor) and calls the visitor method for its own concrete type — that second call is the second dispatch.',
          'Each operation is a separate visitor class, so new operations do not touch node classes.',
        ],
      },
      {
        heading: 'Trade-offs',
        points: [
          'Adding a new node type forces a change to every visitor — the expression problem.',
          'Use Visitor when the type hierarchy is stable and operations change often (compilers, linters).',
          'In languages with sum types and exhaustive pattern matching (TypeScript discriminated unions, Rust enums) a switch is often simpler and the compiler still flags missing cases.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: Visitor over an expression tree',
      code: `interface Visitor<R> {
  num(n: Num): R;
  add(n: Add): R;
  mul(n: Mul): R;
}
interface Expr { accept<R>(v: Visitor<R>): R; }

class Num implements Expr {
  constructor(readonly value: number) {}
  accept<R>(v: Visitor<R>) { return v.num(this); }
}
class Add implements Expr {
  constructor(readonly left: Expr, readonly right: Expr) {}
  accept<R>(v: Visitor<R>) { return v.add(this); }
}
class Mul implements Expr {
  constructor(readonly left: Expr, readonly right: Expr) {}
  accept<R>(v: Visitor<R>) { return v.mul(this); }
}

class Evaluate implements Visitor<number> {
  num(n: Num) { return n.value; }
  add(n: Add): number { return n.left.accept(this) + n.right.accept(this); }
  mul(n: Mul): number { return n.left.accept(this) * n.right.accept(this); }
}

class Print implements Visitor<string> {
  num(n: Num) { return String(n.value); }
  add(n: Add): string { return '(' + n.left.accept(this) + ' + ' + n.right.accept(this) + ')'; }
  mul(n: Mul): string { return n.left.accept(this) + ' * ' + n.right.accept(this); }
}

const expr = new Mul(new Add(new Num(2), new Num(3)), new Num(4));
expr.accept(new Evaluate()); // 20
expr.accept(new Print());    // '(2 + 3) * 4'`,
    },
    followUps: [
      'How would you make the visitor return early or carry context (e.g. a symbol table)?',
      'How does an acyclic visitor reduce coupling when node types change?',
    ],
  },
  {
    slug: 'extensible-payment-providers',
    category: 'Design Patterns',
    title: 'Remove a giant switch: pluggable payment providers',
    question:
      'A checkout service has a 400-line switch on payment type (card, PayPal, bank transfer, crypto). Every new provider means editing and redeploying it. Redesign it so new providers can be added without modifying existing code.',
    whyItIsHard:
      'It tests Strategy, Factory/registry and the Open/Closed Principle together, plus practical concerns like configuration, validation and failure handling.',
    solution: [
      {
        heading: 'Design',
        points: [
          'Strategy: a PaymentProvider interface with supports(method) and charge(request).',
          'Registry (a simple factory): providers register themselves; the service looks one up by method instead of switching.',
          'Template Method or a shared base class can hold common steps (validation, idempotency, audit logging).',
          'Keep provider-specific configuration inside each provider so the service depends only on the abstraction (Dependency Inversion).',
        ],
      },
      {
        heading: 'Robustness',
        points: [
          'Fail fast at startup if two providers claim the same method.',
          'Return a typed result (success, declined, retryable error) rather than throwing for business outcomes.',
          'Pass an idempotency key so a retried charge never bills twice.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: Strategy + registry',
      code: `type Method = 'card' | 'paypal' | 'bank' | 'crypto';

interface ChargeRequest { amountCents: number; currency: string; idempotencyKey: string; }
type ChargeResult =
  | { status: 'ok'; reference: string }
  | { status: 'declined'; reason: string }
  | { status: 'retryable'; reason: string };

interface PaymentProvider {
  readonly method: Method;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}

class ProviderRegistry {
  private providers = new Map<Method, PaymentProvider>();
  register(p: PaymentProvider) {
    if (this.providers.has(p.method)) {
      throw new Error('Duplicate provider for ' + p.method);
    }
    this.providers.set(p.method, p);
    return this;
  }
  get(method: Method) {
    const p = this.providers.get(method);
    if (!p) throw new Error('No provider for ' + method);
    return p;
  }
}

class CardProvider implements PaymentProvider {
  readonly method = 'card' as const;
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    // call the card gateway with req.idempotencyKey ...
    return { status: 'ok', reference: 'card_' + req.idempotencyKey };
  }
}

class CheckoutService {
  constructor(private registry: ProviderRegistry) {}
  pay(method: Method, req: ChargeRequest) {
    return this.registry.get(method).charge(req); // no switch
  }
}

const registry = new ProviderRegistry().register(new CardProvider());
const checkout = new CheckoutService(registry);`,
    },
    followUps: [
      'How would you load providers as runtime plugins without recompiling the service?',
      'How would you route to a fallback provider when the primary returns a retryable error?',
    ],
  },
  {
    slug: 'safe-event-bus',
    category: 'Design Patterns',
    title: 'Build an Observer/event bus without leaks or re-entrancy bugs',
    question:
      'Implement a typed publish/subscribe event bus. It must not leak listeners, must tolerate a listener unsubscribing (or throwing) during dispatch, and must not let one failing listener stop the others.',
    whyItIsHard:
      'Most naive Observer implementations have the lapsed-listener memory leak and mutate the listener list while iterating it; interviewers look for those edge cases.',
    solution: [
      {
        heading: 'Pitfalls to handle',
        points: [
          'Lapsed listener: subscribers that never unsubscribe keep objects alive. Return an unsubscribe function and support AbortSignal for automatic cleanup.',
          'Mutation during dispatch: iterate over a snapshot of listeners so subscribe/unsubscribe inside a handler is safe.',
          'Error isolation: catch each listener error and report it instead of aborting the loop.',
          'Re-entrancy: an event emitted inside a handler can run before the outer dispatch finishes; queue nested events if ordering matters.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: typed, leak-safe event bus',
      code: `type Handler<T> = (payload: T) => void;

class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(
    type: K,
    handler: Handler<Events[K]>,
    options: { signal?: AbortSignal } = {},
  ): () => void {
    const set = this.listeners.get(type) ?? new Set<Handler<never>>();
    this.listeners.set(type, set);
    set.add(handler as Handler<never>);
    const off = () => {
      set.delete(handler as Handler<never>);
      if (set.size === 0) this.listeners.delete(type);
    };
    options.signal?.addEventListener('abort', off, { once: true });
    return off;
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]) {
    const snapshot = [...(this.listeners.get(type) ?? [])]; // safe if handlers unsubscribe
    for (const handler of snapshot) {
      try {
        (handler as Handler<Events[K]>)(payload);
      } catch (err) {
        console.error('listener failed for', String(type), err); // isolate failures
      }
    }
  }
}

const bus = new EventBus<{ orderPlaced: { id: string } }>();
const controller = new AbortController();
bus.on('orderPlaced', (e) => console.log('email', e.id), { signal: controller.signal });
bus.emit('orderPlaced', { id: 'o-1' });
controller.abort(); // listener removed, nothing leaks`,
    },
    followUps: [
      'How would you make delivery asynchronous and guarantee at-least-once delivery across processes?',
      'When would you choose WeakRef-based listeners and what are their pitfalls?',
    ],
  },
  {
    slug: 'order-state-machine',
    category: 'Design Patterns',
    title: 'Model an order lifecycle with the State pattern',
    question:
      'An order moves through Pending → Paid → Shipped → Delivered and can be Cancelled only before shipping. Model it so illegal transitions are impossible and new states can be added safely.',
    whyItIsHard:
      'Candidates often reach for boolean flags or a sprawling switch; the interviewer wants explicit states, guarded transitions and a discussion of persistence and concurrency.',
    solution: [
      {
        heading: 'Design',
        points: [
          'Each state is an object that only exposes the transitions valid from that state; invalid ones throw a domain error.',
          'The Order context delegates to its current state and swaps it on each transition.',
          'Persist only the state name, and rebuild the state object when loading.',
          'Use optimistic locking (a version column) so two concurrent requests cannot both ship and cancel the same order.',
        ],
      },
      {
        heading: 'Alternatives',
        points: [
          'A transition table (from, event) → to is lighter when states carry no behaviour.',
          'Emit a domain event on every transition for auditing and downstream services.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: State pattern with guarded transitions',
      code: `class IllegalTransition extends Error {}

interface OrderState {
  readonly name: string;
  pay(): OrderState;
  ship(): OrderState;
  deliver(): OrderState;
  cancel(): OrderState;
}

abstract class BaseState implements OrderState {
  abstract readonly name: string;
  pay(): OrderState { throw new IllegalTransition('Cannot pay when ' + this.name); }
  ship(): OrderState { throw new IllegalTransition('Cannot ship when ' + this.name); }
  deliver(): OrderState { throw new IllegalTransition('Cannot deliver when ' + this.name); }
  cancel(): OrderState { throw new IllegalTransition('Cannot cancel when ' + this.name); }
}

class Pending extends BaseState {
  readonly name = 'Pending';
  pay() { return new Paid(); }
  cancel() { return new Cancelled(); }
}
class Paid extends BaseState {
  readonly name = 'Paid';
  ship() { return new Shipped(); }
  cancel() { return new Cancelled(); } // triggers a refund elsewhere
}
class Shipped extends BaseState {
  readonly name = 'Shipped';
  deliver() { return new Delivered(); }
}
class Delivered extends BaseState { readonly name = 'Delivered'; }
class Cancelled extends BaseState { readonly name = 'Cancelled'; }

class Order {
  private state: OrderState = new Pending();
  get status() { return this.state.name; }
  pay() { this.state = this.state.pay(); }
  ship() { this.state = this.state.ship(); }
  deliver() { this.state = this.state.deliver(); }
  cancel() { this.state = this.state.cancel(); }
}

const order = new Order();
order.pay();
order.ship();
order.cancel(); // throws IllegalTransition: Cannot cancel when Shipped`,
    },
    followUps: [
      'How would you model a long-running workflow (payment, warehouse, courier) across services — saga or orchestrator?',
      'How do you migrate existing rows when a new intermediate state is introduced?',
    ],
  },
  {
    slug: 'async-middleware-chain',
    category: 'Design Patterns',
    title: 'Implement an async middleware pipeline (Chain of Responsibility)',
    question:
      'Implement an Express/Koa-style middleware pipeline where each middleware can run code before and after the next one, short-circuit the request, or handle errors thrown further down the chain.',
    whyItIsHard:
      'It requires a precise grasp of Chain of Responsibility, recursion/closures and async control flow, including guarding against next() being called twice.',
    solution: [
      {
        heading: 'Design',
        points: [
          'Each middleware receives (ctx, next); calling next() passes control down the chain and awaiting it lets code run on the way back up (the "onion" model).',
          'Not calling next() short-circuits the chain (e.g. auth failure or cache hit).',
          'Wrapping await next() in try/catch lets an outer middleware handle any downstream error.',
          'Track the highest index dispatched so calling next() twice is rejected.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: Koa-style compose',
      code: `type Next = () => Promise<void>;
type Middleware<C> = (ctx: C, next: Next) => Promise<void> | void;

function compose<C>(stack: Middleware<C>[]) {
  return (ctx: C): Promise<void> => {
    let lastIndex = -1;
    const dispatch = async (i: number): Promise<void> => {
      if (i <= lastIndex) throw new Error('next() called multiple times');
      lastIndex = i;
      const fn = stack[i];
      if (!fn) return;
      await fn(ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
  };
}

interface Ctx { path: string; user?: string; status?: number; body?: string; log: string[] }

const app = compose<Ctx>([
  async (ctx, next) => {               // error boundary + timing
    try { await next(); }
    catch { ctx.status = 500; ctx.body = 'Internal error'; }
    ctx.log.push('done ' + ctx.status);
  },
  async (ctx, next) => {               // auth: short-circuits
    if (!ctx.user) { ctx.status = 401; return; }
    await next();
  },
  (ctx) => { ctx.status = 200; ctx.body = 'Hello ' + ctx.user; },
]);

const ctx: Ctx = { path: '/', user: 'ada', log: [] };
await app(ctx); // ctx.body === 'Hello ada', ctx.log === ['done 200']`,
    },
    followUps: [
      'How would you add per-route middleware and route parameters on top of this?',
      'How do you propagate cancellation (client disconnect) through the chain?',
    ],
  },

  // ---------------------------------------------------------------------------
  // System design
  // ---------------------------------------------------------------------------
  {
    slug: 'url-shortener',
    category: 'System Design',
    title: 'Design a URL shortener (TinyURL / bit.ly)',
    question:
      'Design a service that creates short links and redirects them. Assume 100 million new links per day, a 100:1 read-to-write ratio, links that never collide, and click analytics.',
    whyItIsHard:
      'It looks simple, but a strong answer covers collision-free ID generation at scale, a read-heavy caching strategy, 301 vs 302 semantics and keeping analytics off the hot path.',
    solution: [
      {
        heading: 'Requirements and estimates',
        points: [
          'Functional: create short URL (optionally custom alias and expiry), redirect, view click stats.',
          'Writes: 100M/day ≈ 1,200/s; reads ≈ 120,000/s average with higher peaks.',
          'Storage: ~500 bytes/link × 36.5B links over 1 year ≈ 18 TB; 7 base62 characters give 62^7 ≈ 3.5 trillion codes.',
        ],
      },
      {
        heading: 'ID generation',
        points: [
          'Avoid hashing + collision retries. Use a counter and base62-encode it.',
          'To avoid a single counter bottleneck, each app server leases a range of IDs (e.g. 1M at a time) from a coordinator such as ZooKeeper/etcd or a DB sequence.',
          'If codes must not be guessable, run the counter through a reversible permutation (e.g. a Feistel cipher) before encoding.',
        ],
      },
      {
        heading: 'Storage and reads',
        points: [
          'Key-value store (DynamoDB/Cassandra) keyed by code: simple lookups, easy horizontal partitioning.',
          'Cache hot codes in Redis/Memcached and at the CDN edge; popularity follows a power law, so a small cache absorbs most traffic.',
          'Use 302 (or 307) when you need every click counted or links can change; 301 is cached by browsers and cuts load but hides repeat clicks.',
        ],
      },
      {
        heading: 'Analytics',
        points: [
          'Redirect handlers publish click events to Kafka asynchronously; stream processors aggregate into an OLAP store (ClickHouse/Druid).',
          'The redirect never waits on analytics, so analytics outages do not break links.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: range-leased counter + base62 encoding',
      code: `const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function toBase62(n: bigint): string {
  if (n === 0n) return ALPHABET[0];
  let out = '';
  while (n > 0n) {
    out = ALPHABET[Number(n % 62n)] + out;
    n /= 62n;
  }
  return out;
}

// Each server leases a block of IDs so it rarely talks to the coordinator.
class IdAllocator {
  private next = 0n;
  private end = 0n;
  constructor(private leaseRange: (size: bigint) => Promise<bigint>, private size = 1_000_000n) {}

  async nextId(): Promise<bigint> {
    if (this.next >= this.end) {
      const start = await this.leaseRange(this.size); // atomic increment in etcd / DB
      this.next = start;
      this.end = start + this.size;
    }
    const id = this.next;
    this.next += 1n;
    return id;
  }
}

async function shorten(allocator: IdAllocator, url: string, kv: Map<string, string>) {
  const code = toBase62(await allocator.nextId());
  kv.set(code, url); // in production: conditional put into the KV store
  return code;
}`,
    },
    followUps: [
      'How do you support custom aliases without racing the generated codes?',
      'How would you detect and block malicious or phishing destination URLs?',
    ],
  },
  {
    slug: 'distributed-rate-limiter',
    category: 'System Design',
    title: 'Design a distributed rate limiter',
    question:
      'Design a rate limiter for a public API running on hundreds of gateway nodes. Limits are per API key (e.g. 100 requests/second with short bursts), must be enforced globally, and must add minimal latency.',
    whyItIsHard:
      'Candidates must choose an algorithm, make the check atomic across nodes, and reason about failure modes (what happens when the limiter store is down) and hot keys.',
    solution: [
      {
        heading: 'Algorithm choice',
        points: [
          'Fixed window: simplest, but allows 2× bursts at window boundaries.',
          'Sliding window log: exact but stores every timestamp — expensive.',
          'Sliding window counter: weighted blend of current and previous window — cheap and accurate enough.',
          'Token bucket: refills at rate r up to capacity b, so it naturally allows controlled bursts. A good default.',
        ],
      },
      {
        heading: 'Distributed enforcement',
        points: [
          'Store bucket state in Redis keyed by API key; run read-modify-write as a single Lua script so it is atomic.',
          'Use the Redis server clock (TIME) to avoid clock skew between gateways.',
          'Shard Redis by key (Redis Cluster). For extreme hot keys, give each gateway a local token allowance and sync periodically, trading precision for latency.',
        ],
      },
      {
        heading: 'Failure and UX',
        points: [
          'Decide fail-open (availability) vs fail-closed (protection) per endpoint; most public APIs fail open with a local fallback limit.',
          'Return 429 with Retry-After and X-RateLimit-Remaining headers.',
        ],
      },
    ],
    code: {
      label: 'Redis Lua: atomic token bucket',
      code: `-- KEYS[1] = bucket key, ARGV[1] = capacity, ARGV[2] = refill tokens per second
-- Returns {allowed (1/0), remaining tokens}
-- Requires Redis 5+ (effects replication allows TIME before writes).
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local t = redis.call('TIME')
local now = tonumber(t[1]) + tonumber(t[2]) / 1e6

local state = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1]) or capacity
local ts = tonumber(state[2]) or now

tokens = math.min(capacity, tokens + (now - ts) * rate)
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', KEYS[1], math.ceil(capacity / rate) * 2)
return {allowed, math.floor(tokens)}`,
    },
    followUps: [
      'How would you rate limit by multiple dimensions at once (user, IP and endpoint)?',
      'How do you apply limits across multiple regions without a cross-region round trip?',
    ],
  },
  {
    slug: 'news-feed',
    category: 'System Design',
    title: 'Design a social news feed (Twitter / Instagram timeline)',
    question:
      'Design the home timeline for 500M daily users. Users follow others, some accounts have 100M+ followers, and the feed must load in under 200 ms.',
    whyItIsHard:
      'The core trade-off — fan-out on write vs fan-out on read — breaks down for celebrities, so the candidate must arrive at a hybrid and handle ranking, pagination and storage costs.',
    solution: [
      {
        heading: 'Fan-out strategies',
        points: [
          'Fan-out on write (push): when a user posts, insert the post ID into every follower\u2019s precomputed timeline cache. Fast reads, very expensive writes for celebrities.',
          'Fan-out on read (pull): build the timeline at read time by merging recent posts from followees. Cheap writes, slow reads.',
          'Hybrid: push for normal accounts; for accounts above a follower threshold, skip fan-out and merge their recent posts at read time.',
        ],
      },
      {
        heading: 'Data and storage',
        points: [
          'Posts in a sharded store (by post ID); social graph in a store optimised for adjacency lists.',
          'Timeline cache: Redis list/sorted set per user holding only post IDs (cap ~800), hydrated in batch from a post cache.',
          'Only fan out to active users; rebuild inactive users\u2019 timelines lazily on their next login.',
        ],
      },
      {
        heading: 'Read path',
        points: [
          'Fetch cached IDs + celebrity posts, merge, rank (recency or ML scores), hydrate, and return a cursor (last seen score + ID) for stable pagination.',
          'Fan-out runs asynchronously through a queue so posting stays fast.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: hybrid fan-out and read-time merge',
      code: `const CELEBRITY_THRESHOLD = 100_000;

interface Post { id: string; authorId: string; createdAt: number; }

interface Deps {
  followers(userId: string): Promise<string[]>;
  followerCount(userId: string): Promise<number>;
  followeesWhoAreCelebrities(userId: string): Promise<string[]>;
  recentPosts(authorId: string, limit: number): Promise<Post[]>;
  timelinePush(userId: string, post: Post): Promise<void>;     // ZADD + ZREMRANGEBYRANK
  timelineRead(userId: string, limit: number): Promise<Post[]>;
}

// Called asynchronously from a queue consumer after a post is stored.
async function fanOut(deps: Deps, post: Post) {
  if ((await deps.followerCount(post.authorId)) >= CELEBRITY_THRESHOLD) return; // pulled at read time
  for (const follower of await deps.followers(post.authorId)) {
    await deps.timelinePush(follower, post);
  }
}

async function readTimeline(deps: Deps, userId: string, limit = 50): Promise<Post[]> {
  const [cached, celebs] = await Promise.all([
    deps.timelineRead(userId, limit),
    deps.followeesWhoAreCelebrities(userId),
  ]);
  const celebPosts = (await Promise.all(celebs.map((c) => deps.recentPosts(c, limit)))).flat();
  return [...cached, ...celebPosts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}`,
    },
    followUps: [
      'How do you remove a deleted post or a blocked user\u2019s posts from already fanned-out timelines?',
      'How would you introduce ML ranking without blowing the latency budget?',
    ],
  },
  {
    slug: 'chat-system',
    category: 'System Design',
    title: 'Design a chat system (WhatsApp / Slack)',
    question:
      'Design 1:1 and group messaging for 1B users with online presence, delivery/read receipts, offline delivery and per-conversation message ordering.',
    whyItIsHard:
      'It mixes long-lived stateful connections, routing between gateway servers, ordering guarantees and exactly-once-looking delivery over unreliable mobile networks.',
    solution: [
      {
        heading: 'Connections and routing',
        points: [
          'Clients hold a WebSocket (or MQTT) connection to a stateless-ish gateway; a session registry (Redis) maps userId → gateway.',
          'Gateways forward messages through a message service; delivery to the recipient\u2019s gateway goes via pub/sub or direct RPC.',
          'Heartbeats detect dead connections; presence is updated with a TTL and fanned out only to contacts who are online and interested.',
        ],
      },
      {
        heading: 'Ordering and delivery',
        points: [
          'Assign a monotonically increasing sequence number per conversation (from the conversation\u2019s partition owner) — global ordering is unnecessary.',
          'Clients send a client-generated message ID; the server deduplicates on it so retries are idempotent.',
          'Persist before acknowledging: sent ✓ when stored, delivered ✓✓ when the recipient device acks, read when it reports the last read sequence.',
          'Offline users sync on reconnect by asking for messages after their last acknowledged sequence number.',
        ],
      },
      {
        heading: 'Storage and groups',
        points: [
          'Wide-column store (Cassandra/ScyllaDB) partitioned by conversation ID, clustered by sequence — efficient range reads for history.',
          'Small groups: fan out per member. Very large channels: store once and let members pull, like the news-feed hybrid.',
          'End-to-end encryption (Signal protocol) means the server stores only ciphertext and per-device fan-out is required.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: idempotent send with per-conversation sequencing',
      code: `interface Message {
  conversationId: string;
  clientMsgId: string; // generated on device, reused on retry
  senderId: string;
  body: string;
  seq?: number;
}

class ConversationLog {
  private seqByConv = new Map<string, number>();
  private byClientId = new Map<string, Message>();
  private messages = new Map<string, Message[]>();

  append(msg: Message): Message {
    const dedupeKey = msg.conversationId + ':' + msg.clientMsgId;
    const existing = this.byClientId.get(dedupeKey);
    if (existing) return existing; // retry: return the original ack

    const seq = (this.seqByConv.get(msg.conversationId) ?? 0) + 1;
    this.seqByConv.set(msg.conversationId, seq);
    const stored = { ...msg, seq };
    this.byClientId.set(dedupeKey, stored);
    const list = this.messages.get(msg.conversationId) ?? [];
    list.push(stored);
    this.messages.set(msg.conversationId, list);
    return stored; // ack to sender = "sent"
  }

  // Reconnecting clients sync everything after their last acked sequence.
  since(conversationId: string, afterSeq: number): Message[] {
    return (this.messages.get(conversationId) ?? []).filter((m) => m.seq! > afterSeq);
  }
}`,
    },
    followUps: [
      'How do you handle a user logged in on phone, tablet and web at the same time?',
      'How would you scale typing indicators without overwhelming the gateways?',
    ],
  },
  {
    slug: 'distributed-key-value-store',
    category: 'System Design',
    title: 'Design a distributed key-value store (Dynamo-style)',
    question:
      'Design a highly available key-value store that scales horizontally, survives node and datacenter failures, and lets clients tune consistency per request.',
    whyItIsHard:
      'It is essentially a distributed-systems exam: partitioning, replication, quorums, conflict resolution, failure detection and anti-entropy all have to fit together.',
    solution: [
      {
        heading: 'Partitioning and replication',
        points: [
          'Consistent hashing with virtual nodes spreads keys evenly and moves only ~1/N of keys when a node joins or leaves.',
          'Replicate each key to the next N distinct physical nodes on the ring (its preference list), spread across racks/AZs.',
        ],
      },
      {
        heading: 'Consistency',
        points: [
          'Quorums: with N replicas, write to W and read from R. R + W > N gives read-your-writes for a key under normal operation; e.g. N=3, W=2, R=2.',
          'Lower W or R for latency/availability (AP), raise them for stronger consistency.',
          'Conflicts: last-write-wins is simple but loses data; vector clocks detect concurrent versions so the client or a CRDT can merge them.',
        ],
      },
      {
        heading: 'Failure handling',
        points: [
          'Sloppy quorum + hinted handoff: if a replica is down, write to the next healthy node with a hint and replay it later.',
          'Read repair fixes stale replicas on read; Merkle trees let replicas compare and sync ranges cheaply in the background.',
          'Gossip protocol spreads membership and failure-detection information without a single coordinator.',
        ],
      },
      {
        heading: 'Storage engine',
        points: [
          'An LSM tree (write-ahead log + memtable + SSTables + compaction) gives fast writes; Bloom filters avoid unnecessary disk reads.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: consistent-hash ring with virtual nodes and a preference list',
      code: `import { createHash } from 'node:crypto';

function hash(key: string): number {
  return createHash('md5').update(key).digest().readUInt32BE(0);
}

class HashRing {
  private ring: { point: number; node: string }[] = [];
  constructor(private vnodes = 128) {}

  add(node: string) {
    for (let i = 0; i < this.vnodes; i += 1) {
      this.ring.push({ point: hash(node + '#' + i), node });
    }
    this.ring.sort((a, b) => a.point - b.point);
  }

  remove(node: string) {
    this.ring = this.ring.filter((v) => v.node !== node);
  }

  /** The first n distinct physical nodes clockwise from the key. */
  preferenceList(key: string, n = 3): string[] {
    if (this.ring.length === 0) return [];
    const h = hash(key);
    let lo = 0;
    let hi = this.ring.length;
    while (lo < hi) {               // binary search for first point >= h
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].point < h) lo = mid + 1; else hi = mid;
    }
    const result: string[] = [];
    for (let i = 0; i < this.ring.length && result.length < n; i += 1) {
      const { node } = this.ring[(lo + i) % this.ring.length];
      if (!result.includes(node)) result.push(node);
    }
    return result;
  }
}

const ring = new HashRing();
['a', 'b', 'c', 'd'].forEach((n) => ring.add(n));
ring.preferenceList('user:42'); // e.g. ['c', 'a', 'd']`,
    },
    followUps: [
      'How do you add a node with no downtime and limited rebalancing bandwidth?',
      'How would you offer linearizable reads for a subset of keys (e.g. via Raft per partition)?',
    ],
  },
  {
    slug: 'payment-system',
    category: 'System Design',
    title: 'Design a payment system that never double-charges',
    question:
      'Design the payment backend for an e-commerce platform. It calls external payment service providers (PSPs), must never charge a customer twice, must never lose money, and must reconcile with the PSP daily.',
    whyItIsHard:
      'Exactly-once effects over unreliable networks are impossible in general, so the candidate must combine idempotency, a durable state machine, a ledger and reconciliation.',
    solution: [
      {
        heading: 'Idempotency',
        points: [
          'Clients send an idempotency key per payment attempt. The server stores (key → status, response) with a unique constraint and returns the stored response on retries.',
          'Pass the same idempotency key to the PSP so its side is also deduplicated.',
        ],
      },
      {
        heading: 'Durable workflow',
        points: [
          'Persist the payment as a state machine (CREATED → PENDING → SUCCEEDED/FAILED) before calling the PSP.',
          'On timeout, do not assume failure — mark UNKNOWN and query the PSP or wait for its webhook.',
          'Transactional outbox: write the state change and the outgoing event in the same DB transaction; a relay publishes events, avoiding dual-write inconsistencies.',
        ],
      },
      {
        heading: 'Money correctness',
        points: [
          'Double-entry ledger: every movement is an immutable pair of debit and credit entries that sum to zero; balances are derived, never updated in place.',
          'Store amounts as integer minor units with a currency code, never floating point.',
          'Nightly reconciliation compares the ledger with PSP settlement files and raises discrepancies for review.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: idempotency key handling (SQL-backed)',
      code: `interface Db {
  // INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING *
  insertIfAbsent(key: string, requestHash: string): Promise<boolean>;
  find(key: string): Promise<{ requestHash: string; status: string; response?: unknown } | null>;
  complete(key: string, status: 'SUCCEEDED' | 'FAILED', response: unknown): Promise<void>;
}

async function charge(
  db: Db,
  psp: { charge(key: string, amountCents: number): Promise<unknown> },
  key: string,
  amountCents: number,
) {
  const requestHash = String(amountCents); // hash the full request body in practice
  const created = await db.insertIfAbsent(key, requestHash);

  if (!created) {
    const existing = await db.find(key);
    if (!existing || existing.requestHash !== requestHash) {
      throw new Error('Idempotency key reused with a different request');
    }
    if (existing.status === 'PENDING') {
      throw new Error('Payment in progress, retry later'); // 409
    }
    return existing.response; // replay the original result
  }

  try {
    const response = await psp.charge(key, amountCents); // same key sent to PSP
    await db.complete(key, 'SUCCEEDED', response);
    return response;
  } catch (err) {
    // Network timeouts stay PENDING and are resolved by polling the PSP / webhook.
    if (err instanceof Error && err.name === 'CardDeclined') {
      await db.complete(key, 'FAILED', { error: err.message });
    }
    throw err;
  }
}`,
    },
    followUps: [
      'How do you design refunds and partial captures on the same ledger?',
      'How would you shard the ledger while keeping a transfer between two accounts atomic?',
    ],
  },
  {
    slug: 'web-crawler',
    category: 'System Design',
    title: 'Design a web-scale crawler',
    question:
      'Design a crawler that fetches 1 billion pages per month, respects robots.txt and per-host politeness, avoids duplicate content, and prioritises important or frequently changing pages.',
    whyItIsHard:
      'The URL frontier must balance priority and politeness simultaneously, and deduplication at billions of URLs needs probabilistic data structures.',
    solution: [
      {
        heading: 'Scale',
        points: [
          '1B pages/month ≈ 400 pages/s on average; at ~100 KB/page that is ~100 TB/month of raw content.',
        ],
      },
      {
        heading: 'URL frontier',
        points: [
          'Front queues by priority (PageRank, change frequency, freshness); a selector biases toward higher-priority queues.',
          'Back queues: one FIFO per host, with a heap ordered by the next time each host may be fetched — this enforces politeness.',
          'Partition the frontier by host hash across crawler nodes so each host is owned by one worker.',
        ],
      },
      {
        heading: 'Fetching and dedup',
        points: [
          'Cache DNS and robots.txt per host; honour crawl-delay.',
          'URL dedup: normalise URLs, then check a Bloom filter (small false-positive rate means rarely skipping a new URL).',
          'Content dedup: exact via content hash; near-duplicate via SimHash.',
          'Defend against spider traps with max depth, URL-length limits and per-host page budgets.',
        ],
      },
      {
        heading: 'Pipeline',
        points: [
          'Fetcher → parser/link extractor → dedup → frontier, connected by queues; raw pages go to blob storage for indexing.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: per-host politeness scheduler',
      code: `class PoliteFrontier {
  private queues = new Map<string, string[]>();
  private nextAllowed = new Map<string, number>();
  private seen = new Set<string>(); // a Bloom filter at real scale

  constructor(private delayMs = 1000) {}

  add(rawUrl: string) {
    const url = new URL(rawUrl);
    url.hash = '';
    const key = url.toString();
    if (this.seen.has(key)) return;
    this.seen.add(key);
    const q = this.queues.get(url.host) ?? [];
    q.push(key);
    this.queues.set(url.host, q);
  }

  /** Returns a URL whose host may be fetched now, or null. */
  next(now = Date.now()): string | null {
    let bestHost: string | null = null;
    let bestTime = Infinity;
    for (const [host, q] of this.queues) {   // a min-heap in production
      const t = this.nextAllowed.get(host) ?? 0;
      if (q.length > 0 && t <= now && t < bestTime) {
        bestHost = host;
        bestTime = t;
      }
    }
    if (bestHost === null) return null;
    this.nextAllowed.set(bestHost, now + this.delayMs);
    return this.queues.get(bestHost)!.shift()!;
  }
}`,
    },
    followUps: [
      'How do you decide when to recrawl a page?',
      'How would you crawl JavaScript-heavy pages that need rendering?',
    ],
  },
  {
    slug: 'ride-sharing-matching',
    category: 'System Design',
    title: 'Design ride-hailing driver matching (Uber / Lyft)',
    question:
      'Design the system that tracks millions of drivers\u2019 live locations (updated every 4 seconds) and matches a rider to the best nearby driver within a couple of seconds.',
    whyItIsHard:
      'It is extremely write-heavy, needs fast spatial queries, and matching must avoid assigning the same driver to two riders.',
    solution: [
      {
        heading: 'Location ingestion',
        points: [
          '5M active drivers / 4 s ≈ 1.25M location updates per second — keep them in memory, not in a relational DB.',
          'Index drivers by geospatial cell (geohash, S2 or H3). Store cell → set of driver IDs in sharded Redis, and driver → last location with a TTL.',
          'Persist location history asynchronously via Kafka for trip reconstruction and analytics.',
        ],
      },
      {
        heading: 'Matching',
        points: [
          'Look up the rider\u2019s cell plus neighbouring rings until enough candidates are found.',
          'Rank by estimated time of arrival from a routing service, not straight-line distance.',
          'Offer the trip to one driver at a time (or a small batch) and lock the driver with an atomic compare-and-set so they cannot receive two offers.',
        ],
      },
      {
        heading: 'Scaling',
        points: [
          'Partition by city/region; matching is local, so regions scale independently.',
          'Supply/demand per cell drives surge pricing, computed in a stream processor.',
        ],
      },
    ],
    code: {
      label: 'TypeScript: grid index with neighbour search and atomic reservation',
      code: `const CELL_DEG = 0.01; // ~1 km cells; use H3/S2 in production

const cellOf = (lat: number, lng: number) =>
  Math.floor(lat / CELL_DEG) + ':' + Math.floor(lng / CELL_DEG);

class DriverIndex {
  private cells = new Map<string, Set<string>>();
  private where = new Map<string, { lat: number; lng: number; cell: string }>();
  private reserved = new Set<string>();

  update(driverId: string, lat: number, lng: number) {
    const cell = cellOf(lat, lng);
    const prev = this.where.get(driverId);
    if (prev && prev.cell !== cell) this.cells.get(prev.cell)?.delete(driverId);
    if (!this.cells.has(cell)) this.cells.set(cell, new Set());
    this.cells.get(cell)!.add(driverId);
    this.where.set(driverId, { lat, lng, cell });
  }

  nearby(lat: number, lng: number, wanted = 5, maxRing = 5): string[] {
    const cy = Math.floor(lat / CELL_DEG);
    const cx = Math.floor(lng / CELL_DEG);
    const found: string[] = [];
    for (let r = 0; r <= maxRing && found.length < wanted; r += 1) {
      for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; // ring edge only
          for (const id of this.cells.get(cy + dy + ':' + (cx + dx)) ?? []) {
            if (!this.reserved.has(id)) found.push(id);
          }
        }
      }
    }
    return found; // then rank by ETA from the routing service
  }

  /** Compare-and-set; in Redis use SET driver:lock NX PX 15000. */
  reserve(driverId: string): boolean {
    if (this.reserved.has(driverId)) return false;
    this.reserved.add(driverId);
    return true;
  }
}`,
    },
    followUps: [
      'How would you batch-match many riders and drivers at once to optimise global wait time?',
      'What happens to in-flight matches when a regional data centre fails?',
    ],
  },
];
