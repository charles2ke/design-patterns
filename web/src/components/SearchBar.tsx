interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label className="search-bar__label" htmlFor="pattern-search">
        Search patterns
      </label>
      <input
        id="pattern-search"
        className="search-bar__input"
        type="search"
        placeholder="Search by name, intent or usage"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
