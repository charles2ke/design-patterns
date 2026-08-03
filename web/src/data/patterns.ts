import type { Pattern } from '../types/pattern';

/**
 * The 23 Gang of Four design patterns, mirroring the catalog documented in the
 * repository README.
 */
export const patterns: Pattern[] = [
  {
    id: 1,
    slug: 'singleton',
    name: 'Singleton',
    category: 'Creational',
    intent:
      'Ensure a class has only one instance and provide a global access point.',
    useWhen: 'You need shared state/configuration with controlled access.',
  },
  {
    id: 2,
    slug: 'factory-method',
    name: 'Factory Method',
    category: 'Creational',
    intent:
      'Define an interface for creating an object, but let subclasses decide which class to instantiate.',
    useWhen:
      'Creation logic varies by context and you want to avoid tight coupling to concrete classes.',
  },
  {
    id: 3,
    slug: 'abstract-factory',
    name: 'Abstract Factory',
    category: 'Creational',
    intent:
      'Provide an interface for creating families of related/dependent objects.',
    useWhen:
      'You must enforce compatible product variants (for example, light/dark UI kits).',
  },
  {
    id: 4,
    slug: 'builder',
    name: 'Builder',
    category: 'Creational',
    intent:
      'Separate the construction of a complex object from its representation.',
    useWhen:
      'Objects have many optional fields/steps and telescoping constructors become messy.',
  },
  {
    id: 5,
    slug: 'prototype',
    name: 'Prototype',
    category: 'Creational',
    intent: 'Create new objects by cloning an existing instance.',
    useWhen: 'Object setup is expensive and many similar objects are required.',
  },
  {
    id: 6,
    slug: 'adapter',
    name: 'Adapter',
    category: 'Structural',
    intent: 'Convert one interface into another clients expect.',
    useWhen:
      'You need to integrate incompatible interfaces without changing source code.',
  },
  {
    id: 7,
    slug: 'bridge',
    name: 'Bridge',
    category: 'Structural',
    intent:
      'Decouple abstraction from implementation so both can vary independently.',
    useWhen:
      'You want to avoid class explosion from combining dimensions (shape x renderer, etc.).',
  },
  {
    id: 8,
    slug: 'composite',
    name: 'Composite',
    category: 'Structural',
    intent:
      'Compose objects into tree structures and treat part-whole uniformly.',
    useWhen: 'You model hierarchies (file systems, UI trees, org charts).',
  },
  {
    id: 9,
    slug: 'decorator',
    name: 'Decorator',
    category: 'Structural',
    intent: 'Add behavior to objects dynamically by wrapping them.',
    useWhen:
      'You need optional, combinable features without many subclasses.',
  },
  {
    id: 10,
    slug: 'facade',
    name: 'Facade',
    category: 'Structural',
    intent: 'Provide a simplified interface to a complex subsystem.',
    useWhen: 'You want to hide subsystem complexity behind a stable API.',
  },
  {
    id: 11,
    slug: 'flyweight',
    name: 'Flyweight',
    category: 'Structural',
    intent:
      'Share intrinsic state across many fine-grained objects to reduce memory.',
    useWhen:
      'Large numbers of similar objects exist (characters, map tiles, particles).',
  },
  {
    id: 12,
    slug: 'proxy',
    name: 'Proxy',
    category: 'Structural',
    intent:
      'Provide a surrogate/placeholder to control access to another object.',
    useWhen:
      'You need lazy loading, access control, caching, or remote indirection.',
  },
  {
    id: 13,
    slug: 'chain-of-responsibility',
    name: 'Chain of Responsibility',
    category: 'Behavioral',
    intent: 'Pass requests along a chain until one handler processes it.',
    useWhen:
      'Multiple handlers may process a request and sender should not know receiver.',
  },
  {
    id: 14,
    slug: 'command',
    name: 'Command',
    category: 'Behavioral',
    intent: 'Encapsulate a request as an object.',
    useWhen: 'You need undo/redo, queueing, logging, or macro operations.',
  },
  {
    id: 15,
    slug: 'interpreter',
    name: 'Interpreter',
    category: 'Behavioral',
    intent: 'Define grammar and interpreter for a small language.',
    useWhen: 'You need to evaluate domain-specific expressions.',
  },
  {
    id: 16,
    slug: 'iterator',
    name: 'Iterator',
    category: 'Behavioral',
    intent:
      'Access elements of an aggregate sequentially without exposing internals.',
    useWhen: 'You need uniform traversal over different collections.',
  },
  {
    id: 17,
    slug: 'mediator',
    name: 'Mediator',
    category: 'Behavioral',
    intent: 'Encapsulate how objects interact to reduce direct coupling.',
    useWhen: 'Many-to-many object communication becomes hard to maintain.',
  },
  {
    id: 18,
    slug: 'memento',
    name: 'Memento',
    category: 'Behavioral',
    intent:
      "Capture and restore an object's internal state without violating encapsulation.",
    useWhen: 'You need snapshots/checkpoints (undo history, rollback).',
  },
  {
    id: 19,
    slug: 'observer',
    name: 'Observer',
    category: 'Behavioral',
    intent:
      'Define one-to-many dependency so observers are notified of state changes.',
    useWhen: 'Event-driven updates are needed (UI updates, pub/sub).',
  },
  {
    id: 20,
    slug: 'state',
    name: 'State',
    category: 'Behavioral',
    intent: 'Let an object alter behavior when its internal state changes.',
    useWhen:
      'Behavior branches heavily on state and conditionals become large.',
  },
  {
    id: 21,
    slug: 'strategy',
    name: 'Strategy',
    category: 'Behavioral',
    intent:
      'Define a family of algorithms, encapsulate each, and make them interchangeable.',
    useWhen:
      'You need runtime selection of behavior (sorting, pricing, validation rules).',
  },
  {
    id: 22,
    slug: 'template-method',
    name: 'Template Method',
    category: 'Behavioral',
    intent:
      'Define algorithm skeleton in a base class and defer steps to subclasses.',
    useWhen: 'Workflows are similar but some steps differ by variant.',
  },
  {
    id: 23,
    slug: 'visitor',
    name: 'Visitor',
    category: 'Behavioral',
    intent:
      'Separate operations from object structure by moving behavior into visitor objects.',
    useWhen: 'You frequently add operations over a stable object structure.',
  },
];
