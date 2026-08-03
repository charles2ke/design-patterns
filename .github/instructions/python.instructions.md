---
applyTo: "packages/python/**"
---

# Python package instructions

## Package overview
The `packages/python` library publishes `design-patterns-catalog` for PyPI consumers. It exports the frozen `Pattern` dataclass, `PATTERN_CATEGORIES`, the `patterns` list, and the `filter_patterns`, `matches_query`, and `count_by_category` helpers.

## Development setup
1. `cd packages/python`
2. `python -m pip install -e ".[dev]"`
3. Edit package code in `src/design_patterns_catalog/` and tests in `tests/`.

## Build command
`cd packages/python && python -m pip install -e ".[dev]"`

## Test command
`cd packages/python && pytest`

## Conventions
- Use straightforward Python 3.9+ code with standard library types only.
- Keep function names snake_case.
- Preserve the existing public field name `useWhen` on the dataclass for API consistency with the catalog.
- Keep helpers pure and use case-insensitive substring matching.

## Pattern model
`Pattern` is a frozen dataclass with fields `id`, `slug`, `name`, `category`, `intent`, and `useWhen`.

## How to add a new pattern
1. Add a new `Pattern(...)` entry to `packages/python/src/design_patterns_catalog/__init__.py`.
2. Keep the category within `PATTERN_CATEGORIES`.
3. Update `packages/python/tests/test_patterns.py` if counts or expectations change.
4. Run `cd packages/python && python -m pip install -e ".[dev]"`.
5. Run `cd packages/python && pytest`.
