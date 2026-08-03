import { PATTERN_CATEGORIES } from '../types/pattern';
import type { CategoryFilter } from '../utils/filterPatterns';

interface CategoryFilterBarProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

const options: CategoryFilter[] = ['All', ...PATTERN_CATEGORIES];

export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  return (
    <nav className="category-filter" aria-label="Filter by category">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="category-filter__button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </nav>
  );
}
