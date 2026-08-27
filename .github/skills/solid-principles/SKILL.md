---
name: solid-principles
description: Apply the SOLID object-oriented design principles (single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion). Use when designing, refactoring, or reviewing classes, modules, and abstractions.
---

# SOLID Principles

Five object-oriented design principles that keep code easy to extend, test, and change.
Complements the best-practices hub of the site: https://charles2ke.github.io/design-patterns/#/best-practices

## Single responsibility

- Give each class or module one reason to change.
- Split types that mix unrelated concerns, such as persistence, formatting, and business rules.
- Prefer small, focused units that can be named without using "and".

## Open/closed

- Make behavior extendable without editing existing, working code.
- Add new cases through new implementations rather than growing conditional chains.
- Use strategy, decorator, or template method patterns to absorb variation.

## Liskov substitution

- Ensure any subtype can replace its base type without breaking callers.
- Never strengthen preconditions or weaken postconditions in a subtype.
- Avoid overrides that throw "not supported"; the abstraction is wrong if you need them.

## Interface segregation

- Keep interfaces small and client-specific instead of broad and general.
- Split fat interfaces so implementers are not forced to stub unused members.
- Let consumers depend only on the operations they actually call.

## Dependency inversion

- Depend on abstractions, not on concrete implementations.
- Inject collaborators instead of constructing them inside the consuming class.
- Let the high-level policy own the abstraction that low-level details implement.

## Checklist

- [ ] Each class has a single, clearly named responsibility
- [ ] New behavior can be added without modifying existing code paths
- [ ] Subtypes honor the contracts of their base types
- [ ] Interfaces are narrow and tailored to their consumers
- [ ] Dependencies are injected abstractions, not hard-coded concretions
