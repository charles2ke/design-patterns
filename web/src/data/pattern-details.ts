import type { PatternDetail } from '../types/pattern-detail';

/**
 * Deep-dive content for every pattern in `data/patterns.ts`, keyed by slug and
 * rendered by the pattern detail page.
 */
export const patternDetails: PatternDetail[] = [
  {
    slug: 'singleton',
    realWorld:
      'A process-wide configuration registry or connection pool that every request reads from.',
    whenNotToUse:
      'The instance holds mutable request-scoped state, or tests need to swap the implementation.',
    participants: [
      { name: 'Singleton', role: 'Owns the single instance and its accessor.' },
      { name: 'Client', role: 'Requests the shared instance instead of constructing one.' },
    ],
    pros: [
      'Guarantees one instance and one initialization cost.',
      'Gives a well-known access point for shared resources.',
    ],
    cons: [
      'Acts as global state and hides dependencies from callers.',
      'Makes isolated testing and parallelism harder.',
    ],
    pitfalls: [
      'Non thread-safe lazy initialization returning two instances under load.',
      'Using the singleton as a dumping ground for unrelated state.',
    ],
    related: ['abstract-factory', 'facade', 'flyweight'],
  },
  {
    slug: 'factory-method',
    realWorld:
      'A cross-platform dialog that creates the button widget matching the host operating system.',
    whenNotToUse:
      'Only one concrete product will ever exist; a plain constructor is clearer.',
    participants: [
      { name: 'Creator', role: 'Declares the factory method and uses the product.' },
      { name: 'ConcreteCreator', role: 'Overrides the factory method to pick a product.' },
      { name: 'Product', role: 'Interface the creator programs against.' },
    ],
    pros: [
      'Removes concrete class names from client code.',
      'Adding a product variant means adding a subclass, not editing callers.',
    ],
    cons: [
      'Introduces a parallel hierarchy of creators.',
      'Indirection can obscure which object is actually built.',
    ],
    pitfalls: [
      'Letting the factory method grow a conditional over every product type.',
      'Returning concrete types instead of the product interface.',
    ],
    related: ['abstract-factory', 'prototype', 'template-method'],
  },
  {
    slug: 'abstract-factory',
    realWorld:
      'A UI toolkit that produces a matching set of light-theme or dark-theme controls.',
    whenNotToUse:
      'Products are independent of each other, so enforcing a family adds ceremony.',
    participants: [
      { name: 'AbstractFactory', role: 'Declares creation methods for each product.' },
      { name: 'ConcreteFactory', role: 'Creates one compatible product family.' },
      { name: 'AbstractProduct', role: 'Interface shared by variants of a product.' },
    ],
    pros: [
      'Guarantees products used together stay compatible.',
      'Swapping a whole family is a single factory change.',
    ],
    cons: [
      'Adding a new product type touches every factory.',
      'More interfaces to navigate for a simple change.',
    ],
    pitfalls: [
      'Mixing products from two factories and breaking the family invariant.',
      'Modelling a family when only one product actually varies.',
    ],
    related: ['factory-method', 'singleton', 'prototype'],
  },
  {
    slug: 'builder',
    realWorld:
      'A query or HTTP request builder where most options are optional and order matters.',
    whenNotToUse:
      'The object has few fields, or named/keyword arguments already read well.',
    participants: [
      { name: 'Builder', role: 'Declares the construction steps.' },
      { name: 'ConcreteBuilder', role: 'Assembles parts and exposes the result.' },
      { name: 'Director', role: 'Optionally runs steps in a known recipe.' },
    ],
    pros: [
      'Avoids telescoping constructors and boolean parameter soup.',
      'Allows the same steps to build different representations.',
    ],
    cons: [
      'More code than a constructor for simple objects.',
      'Partially built objects can escape if the builder is shared.',
    ],
    pitfalls: [
      'Forgetting to validate required fields in `build()`.',
      'Reusing one mutable builder across threads or requests.',
    ],
    related: ['abstract-factory', 'composite', 'prototype'],
  },
  {
    slug: 'prototype',
    realWorld:
      'Duplicating a configured document or game entity instead of re-running expensive setup.',
    whenNotToUse:
      'Objects are cheap to construct, or deep copies of shared references are risky.',
    participants: [
      { name: 'Prototype', role: 'Declares the clone operation.' },
      { name: 'ConcretePrototype', role: 'Implements copying of its own state.' },
      { name: 'Client', role: 'Clones a prototype instead of calling a constructor.' },
    ],
    pros: [
      'Skips costly initialization for similar objects.',
      'Lets the set of available objects be configured at runtime.',
    ],
    cons: [
      'Deep versus shallow copy decisions are easy to get wrong.',
      'Cyclic object graphs complicate cloning.',
    ],
    pitfalls: [
      'Shallow copies sharing mutable collections between clones.',
      'Clones that skip identity fields and collide on persistence.',
    ],
    related: ['factory-method', 'memento', 'composite'],
  },
  {
    slug: 'adapter',
    realWorld:
      'Wrapping a legacy payment SDK so the checkout service can use its own interface.',
    whenNotToUse:
      'You own both sides and can simply change the interface instead of wrapping it.',
    participants: [
      { name: 'Target', role: 'Interface the client expects.' },
      { name: 'Adaptee', role: 'Existing type with an incompatible interface.' },
      { name: 'Adapter', role: 'Translates target calls into adaptee calls.' },
    ],
    pros: [
      'Integrates third-party or legacy code without modifying it.',
      'Keeps translation logic in one reviewable place.',
    ],
    cons: [
      'Adds an extra hop and another type to maintain.',
      'Leaky adapters end up exposing adaptee concepts anyway.',
    ],
    pitfalls: [
      'Adapters that quietly swallow or mistranslate adaptee errors.',
      'Growing an adapter into a second business-logic layer.',
    ],
    related: ['bridge', 'decorator', 'facade'],
  },
  {
    slug: 'bridge',
    realWorld:
      'Notification types (alert, reminder) rendered over interchangeable channels (email, SMS, push).',
    whenNotToUse:
      'Only one implementation exists and no second dimension is expected.',
    participants: [
      { name: 'Abstraction', role: 'Defines the high-level interface and holds an implementor.' },
      { name: 'RefinedAbstraction', role: 'Extends the abstraction dimension.' },
      { name: 'Implementor', role: 'Interface for platform-specific work.' },
    ],
    pros: [
      'Both dimensions evolve without a class explosion.',
      'Implementations can be swapped at runtime.',
    ],
    cons: [
      'Extra indirection for small hierarchies.',
      'The split between the two dimensions must be chosen up front.',
    ],
    pitfalls: [
      'Leaking implementor details through the abstraction API.',
      'Confusing it with Adapter: Bridge is designed up front, Adapter retrofits.',
    ],
    related: ['adapter', 'abstract-factory', 'strategy'],
  },
  {
    slug: 'composite',
    realWorld:
      'A file system or UI tree where folders and files answer the same `size()` call.',
    whenNotToUse:
      'Leaves and containers genuinely need different APIs, so a uniform interface lies.',
    participants: [
      { name: 'Component', role: 'Common interface for leaves and composites.' },
      { name: 'Leaf', role: 'Terminal node that does the real work.' },
      { name: 'Composite', role: 'Holds children and forwards operations.' },
    ],
    pros: [
      'Clients treat single objects and trees uniformly.',
      'New node types plug in without touching traversal code.',
    ],
    cons: [
      'The shared interface can become overly general.',
      'Type safety suffers when leaves must reject child operations.',
    ],
    pitfalls: [
      'Unbounded recursion on cyclic trees.',
      'Expensive aggregate operations recomputed on every call.',
    ],
    related: ['decorator', 'iterator', 'visitor'],
  },
  {
    slug: 'decorator',
    realWorld:
      'Layering compression, retries, and caching around a data stream or HTTP client.',
    whenNotToUse:
      'Behavior combinations are fixed and few; composition adds needless layers.',
    participants: [
      { name: 'Component', role: 'Interface shared by the core and its wrappers.' },
      { name: 'ConcreteComponent', role: 'The base behavior being wrapped.' },
      { name: 'Decorator', role: 'Wraps a component and adds behavior.' },
    ],
    pros: [
      'Adds responsibilities at runtime without subclass explosion.',
      'Each concern stays small and independently testable.',
    ],
    cons: [
      'Deep stacks are hard to debug and read in stack traces.',
      'Object identity and equality checks break through wrappers.',
    ],
    pitfalls: [
      'Order-dependent decorators applied in the wrong sequence.',
      'Decorators that forget to delegate a method on the interface.',
    ],
    related: ['composite', 'proxy', 'chain-of-responsibility'],
  },
  {
    slug: 'facade',
    realWorld:
      'A single `checkout()` call that hides inventory, payment, and shipping subsystems.',
    whenNotToUse:
      'The subsystem is already small, or clients legitimately need its full power.',
    participants: [
      { name: 'Facade', role: 'Offers a narrow, task-oriented API.' },
      { name: 'Subsystem classes', role: 'Do the real work, unaware of the facade.' },
      { name: 'Client', role: 'Talks to the facade instead of the subsystem.' },
    ],
    pros: [
      'Shrinks the surface clients must learn.',
      'Decouples callers from subsystem refactors.',
    ],
    cons: [
      'Can grow into a god object if every use case is added.',
      'Hides capabilities advanced callers need.',
    ],
    pitfalls: [
      'Putting business rules in the facade instead of the subsystem.',
      'Bypassing the facade in a few places, so invariants drift.',
    ],
    related: ['adapter', 'mediator', 'singleton'],
  },
  {
    slug: 'flyweight',
    realWorld:
      'Sharing glyph or map-tile objects so a million rendered items reuse a few hundred instances.',
    whenNotToUse:
      'Object counts are modest, or most state is unique per instance.',
    participants: [
      { name: 'Flyweight', role: 'Holds shareable intrinsic state.' },
      { name: 'FlyweightFactory', role: 'Caches and returns shared instances.' },
      { name: 'Client', role: 'Supplies the extrinsic state per call.' },
    ],
    pros: [
      'Large memory savings for many similar objects.',
      'Shared instances improve cache locality.',
    ],
    cons: [
      'Splitting intrinsic and extrinsic state complicates the API.',
      'Trades memory for extra CPU on every lookup.',
    ],
    pitfalls: [
      'Mutating a shared flyweight and corrupting every user of it.',
      'An unbounded factory cache that becomes the memory leak.',
    ],
    related: ['singleton', 'composite', 'proxy'],
  },
  {
    slug: 'proxy',
    realWorld:
      'A lazy-loading or access-checking stand-in for an expensive remote service.',
    whenNotToUse:
      'No access control, caching, or laziness is needed; the proxy is then pure overhead.',
    participants: [
      { name: 'Subject', role: 'Interface shared by the proxy and real object.' },
      { name: 'RealSubject', role: 'The object whose access is controlled.' },
      { name: 'Proxy', role: 'Intercepts calls before delegating.' },
    ],
    pros: [
      'Adds control (lazy loading, caching, auth) transparently.',
      'The real subject stays free of cross-cutting concerns.',
    ],
    cons: [
      'Another indirection layer and possible latency surprise.',
      'Transparency hides that a call may hit the network.',
    ],
    pitfalls: [
      'Caching proxies that never invalidate stale data.',
      'Lazy proxies triggering expensive loads inside loops.',
    ],
    related: ['decorator', 'adapter', 'facade'],
  },
  {
    slug: 'chain-of-responsibility',
    realWorld:
      'HTTP middleware where auth, rate limiting, and logging each decide whether to continue.',
    whenNotToUse:
      'Exactly one handler always applies and can be selected directly.',
    participants: [
      { name: 'Handler', role: 'Declares handling and holds the next link.' },
      { name: 'ConcreteHandler', role: 'Handles or forwards the request.' },
      { name: 'Client', role: 'Sends the request to the head of the chain.' },
    ],
    pros: [
      'Sender and receiver stay decoupled.',
      'Chain order and membership are configurable at runtime.',
    ],
    cons: [
      'A request can fall off the end unhandled.',
      'Debugging means tracing every link.',
    ],
    pitfalls: [
      'Handlers that forget to call the next link.',
      'Hidden ordering dependencies between handlers.',
    ],
    related: ['command', 'decorator', 'mediator'],
  },
  {
    slug: 'command',
    realWorld:
      'Editor actions captured as objects so they can be queued, logged, and undone.',
    whenNotToUse:
      'A direct method call suffices and no undo, queueing, or auditing is required.',
    participants: [
      { name: 'Command', role: 'Declares execute (and often undo).' },
      { name: 'ConcreteCommand', role: 'Binds a receiver to an action.' },
      { name: 'Invoker', role: 'Triggers commands without knowing their details.' },
    ],
    pros: [
      'Enables undo/redo, queues, retries, and audit logs.',
      'Decouples the trigger from the work.',
    ],
    cons: [
      'A class per action inflates the codebase.',
      'Undo state can be large or hard to capture.',
    ],
    pitfalls: [
      'Commands that capture mutable references and undo the wrong state.',
      'Mixing business logic into the invoker.',
    ],
    related: ['memento', 'chain-of-responsibility', 'strategy'],
  },
  {
    slug: 'interpreter',
    realWorld:
      'Evaluating a small filter or pricing-rule expression language defined by your product.',
    whenNotToUse:
      'The grammar is large or performance sensitive; use a real parser or compiler.',
    participants: [
      { name: 'AbstractExpression', role: 'Declares interpret over a context.' },
      { name: 'TerminalExpression', role: 'Interprets literals and variables.' },
      { name: 'NonterminalExpression', role: 'Composes sub-expressions.' },
    ],
    pros: [
      'Grammar rules map directly onto classes.',
      'New rules are added without touching existing ones.',
    ],
    cons: [
      'Class count grows with grammar size.',
      'Tree walking is slow compared with compiled approaches.',
    ],
    pitfalls: [
      'Accepting untrusted expressions without limits, enabling denial of service.',
      'Letting the "small" language grow until it needs a real compiler.',
    ],
    related: ['composite', 'visitor', 'iterator'],
  },
  {
    slug: 'iterator',
    realWorld:
      'Paginating an API result set behind a cursor that hides the underlying storage.',
    whenNotToUse:
      'The language already provides idiomatic iteration over your collection.',
    participants: [
      { name: 'Iterator', role: 'Defines traversal operations.' },
      { name: 'ConcreteIterator', role: 'Tracks position in the aggregate.' },
      { name: 'Aggregate', role: 'Creates iterators over its elements.' },
    ],
    pros: [
      'Traversal is uniform across different collections.',
      'Multiple independent traversals can run at once.',
    ],
    cons: [
      'Extra objects for simple, indexable collections.',
      'Lazy iterators can hide expensive per-step work.',
    ],
    pitfalls: [
      'Mutating the collection while iterating it.',
      'Leaking resources when an iterator is abandoned early.',
    ],
    related: ['composite', 'visitor', 'mediator'],
  },
  {
    slug: 'mediator',
    realWorld:
      'A form controller that coordinates fields so widgets never reference each other.',
    whenNotToUse:
      'Only a couple of objects interact; direct calls are simpler and clearer.',
    participants: [
      { name: 'Mediator', role: 'Declares how colleagues communicate.' },
      { name: 'ConcreteMediator', role: 'Coordinates and knows the colleagues.' },
      { name: 'Colleague', role: 'Talks to the mediator instead of peers.' },
    ],
    pros: [
      'Turns many-to-many coupling into one-to-many.',
      'Interaction rules live in one place.',
    ],
    cons: [
      'The mediator can become a bloated god object.',
      'It becomes a single point of failure for the interaction.',
    ],
    pitfalls: [
      'Notification loops between mediator and colleagues.',
      'Colleagues keeping back-channel references to each other.',
    ],
    related: ['observer', 'facade', 'chain-of-responsibility'],
  },
  {
    slug: 'memento',
    realWorld:
      'Snapshotting editor or wizard state so a user can step back without exposing internals.',
    whenNotToUse:
      'State is large or cheap to recompute, or an event log already gives you history.',
    participants: [
      { name: 'Originator', role: 'Creates and restores mementos of its state.' },
      { name: 'Memento', role: 'Opaque snapshot of that state.' },
      { name: 'Caretaker', role: 'Stores mementos without inspecting them.' },
    ],
    pros: [
      'Undo and rollback without breaking encapsulation.',
      'The caretaker stays ignorant of the stored structure.',
    ],
    cons: [
      'Snapshots can be expensive in memory.',
      'Frequent snapshots slow down hot paths.',
    ],
    pitfalls: [
      'Storing references instead of copies, so the snapshot mutates.',
      'Unbounded undo history growing without limit.',
    ],
    related: ['command', 'prototype', 'state'],
  },
  {
    slug: 'observer',
    realWorld:
      'UI components re-rendering when a store publishes a state change.',
    whenNotToUse:
      'A single, known consumer exists; a direct call is easier to follow.',
    participants: [
      { name: 'Subject', role: 'Tracks observers and publishes changes.' },
      { name: 'Observer', role: 'Reacts to notifications.' },
      { name: 'ConcreteObserver', role: 'Keeps its state in sync with the subject.' },
    ],
    pros: [
      'Publishers and subscribers stay loosely coupled.',
      'Subscribers can be added and removed at runtime.',
    ],
    cons: [
      'Notification order is usually unspecified.',
      'Control flow becomes hard to trace.',
    ],
    pitfalls: [
      'Forgetting to unsubscribe, which leaks memory.',
      'Cascading or re-entrant notifications causing update storms.',
    ],
    related: ['mediator', 'state', 'command'],
  },
  {
    slug: 'state',
    realWorld:
      'An order moving through draft, paid, shipped, and cancelled with different allowed actions.',
    whenNotToUse:
      'There are only two states and a boolean flag reads perfectly well.',
    participants: [
      { name: 'Context', role: 'Delegates behavior to its current state.' },
      { name: 'State', role: 'Declares behavior for one state.' },
      { name: 'ConcreteState', role: 'Implements behavior and transitions.' },
    ],
    pros: [
      'Replaces sprawling conditionals with focused classes.',
      'Transitions become explicit and testable.',
    ],
    cons: [
      'More classes than a simple enum switch.',
      'Transition logic can be scattered across states.',
    ],
    pitfalls: [
      'States that mutate context fields other states depend on.',
      'Missing transitions that silently leave the object stuck.',
    ],
    related: ['strategy', 'observer', 'memento'],
  },
  {
    slug: 'strategy',
    realWorld:
      'Swapping pricing rules (standard, promotional, enterprise) at checkout time.',
    whenNotToUse:
      'Only one algorithm exists, or the choice never varies at runtime.',
    participants: [
      { name: 'Strategy', role: 'Common interface for the algorithms.' },
      { name: 'ConcreteStrategy', role: 'Implements one algorithm.' },
      { name: 'Context', role: 'Holds and invokes the selected strategy.' },
    ],
    pros: [
      'Algorithms become interchangeable and independently testable.',
      'Removes large conditionals from the context.',
    ],
    cons: [
      'Callers must know which strategy to pick.',
      'Extra objects for trivial variations.',
    ],
    pitfalls: [
      'Strategies that quietly depend on context internals.',
      'Selection logic re-growing into the conditional you removed.',
    ],
    related: ['state', 'template-method', 'bridge'],
  },
  {
    slug: 'template-method',
    realWorld:
      'An import pipeline where parse, validate, and persist are fixed but each step varies by format.',
    whenNotToUse:
      'Variants differ so much that the fixed skeleton forces awkward hooks.',
    participants: [
      { name: 'AbstractClass', role: 'Defines the algorithm skeleton and hooks.' },
      { name: 'ConcreteClass', role: 'Implements the varying steps.' },
    ],
    pros: [
      'Removes duplicated workflow code across variants.',
      'The overall algorithm stays in one readable place.',
    ],
    cons: [
      'Inheritance couples subclasses to the base class.',
      'Changing the skeleton affects every subclass.',
    ],
    pitfalls: [
      'Subclasses overriding the template method itself.',
      'Base classes accumulating optional hooks nobody implements.',
    ],
    related: ['strategy', 'factory-method', 'builder'],
  },
  {
    slug: 'visitor',
    realWorld:
      'Running type checking, pretty printing, and metrics over a stable syntax tree.',
    whenNotToUse:
      'New node types are added often; every visitor then needs updating.',
    participants: [
      { name: 'Visitor', role: 'Declares a visit method per element type.' },
      { name: 'ConcreteVisitor', role: 'Implements one operation over the structure.' },
      { name: 'Element', role: 'Accepts visitors and dispatches to them.' },
    ],
    pros: [
      'New operations are added without touching the element classes.',
      'Related behavior is gathered in one visitor.',
    ],
    cons: [
      'Adding an element type breaks every visitor.',
      'Visitors often need access to element internals.',
    ],
    pitfalls: [
      'Visitors that forget to recurse into child nodes.',
      'Double dispatch emulated incorrectly in languages without overloading.',
    ],
    related: ['composite', 'iterator', 'interpreter'],
  },
];

/** Looks up the deep-dive content for a pattern slug. */
export function findPatternDetail(slug: string): PatternDetail | undefined {
  return patternDetails.find((detail) => detail.slug === slug);
}
