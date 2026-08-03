import type { Pattern } from '../types/pattern';

interface TableOfContentsProps {
  patterns: Pattern[];
}

export function TableOfContents({ patterns }: TableOfContentsProps) {
  if (patterns.length === 0) {
    return null;
  }

  const groupedPatterns = patterns.reduce<Record<string, Pattern[]>>(
    (groups, pattern) => {
      groups[pattern.category] ??= [];
      groups[pattern.category].push(pattern);
      return groups;
    },
    {},
  );

  return (
    <nav className="table-of-contents" aria-label="Table of contents">
      <h2 className="table-of-contents__title">Table of contents</h2>
      <div className="table-of-contents__groups">
        {Object.entries(groupedPatterns).map(([category, categoryPatterns]) => {
          const headingId = `toc-${category.toLowerCase()}`;

          return (
            <section
              key={category}
              className="table-of-contents__group"
              aria-labelledby={headingId}
            >
              <h3 id={headingId} className="table-of-contents__heading">
                {category}
              </h3>
              <ul className="table-of-contents__list">
                {categoryPatterns.map((pattern) => (
                  <li key={pattern.slug}>
                    <a
                      className="table-of-contents__link"
                      href={`#pattern-${pattern.slug}`}
                    >
                      {pattern.id}. {pattern.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
