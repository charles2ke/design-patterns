---
applyTo: "packages/npm/**"
---

# TypeScript package instructions

## Package overview
The `packages/npm` library publishes `design-patterns-catalog` for npm consumers. It exports the `Pattern` interface, `PatternCategory`, `PATTERN_CATEGORIES`, the full `patterns` array of 23 GoF entries, and the `filterPatterns`, `matchesQuery`, and `countByCategory` helpers.

## Development setup
1. `cd packages/npm`
2. `npm install`
3. Use the package sources in `src/` as the development surface. Build artifacts are generated into `dist/`.

## Build command
`cd packages/npm && npm run build`

## Test command
`cd packages/npm && npm test`

## Conventions
- Use ESM-friendly TypeScript with `type: module` and `moduleResolution: NodeNext`.
- Keep exported API definitions in `src/index.ts`; do not import runtime data from `web/`.
- Prefer explicit exported types for public API changes.
- Keep helpers pure and use case-insensitive substring matching logic consistent with the existing utilities.

## Pattern model
`Pattern` is a TypeScript interface with fields `id`, `slug`, `name`, `category`, `intent`, and `useWhen`. Categories are constrained by the `PatternCategory` union type.

## How to add a new pattern
1. Add the new object to the inlined `patterns` array in `packages/npm/src/index.ts`.
2. Keep the object shape aligned with the `Pattern` interface.
3. Update tests in `packages/npm/src/index.test.ts` if counts or expectations change.
4. Run `cd packages/npm && npm run build`.
5. Run `cd packages/npm && npm test`.
