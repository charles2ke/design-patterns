
# design-patterns-catalog

Install:

```bash
npm install design-patterns-catalog
```

Usage:

```ts
import { patterns, filterPatterns, countByCategory } from 'design-patterns-catalog';

const creational = filterPatterns(patterns, '', 'Creational');
const counts = countByCategory(patterns);
```
