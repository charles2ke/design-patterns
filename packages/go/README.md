
# designpatterns

Install:

```bash
go get github.com/charles2ke/design-patterns/packages/go/designpatterns
```

Usage:

```go
import "github.com/charles2ke/design-patterns/packages/go/designpatterns"

behavioral := designpatterns.FilterPatterns(designpatterns.Patterns, "undo", "Behavioral")
counts := designpatterns.CountByCategory(designpatterns.Patterns)
_ = behavioral
_ = counts
```
