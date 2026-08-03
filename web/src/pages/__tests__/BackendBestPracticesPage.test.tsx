import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackendBestPracticesPage } from '../BackendBestPracticesPage';

describe('BackendBestPracticesPage', () => {
  it('renders heading, navigation, and core sections', () => {
    render(<BackendBestPracticesPage />);

    expect(
      screen.getByRole('heading', { name: 'Backend Code Best Practices', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Design patterns index' }),
    ).toHaveAttribute('href', '#');
    expect(
      screen.getByRole('heading', { name: 'Architecture and boundaries', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Data and persistence', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Security and resilience', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Testing and operations', level: 2 }),
    ).toBeInTheDocument();
  });
});
