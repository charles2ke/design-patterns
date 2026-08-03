---
applyTo: "packages/go/**"
---

# Go package instructions

## Package overview
The `packages/go` module exposes the `designpatterns` package for Go consumers. It exports the `Pattern` struct, `PatternCategories`, the `Patterns` slice, and the `FilterPatterns`, `MatchesQuery`, and `CountByCategory` helper functions.

## Development setup
1. `cd packages/go`
2. Use the standard Go toolchain with the module defined in `go.mod`.
3. Edit implementation files in `designpatterns/`.

## Build command
`cd packages/go && go test ./...`

## Test command
`cd packages/go && go test ./...`

## Conventions
- Use idiomatic Go naming: exported identifiers in PascalCase, internal locals in camelCase.
- Keep data immutable by convention; treat `Patterns` as catalog data, not mutable application state.
- Run `gofmt` on edited Go files.
- Keep matching logic case-insensitive with `strings.ToLower` / `strings.EqualFold`.

## Pattern model
`Pattern` is a struct with exported fields `ID`, `Slug`, `Name`, `Category`, `Intent`, and `UseWhen`.

## How to add a new pattern
1. Add a new struct literal to `packages/go/designpatterns/patterns.go`.
2. Keep the category aligned with `PatternCategories`.
3. Update `packages/go/designpatterns/patterns_test.go` if counts or expectations change.
4. Run `gofmt -w packages/go/designpatterns/*.go`.
5. Run `cd packages/go && go test ./...`.
