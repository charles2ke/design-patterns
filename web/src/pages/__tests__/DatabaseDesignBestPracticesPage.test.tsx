import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DatabaseDesignBestPracticesPage } from '../DatabaseDesignBestPracticesPage';

describe('DatabaseDesignBestPracticesPage', () => {
  it('renders the page title, backlink, and five best practices', () => {
    render(<DatabaseDesignBestPracticesPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'Back to design patterns index' }),
    ).toHaveAttribute('href', './');

    expect(
      screen.getByRole('region', { name: 'Database design best practices' }),
    ).toBeInTheDocument();

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});
