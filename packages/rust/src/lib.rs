
use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Pattern {
    pub id: u8,
    pub slug: &'static str,
    pub name: &'static str,
    pub category: &'static str,
    pub intent: &'static str,
    pub use_when: &'static str,
}

pub const PATTERN_CATEGORIES: [&str; 3] = ["Creational", "Structural", "Behavioral"];

pub static PATTERNS: &[Pattern] = &[
  Pattern {
      id: 1,
      slug: "singleton",
      name: "Singleton",
      category: "Creational",
      intent: "Ensure a class has only one instance and provide a global access point.",
      use_when: "You need shared state/configuration with controlled access.",
    },
  Pattern {
      id: 2,
      slug: "factory-method",
      name: "Factory Method",
      category: "Creational",
      intent: "Define an interface for creating an object, but let subclasses decide which class to instantiate.",
      use_when: "Creation logic varies by context and you want to avoid tight coupling to concrete classes.",
    },
  Pattern {
      id: 3,
      slug: "abstract-factory",
      name: "Abstract Factory",
      category: "Creational",
      intent: "Provide an interface for creating families of related/dependent objects.",
      use_when: "You must enforce compatible product variants (for example, light/dark UI kits).",
    },
  Pattern {
      id: 4,
      slug: "builder",
      name: "Builder",
      category: "Creational",
      intent: "Separate the construction of a complex object from its representation.",
      use_when: "Objects have many optional fields/steps and telescoping constructors become messy.",
    },
  Pattern {
      id: 5,
      slug: "prototype",
      name: "Prototype",
      category: "Creational",
      intent: "Create new objects by cloning an existing instance.",
      use_when: "Object setup is expensive and many similar objects are required.",
    },
  Pattern {
      id: 6,
      slug: "adapter",
      name: "Adapter",
      category: "Structural",
      intent: "Convert one interface into another clients expect.",
      use_when: "You need to integrate incompatible interfaces without changing source code.",
    },
  Pattern {
      id: 7,
      slug: "bridge",
      name: "Bridge",
      category: "Structural",
      intent: "Decouple abstraction from implementation so both can vary independently.",
      use_when: "You want to avoid class explosion from combining dimensions (shape x renderer, etc.).",
    },
  Pattern {
      id: 8,
      slug: "composite",
      name: "Composite",
      category: "Structural",
      intent: "Compose objects into tree structures and treat part-whole uniformly.",
      use_when: "You model hierarchies (file systems, UI trees, org charts).",
    },
  Pattern {
      id: 9,
      slug: "decorator",
      name: "Decorator",
      category: "Structural",
      intent: "Add behavior to objects dynamically by wrapping them.",
      use_when: "You need optional, combinable features without many subclasses.",
    },
  Pattern {
      id: 10,
      slug: "facade",
      name: "Facade",
      category: "Structural",
      intent: "Provide a simplified interface to a complex subsystem.",
      use_when: "You want to hide subsystem complexity behind a stable API.",
    },
  Pattern {
      id: 11,
      slug: "flyweight",
      name: "Flyweight",
      category: "Structural",
      intent: "Share intrinsic state across many fine-grained objects to reduce memory.",
      use_when: "Large numbers of similar objects exist (characters, map tiles, particles).",
    },
  Pattern {
      id: 12,
      slug: "proxy",
      name: "Proxy",
      category: "Structural",
      intent: "Provide a surrogate/placeholder to control access to another object.",
      use_when: "You need lazy loading, access control, caching, or remote indirection.",
    },
  Pattern {
      id: 13,
      slug: "chain-of-responsibility",
      name: "Chain of Responsibility",
      category: "Behavioral",
      intent: "Pass requests along a chain until one handler processes it.",
      use_when: "Multiple handlers may process a request and sender should not know receiver.",
    },
  Pattern {
      id: 14,
      slug: "command",
      name: "Command",
      category: "Behavioral",
      intent: "Encapsulate a request as an object.",
      use_when: "You need undo/redo, queueing, logging, or macro operations.",
    },
  Pattern {
      id: 15,
      slug: "interpreter",
      name: "Interpreter",
      category: "Behavioral",
      intent: "Define grammar and interpreter for a small language.",
      use_when: "You need to evaluate domain-specific expressions.",
    },
  Pattern {
      id: 16,
      slug: "iterator",
      name: "Iterator",
      category: "Behavioral",
      intent: "Access elements of an aggregate sequentially without exposing internals.",
      use_when: "You need uniform traversal over different collections.",
    },
  Pattern {
      id: 17,
      slug: "mediator",
      name: "Mediator",
      category: "Behavioral",
      intent: "Encapsulate how objects interact to reduce direct coupling.",
      use_when: "Many-to-many object communication becomes hard to maintain.",
    },
  Pattern {
      id: 18,
      slug: "memento",
      name: "Memento",
      category: "Behavioral",
      intent: "Capture and restore an object's internal state without violating encapsulation.",
      use_when: "You need snapshots/checkpoints (undo history, rollback).",
    },
  Pattern {
      id: 19,
      slug: "observer",
      name: "Observer",
      category: "Behavioral",
      intent: "Define one-to-many dependency so observers are notified of state changes.",
      use_when: "Event-driven updates are needed (UI updates, pub/sub).",
    },
  Pattern {
      id: 20,
      slug: "state",
      name: "State",
      category: "Behavioral",
      intent: "Let an object alter behavior when its internal state changes.",
      use_when: "Behavior branches heavily on state and conditionals become large.",
    },
  Pattern {
      id: 21,
      slug: "strategy",
      name: "Strategy",
      category: "Behavioral",
      intent: "Define a family of algorithms, encapsulate each, and make them interchangeable.",
      use_when: "You need runtime selection of behavior (sorting, pricing, validation rules).",
    },
  Pattern {
      id: 22,
      slug: "template-method",
      name: "Template Method",
      category: "Behavioral",
      intent: "Define algorithm skeleton in a base class and defer steps to subclasses.",
      use_when: "Workflows are similar but some steps differ by variant.",
    },
  Pattern {
      id: 23,
      slug: "visitor",
      name: "Visitor",
      category: "Behavioral",
      intent: "Separate operations from object structure by moving behavior into visitor objects.",
      use_when: "You frequently add operations over a stable object structure.",
    }
];

pub fn matches_query(pattern: &Pattern, query: &str) -> bool {
    let needle = query.trim().to_lowercase();
    if needle.is_empty() {
        return true;
    }

    [pattern.name, pattern.intent, pattern.use_when, pattern.category]
        .iter()
        .any(|field| field.to_lowercase().contains(&needle))
}

pub fn filter_patterns(patterns: &[Pattern], query: &str, category: &str) -> Vec<Pattern> {
    patterns
        .iter()
        .copied()
        .filter(|pattern| {
            (category == "All" || pattern.category.eq_ignore_ascii_case(category))
                && matches_query(pattern, query)
        })
        .collect()
}

pub fn count_by_category(patterns: &[Pattern]) -> HashMap<&'static str, usize> {
    let mut counts = HashMap::from([
        ("Creational", 0usize),
        ("Structural", 0usize),
        ("Behavioral", 0usize),
    ]);

    for pattern in patterns {
        *counts.entry(pattern.category).or_insert(0) += 1;
    }

    counts
}
