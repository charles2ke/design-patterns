---
applyTo: "packages/java/**"
---

# Java package instructions

## Package overview
The `packages/java` library publishes `design-patterns-catalog` for Maven consumers. It exports the `Pattern` class, `PatternCategory` enum, `Patterns.ALL`, and the `PatternFilter` static helpers for filtering, matching, and counting.

## Development setup
1. `cd packages/java`
2. Use Maven with Java 11.
3. Edit main sources under `src/main/java/com/designpatterns/` and tests under `src/test/java/com/designpatterns/`.

## Build command
`cd packages/java && mvn test`

## Test command
`cd packages/java && mvn test`

## Conventions
- Use standard Java naming: PascalCase for classes, camelCase for methods and locals.
- Keep utility classes final with private constructors when they only expose static members.
- Prefer immutable fields and unmodifiable collections for exported catalog data.
- Preserve case-insensitive matching using `Locale.ROOT`.

## Pattern model
`Pattern` is a final class with private final fields and public getters for `id`, `slug`, `name`, `category`, `intent`, and `useWhen`.

## How to add a new pattern
1. Add a new `new Pattern(...)` entry to `packages/java/src/main/java/com/designpatterns/Patterns.java`.
2. Use the string value from the appropriate `PatternCategory` enum constant.
3. Update `packages/java/src/test/java/com/designpatterns/PatternsTest.java` if counts or expectations change.
4. Run `cd packages/java && mvn test`.
