---
applyTo: "packages/rust/**"
---

# Rust package instructions

## Package overview
The `packages/rust` crate publishes `design-patterns-catalog` for Cargo consumers. It exports the `Pattern` struct, `PATTERN_CATEGORIES`, the static `PATTERNS` slice, and the `filter_patterns`, `matches_query`, and `count_by_category` helpers.

## Development setup
1. `cd packages/rust`
2. Use Cargo for editing, building, and testing.
3. Update library code in `src/lib.rs` and integration tests in `tests/`.

## Build command
`cd packages/rust && cargo test`

## Test command
`cd packages/rust && cargo test`

## Conventions
- Use standard Rust formatting and ownership-friendly APIs.
- Keep exported helper names in snake_case, matching crate conventions.
- Use `&'static str` fields for the static catalog data.
- Preserve case-insensitive query matching behavior across all helpers.

## Pattern model
`Pattern` is a struct deriving `Clone`, `Copy`, `Debug`, and `PartialEq`, with fields `id`, `slug`, `name`, `category`, `intent`, and `use_when`.

## How to add a new pattern
1. Add a new `Pattern { ... }` entry to the `PATTERNS` slice in `packages/rust/src/lib.rs`.
2. Keep the category within `PATTERN_CATEGORIES`.
3. Update `packages/rust/tests/integration_test.rs` if counts or expectations change.
4. Run `cd packages/rust && cargo test`.
