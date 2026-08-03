interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  label = 'Search patterns',
  id = 'pattern-search',
  placeholder = 'Search by name, intent or usage',
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <label className="search-bar__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="search-bar__input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
