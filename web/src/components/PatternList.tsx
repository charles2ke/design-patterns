import type { Pattern } from '../types/pattern';
import { PatternCard } from './PatternCard';
import { EmptyState } from './EmptyState';

interface PatternListProps {
  patterns: Pattern[];
  onReset: () => void;
}

export function PatternList({ patterns, onReset }: PatternListProps) {
  if (patterns.length === 0) {
    return <EmptyState onReset={onReset} />;
  }

  return (
    <section className="pattern-list" aria-label="Design patterns">
      {patterns.map((pattern) => (
        <PatternCard key={pattern.slug} pattern={pattern} />
      ))}
    </section>
  );
}
