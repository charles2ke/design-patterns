import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Nav } from '../Nav';

function renderNav(currentPage: Parameters<typeof Nav>[0]['currentPage']) {
  const user = userEvent.setup();
  render(<Nav currentPage={currentPage} />);
  return { user, toggle: screen.getByRole('button', { name: 'Menu' }) };
}

describe('Nav', () => {
  it('hides the navigation links until the hamburger menu is opened', async () => {
    const { user, toggle } = renderNav('index');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const designBibleLink = screen.getByRole('link', {
      name: 'Design Bible',
      hidden: true,
    });
    expect(designBibleLink).toBeInTheDocument();
    expect(designBibleLink).not.toBeVisible();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
    ).toBeInTheDocument();
  });

  it('renders all navigation links when opened', async () => {
    const { user, toggle } = renderNav('index');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
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
    const { user, toggle } = renderNav('index');
    await user.click(toggle);

    await user.click(screen.getByRole('link', { name: 'Quiz' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const quizLink = screen.getByRole('link', { name: 'Quiz', hidden: true });
    expect(quizLink).toBeInTheDocument();
    expect(quizLink).not.toBeVisible();
  });

  it('closes the menu when Escape is pressed', async () => {
    const { user, toggle } = renderNav('index');
    await user.click(toggle);
    screen.getByRole('link', { name: 'Design Bible' }).focus();

    await user.keyboard('{Escape}');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('keeps the menu open when a key other than Escape is pressed', async () => {
    const { user, toggle } = renderNav('index');
    await user.click(toggle);
    screen.getByRole('link', { name: 'Design Bible' }).focus();

    await user.keyboard('{ArrowDown}');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
    ).toBeVisible();
  });

  it('marks the index link as current when on the index page', async () => {
    const { user, toggle } = renderNav('index');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the best-practices link as current when on the best practices page', async () => {
    const { user, toggle } = renderNav('best-practices');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Best Practices' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the quiz link as current when on the quiz page', async () => {
    const { user, toggle } = renderNav('quiz');
    await user.click(toggle);

    expect(screen.getByRole('link', { name: 'Quiz' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the algorithms & data structures link as current when on that page', async () => {
    const { user, toggle } = renderNav('algorithms-data-structures');
    await user.click(toggle);

    expect(
      screen.getByRole('link', { name: 'Algorithms & Data Structures' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'Design Bible' }),
    ).not.toHaveAttribute('aria-current');
  });
});
