
# design-patterns-catalog

Install:

```bash
pip install design-patterns-catalog
```

Usage:

```python
from design_patterns_catalog import patterns, filter_patterns, count_by_category

behavioral = filter_patterns(patterns, 'undo', 'Behavioral')
counts = count_by_category(patterns)
```
