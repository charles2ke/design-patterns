
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Literal

PatternCategory = Literal['Creational', 'Structural', 'Behavioral']
CategoryFilter = Literal['All', 'Creational', 'Structural', 'Behavioral']
PATTERN_CATEGORIES: List[PatternCategory] = ['Creational', 'Structural', 'Behavioral']


@dataclass(frozen=True)
class Pattern:
    id: int
    slug: str
    name: str
    category: PatternCategory
    intent: str
    useWhen: str


patterns: List[Pattern] = [
Pattern(1, 'singleton', 'Singleton', 'Creational', 'Ensure a class has only one instance and provide a global access point.', 'You need shared state/configuration with controlled access.'),
Pattern(2, 'factory-method', 'Factory Method', 'Creational', 'Define an interface for creating an object, but let subclasses decide which class to instantiate.', 'Creation logic varies by context and you want to avoid tight coupling to concrete classes.'),
Pattern(3, 'abstract-factory', 'Abstract Factory', 'Creational', 'Provide an interface for creating families of related/dependent objects.', 'You must enforce compatible product variants (for example, light/dark UI kits).'),
Pattern(4, 'builder', 'Builder', 'Creational', 'Separate the construction of a complex object from its representation.', 'Objects have many optional fields/steps and telescoping constructors become messy.'),
Pattern(5, 'prototype', 'Prototype', 'Creational', 'Create new objects by cloning an existing instance.', 'Object setup is expensive and many similar objects are required.'),
Pattern(6, 'adapter', 'Adapter', 'Structural', 'Convert one interface into another clients expect.', 'You need to integrate incompatible interfaces without changing source code.'),
Pattern(7, 'bridge', 'Bridge', 'Structural', 'Decouple abstraction from implementation so both can vary independently.', 'You want to avoid class explosion from combining dimensions (shape x renderer, etc.).'),
Pattern(8, 'composite', 'Composite', 'Structural', 'Compose objects into tree structures and treat part-whole uniformly.', 'You model hierarchies (file systems, UI trees, org charts).'),
Pattern(9, 'decorator', 'Decorator', 'Structural', 'Add behavior to objects dynamically by wrapping them.', 'You need optional, combinable features without many subclasses.'),
Pattern(10, 'facade', 'Facade', 'Structural', 'Provide a simplified interface to a complex subsystem.', 'You want to hide subsystem complexity behind a stable API.'),
Pattern(11, 'flyweight', 'Flyweight', 'Structural', 'Share intrinsic state across many fine-grained objects to reduce memory.', 'Large numbers of similar objects exist (characters, map tiles, particles).'),
Pattern(12, 'proxy', 'Proxy', 'Structural', 'Provide a surrogate/placeholder to control access to another object.', 'You need lazy loading, access control, caching, or remote indirection.'),
Pattern(13, 'chain-of-responsibility', 'Chain of Responsibility', 'Behavioral', 'Pass requests along a chain until one handler processes it.', 'Multiple handlers may process a request and sender should not know receiver.'),
Pattern(14, 'command', 'Command', 'Behavioral', 'Encapsulate a request as an object.', 'You need undo/redo, queueing, logging, or macro operations.'),
Pattern(15, 'interpreter', 'Interpreter', 'Behavioral', 'Define grammar and interpreter for a small language.', 'You need to evaluate domain-specific expressions.'),
Pattern(16, 'iterator', 'Iterator', 'Behavioral', 'Access elements of an aggregate sequentially without exposing internals.', 'You need uniform traversal over different collections.'),
Pattern(17, 'mediator', 'Mediator', 'Behavioral', 'Encapsulate how objects interact to reduce direct coupling.', 'Many-to-many object communication becomes hard to maintain.'),
Pattern(18, 'memento', 'Memento', 'Behavioral', "Capture and restore an object's internal state without violating encapsulation.", 'You need snapshots/checkpoints (undo history, rollback).'),
Pattern(19, 'observer', 'Observer', 'Behavioral', 'Define one-to-many dependency so observers are notified of state changes.', 'Event-driven updates are needed (UI updates, pub/sub).'),
Pattern(20, 'state', 'State', 'Behavioral', 'Let an object alter behavior when its internal state changes.', 'Behavior branches heavily on state and conditionals become large.'),
Pattern(21, 'strategy', 'Strategy', 'Behavioral', 'Define a family of algorithms, encapsulate each, and make them interchangeable.', 'You need runtime selection of behavior (sorting, pricing, validation rules).'),
Pattern(22, 'template-method', 'Template Method', 'Behavioral', 'Define algorithm skeleton in a base class and defer steps to subclasses.', 'Workflows are similar but some steps differ by variant.'),
Pattern(23, 'visitor', 'Visitor', 'Behavioral', 'Separate operations from object structure by moving behavior into visitor objects.', 'You frequently add operations over a stable object structure.')
]


def matches_query(pattern: Pattern, query: str) -> bool:
    needle = query.strip().lower()
    if not needle:
        return True
    return any(needle in field.lower() for field in (pattern.name, pattern.intent, pattern.useWhen, pattern.category))


def filter_patterns(source: Iterable[Pattern], query: str, category: CategoryFilter) -> List[Pattern]:
    return [
        pattern
        for pattern in source
        if (category == 'All' or pattern.category == category) and matches_query(pattern, query)
    ]


def count_by_category(source: Iterable[Pattern]) -> Dict[PatternCategory, int]:
    counts: Dict[PatternCategory, int] = {'Creational': 0, 'Structural': 0, 'Behavioral': 0}
    for pattern in source:
        counts[pattern.category] += 1
    return counts


__all__ = [
    'Pattern',
    'PatternCategory',
    'PATTERN_CATEGORIES',
    'patterns',
    'filter_patterns',
    'matches_query',
    'count_by_category',
]
