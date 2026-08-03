---
applyTo: "packages/nuget/**"
---

# C# package instructions

## Package overview
The `packages/nuget` library publishes `DesignPatterns.Catalog` for .NET consumers. It exposes the `Pattern` model, `PatternCategory` constants, `Patterns.All`, and the `PatternFilter` helpers for filtering, matching, and category counts.

## Development setup
1. `cd packages/nuget`
2. Restore and build with the .NET SDK using the standard project file `DesignPatterns.csproj`.
3. Edit source files under `src/`.

## Build command
`cd packages/nuget && dotnet build`

## Test command
`cd packages/nuget && dotnet test`

## Conventions
- Target `netstandard2.0` and keep compatibility-friendly C# features.
- Use PascalCase for public types, methods, and properties.
- Keep the catalog immutable at the API surface with get-only properties and readonly collections.
- Keep filtering behavior case-insensitive and aligned with the other language packages.

## Pattern model
`Pattern` is a public class with constructor-initialized get-only properties: `Id`, `Slug`, `Name`, `Category`, `Intent`, and `UseWhen`.

## How to add a new pattern
1. Add a new `Pattern(...)` entry to `packages/nuget/src/Patterns.cs`.
2. Keep category values consistent with `PatternCategory` constants.
3. Update or add tests if a test project is introduced later, or adjust any validation expectations.
4. Run `cd packages/nuget && dotnet build`.
5. Run `cd packages/nuget && dotnet test`.
