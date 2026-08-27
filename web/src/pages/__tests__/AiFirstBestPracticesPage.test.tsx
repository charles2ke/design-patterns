import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiFirstBestPracticesPage } from '../AiFirstBestPracticesPage';

describe('AiFirstBestPracticesPage', () => {
  it('renders heading and core sections', () => {
    render(<AiFirstBestPracticesPage />);

    expect(
      screen.getByRole('heading', { name: 'AI First Best Practices', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Design and product', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Reliability and quality', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Security and trust', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Cost and operations', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'AI engineering interview tips', level: 2 }),
    ).toBeInTheDocument();
  });
});
