import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Nav } from '../Nav';

function renderOpenNav(currentPage: Parameters<typeof Nav>[0]['currentPage']) {
  const user = userEvent.setup();
  render(<Nav currentPage={currentPage} />);
  return { user, toggle: screen.getByRole('button', { name: 'Menu' }) };
}

describe('Nav', () => {
  it('hides the navigation links until the hamburger menu is opened', async () => {
    const { user, toggle } = renderOpenNav('index');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('link', { name: 'Design Patterns' }),
    ).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).toBeInTheDocument();
  });

  it('renders all navigation links when opened', async () => {
    const { user, toggle } = renderOpenNav('index');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Algorithms & Data Structures' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quiz' })).toBeInTheDocument();
  });

  it('closes the menu when a link is clicked', async () => {
    const { user, toggle } = renderOpenNav('index');
    await user.click(toggle);

    await user.click(screen.getByRole('link', { name: 'Quiz' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Quiz' })).not.toBeInTheDocument();
  });

  it('closes the menu when Escape is pressed', async () => {
    const { user, toggle } = renderOpenNav('index');
    await user.click(toggle);

    await user.keyboard('{Escape}');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the menu open when another key is pressed', async () => {
    const { user, toggle } = renderOpenNav('index');
    await user.click(toggle);

    await user.keyboard('{ArrowDown}');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks the index link as current when on the index page', async () => {
    const { user, toggle } = renderOpenNav('index');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the best-practices link as current when on the best practices page', async () => {
    const { user, toggle } = renderOpenNav('best-practices');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the quiz link as current when on the quiz page', async () => {
    const { user, toggle } = renderOpenNav('quiz');
    await user.click(toggle);

    expect(screen.getByRole('link', { name: 'Quiz' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the algorithms & data structures link as current when on that page', async () => {
    const { user, toggle } = renderOpenNav('algorithms-data-structures');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Algorithms & Data Structures' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Design Patterns' }),
    ).not.toHaveAttribute('aria-current');
  });
});
