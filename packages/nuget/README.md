
# DesignPatterns.Catalog

Install:

```bash
dotnet add package DesignPatterns.Catalog
```

Usage:

```csharp
using DesignPatterns.Catalog;

var behavioral = PatternFilter.FilterPatterns(Patterns.All, "undo", PatternCategory.Behavioral);
var counts = PatternFilter.CountByCategory(Patterns.All);
```
