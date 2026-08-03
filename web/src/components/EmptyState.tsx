interface EmptyStateProps {
  onReset: () => void;
  message?: string;
}

export function EmptyState({
  onReset,
  message = 'No patterns match your filters.',
}: EmptyStateProps) {
  return (
    <section className="empty-state">
      <p>{message}</p>
      <button type="button" className="empty-state__reset" onClick={onReset}>
        Clear filters
      </button>
    </section>
  );
}
