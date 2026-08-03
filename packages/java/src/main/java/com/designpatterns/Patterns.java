
package com.designpatterns;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class Patterns {
    public static final List<Pattern> ALL = Collections.unmodifiableList(Arrays.asList(
        new Pattern(1, "singleton", "Singleton", PatternCategory.CREATIONAL.value(), "Ensure a class has only one instance and provide a global access point.", "You need shared state/configuration with controlled access."),
        new Pattern(2, "factory-method", "Factory Method", PatternCategory.CREATIONAL.value(), "Define an interface for creating an object, but let subclasses decide which class to instantiate.", "Creation logic varies by context and you want to avoid tight coupling to concrete classes."),
        new Pattern(3, "abstract-factory", "Abstract Factory", PatternCategory.CREATIONAL.value(), "Provide an interface for creating families of related/dependent objects.", "You must enforce compatible product variants (for example, light/dark UI kits)."),
        new Pattern(4, "builder", "Builder", PatternCategory.CREATIONAL.value(), "Separate the construction of a complex object from its representation.", "Objects have many optional fields/steps and telescoping constructors become messy."),
        new Pattern(5, "prototype", "Prototype", PatternCategory.CREATIONAL.value(), "Create new objects by cloning an existing instance.", "Object setup is expensive and many similar objects are required."),
        new Pattern(6, "adapter", "Adapter", PatternCategory.STRUCTURAL.value(), "Convert one interface into another clients expect.", "You need to integrate incompatible interfaces without changing source code."),
        new Pattern(7, "bridge", "Bridge", PatternCategory.STRUCTURAL.value(), "Decouple abstraction from implementation so both can vary independently.", "You want to avoid class explosion from combining dimensions (shape x renderer, etc.)."),
        new Pattern(8, "composite", "Composite", PatternCategory.STRUCTURAL.value(), "Compose objects into tree structures and treat part-whole uniformly.", "You model hierarchies (file systems, UI trees, org charts)."),
        new Pattern(9, "decorator", "Decorator", PatternCategory.STRUCTURAL.value(), "Add behavior to objects dynamically by wrapping them.", "You need optional, combinable features without many subclasses."),
        new Pattern(10, "facade", "Facade", PatternCategory.STRUCTURAL.value(), "Provide a simplified interface to a complex subsystem.", "You want to hide subsystem complexity behind a stable API."),
        new Pattern(11, "flyweight", "Flyweight", PatternCategory.STRUCTURAL.value(), "Share intrinsic state across many fine-grained objects to reduce memory.", "Large numbers of similar objects exist (characters, map tiles, particles)."),
        new Pattern(12, "proxy", "Proxy", PatternCategory.STRUCTURAL.value(), "Provide a surrogate/placeholder to control access to another object.", "You need lazy loading, access control, caching, or remote indirection."),
        new Pattern(13, "chain-of-responsibility", "Chain of Responsibility", PatternCategory.BEHAVIORAL.value(), "Pass requests along a chain until one handler processes it.", "Multiple handlers may process a request and sender should not know receiver."),
        new Pattern(14, "command", "Command", PatternCategory.BEHAVIORAL.value(), "Encapsulate a request as an object.", "You need undo/redo, queueing, logging, or macro operations."),
        new Pattern(15, "interpreter", "Interpreter", PatternCategory.BEHAVIORAL.value(), "Define grammar and interpreter for a small language.", "You need to evaluate domain-specific expressions."),
        new Pattern(16, "iterator", "Iterator", PatternCategory.BEHAVIORAL.value(), "Access elements of an aggregate sequentially without exposing internals.", "You need uniform traversal over different collections."),
        new Pattern(17, "mediator", "Mediator", PatternCategory.BEHAVIORAL.value(), "Encapsulate how objects interact to reduce direct coupling.", "Many-to-many object communication becomes hard to maintain."),
        new Pattern(18, "memento", "Memento", PatternCategory.BEHAVIORAL.value(), "Capture and restore an object's internal state without violating encapsulation.", "You need snapshots/checkpoints (undo history, rollback)."),
        new Pattern(19, "observer", "Observer", PatternCategory.BEHAVIORAL.value(), "Define one-to-many dependency so observers are notified of state changes.", "Event-driven updates are needed (UI updates, pub/sub)."),
        new Pattern(20, "state", "State", PatternCategory.BEHAVIORAL.value(), "Let an object alter behavior when its internal state changes.", "Behavior branches heavily on state and conditionals become large."),
        new Pattern(21, "strategy", "Strategy", PatternCategory.BEHAVIORAL.value(), "Define a family of algorithms, encapsulate each, and make them interchangeable.", "You need runtime selection of behavior (sorting, pricing, validation rules)."),
        new Pattern(22, "template-method", "Template Method", PatternCategory.BEHAVIORAL.value(), "Define algorithm skeleton in a base class and defer steps to subclasses.", "Workflows are similar but some steps differ by variant."),
        new Pattern(23, "visitor", "Visitor", PatternCategory.BEHAVIORAL.value(), "Separate operations from object structure by moving behavior into visitor objects.", "You frequently add operations over a stable object structure.")
    ));

    private Patterns() {
    }
}
