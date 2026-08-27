import { useEffect, useState } from 'react';
import {
  ALGORITHMS_DATA_STRUCTURES_HASH,
  BEST_PRACTICES_HASH,
  QUIZ_HASH,
} from '../routes';

type NavPage = 'index' | 'best-practices' | 'quiz' | 'algorithms-data-structures';

interface NavProps {
  currentPage: NavPage;
}

const LINKS: Array<{ page: NavPage; href: string; label: string }> = [
  { page: 'index', href: '#/', label: 'Design Patterns' },
  { page: 'best-practices', href: BEST_PRACTICES_HASH, label: 'Best Practices' },
  {
    page: 'algorithms-data-structures',
    href: ALGORITHMS_DATA_STRUCTURES_HASH,
    label: 'Algorithms & Data Structures',
  },
  { page: 'quiz', href: QUIZ_HASH, label: 'Quiz' },
];

export function Nav({ currentPage }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <div className="main-nav">
      <button
        type="button"
        className="main-nav__toggle"
        aria-expanded={isOpen}
        aria-controls="main-nav-menu"
        aria-label="Menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="main-nav__toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav
        id="main-nav-menu"
        className="main-nav__menu"
        aria-label="Site navigation"
        hidden={!isOpen}
      >
        {LINKS.map((link) => (
          <a
            key={link.page}
            href={link.href}
            className="main-nav__link"
            aria-current={currentPage === link.page ? 'page' : undefined}
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
