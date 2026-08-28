import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteFooter } from '../SiteFooter';

describe('SiteFooter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-06-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a LinkedIn link that opens in a new tab', () => {
    render(<SiteFooter />);

    const link = screen.getByRole('link', {
      name: "Charles's LinkedIn profile",
    });

    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/charles2ke');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('renders the LinkedIn icon as decorative', () => {
    render(<SiteFooter />);

    const icon = document.querySelector('.site-footer__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
  });

  it('renders the copyright line with the current year', () => {
    render(<SiteFooter />);

    expect(screen.getByText('© 2030 Design Bible')).toBeInTheDocument();
  });
});
