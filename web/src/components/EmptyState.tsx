interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <p>No patterns match your filters.</p>
      <button type="button" className="empty-state__reset" onClick={onReset}>
        Clear filters
      </button>
    </section>
  );
}
