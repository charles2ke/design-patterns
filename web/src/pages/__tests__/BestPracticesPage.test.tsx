import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { BestPracticesPage } from '../BestPracticesPage';
import { bestPractices } from '../../data/best-practices';
import type { BestPractice } from '../../types/best-practice';

afterEach(() => {
  window.location.hash = '';
});

describe('BestPracticesPage', () => {
  it('renders the heading and subtitle', () => {
    render(<BestPracticesPage />);

    expect(
      screen.getByRole('heading', {
        name: 'Front-End Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('lists all best practices by default', () => {
    render(<BestPracticesPage />);

    expect(screen.getAllByRole('article')).toHaveLength(bestPractices.length);
    expect(screen.getByRole('status')).toHaveTextContent(
      `${bestPractices.length} of ${bestPractices.length} best practices`,
    );
  });

  it('supports an injected source', () => {
    render(<BestPracticesPage source={bestPractices.slice(0, 3)} />);

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('3 of 3 best practices');
  });

  it('renders a card for each best practice', () => {
    render(<BestPracticesPage source={bestPractices.slice(0, 2)} />);

    expect(
      screen.getByTestId(`practice-${bestPractices[0].slug}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`practice-${bestPractices[1].slug}`),
    ).toBeInTheDocument();
  });

  it('renders an accessible search bar for practices', () => {
    render(<BestPracticesPage />);

    expect(screen.getByLabelText('Search practices')).toBeInTheDocument();
  });

  it('filters practices by search query', async () => {
    const user = userEvent.setup();
    const source: BestPractice[] = [
      {
        id: 1,
        slug: 'alpha',
        title: 'Alpha Practice',
        category: 'Performance',
        summary: 'Summary alpha',
        why: 'Reason alpha',
      },
      {
        id: 2,
        slug: 'beta',
        title: 'Beta Practice',
        category: 'Accessibility',
        summary: 'Summary beta',
        why: 'Reason beta',
      },
    ];
    render(<BestPracticesPage source={source} />);

    await user.type(screen.getByLabelText('Search practices'), 'Alpha');

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 best practices');
  });

  it('shows the empty state when no practices match the query', async () => {
    const user = userEvent.setup();
    render(<BestPracticesPage source={bestPractices.slice(0, 3)} />);

    await user.type(
      screen.getByLabelText('Search practices'),
      'zzznomatch',
    );

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(
      screen.getByText('No practices match your search.'),
    ).toBeInTheDocument();
  });

  it('resets the filter when empty state reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<BestPracticesPage source={bestPractices.slice(0, 3)} />);

    await user.type(
      screen.getByLabelText('Search practices'),
      'zzznomatch',
    );
    expect(screen.queryAllByRole('article')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('renders sub-navigation tabs for all best practices categories', () => {
    render(<BestPracticesPage />);

    expect(screen.getByRole('link', { name: 'Front-End' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Backend' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Database Design' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI First' })).toBeInTheDocument();
  });

  it('switches to the backend section when its tab is clicked', async () => {
    const user = userEvent.setup();
    render(<BestPracticesPage />);

    await user.click(screen.getByRole('link', { name: 'Backend' }));

    expect(
      screen.getByRole('heading', { name: 'Backend Code Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });

  it('switches to the database design section when its tab is clicked', async () => {
    const user = userEvent.setup();
    render(<BestPracticesPage />);

    await user.click(screen.getByRole('link', { name: 'Database Design' }));

    expect(
      screen.getByRole('heading', {
        name: 'Database Design Best Practices',
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it('switches to the AI first section when its tab is clicked', async () => {
    const user = userEvent.setup();
    render(<BestPracticesPage />);

    await user.click(screen.getByRole('link', { name: 'AI First' }));

    expect(
      screen.getByRole('heading', { name: 'AI First Best Practices', level: 1 }),
    ).toBeInTheDocument();
  });
});
