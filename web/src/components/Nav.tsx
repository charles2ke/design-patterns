import { useEffect, useRef, useState } from 'react';
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
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <nav className="main-nav" aria-label="Site navigation">
      <button
        ref={toggleRef}
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
      <div id="main-nav-menu" className="main-nav__menu" hidden={!isOpen}>
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
      </div>
    </nav>
  );
}
