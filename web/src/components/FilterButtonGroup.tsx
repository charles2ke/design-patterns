import { useId } from 'react';

interface FilterButtonGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

/** A labelled row of toggle buttons where exactly one option is active. */
export function FilterButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterButtonGroupProps<T>) {
  const labelId = useId();

  return (
    <div className="filter-group">
      <span id={labelId} className="filter-group__label">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="category-filter">
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
      </div>
    </div>
  );
}
