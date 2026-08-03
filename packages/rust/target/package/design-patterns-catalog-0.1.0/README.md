
# design-patterns-catalog

Install:

```toml
[dependencies]
design-patterns-catalog = "0.1.0"
```

Usage:

```rust
use design_patterns_catalog::{count_by_category, filter_patterns, PATTERNS};

let behavioral = filter_patterns(PATTERNS, "undo", "Behavioral");
let counts = count_by_category(PATTERNS);
assert!(!behavioral.is_empty());
assert_eq!(counts["Behavioral"], 11);
```
