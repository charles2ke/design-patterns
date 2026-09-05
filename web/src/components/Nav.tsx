import { useEffect, useRef, useState } from 'react';
import {
  ALGORITHMS_DATA_STRUCTURES_HASH,
  ALGORITHMS_QUIZ_HASH,
  BEST_PRACTICES_HASH,
  BEST_PRACTICES_QUIZ_HASH,
  QUIZ_HASH,
} from '../routes';

type NavPage =
  | 'index'
  | 'best-practices'
  | 'quiz'
  | 'algorithms-data-structures'
  | 'algorithms-quiz'
  | 'best-practices-quiz';

interface NavProps {
  currentPage: NavPage;
}

interface NavLink {
  page: NavPage;
  href: string;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  links: NavLink[];
}

const LINKS: NavLink[] = [
  { page: 'index', href: '#/', label: 'Design Patterns' },
  { page: 'best-practices', href: BEST_PRACTICES_HASH, label: 'Best Practices' },
  {
    page: 'algorithms-data-structures',
    href: ALGORITHMS_DATA_STRUCTURES_HASH,
    label: 'Algorithms & Data Structures',
  },
];

const GROUPS: NavGroup[] = [
  {
    id: 'quizzes',
    label: 'Quizzes',
    links: [
      { page: 'quiz', href: QUIZ_HASH, label: 'Quiz' },
      {
        page: 'algorithms-quiz',
        href: ALGORITHMS_QUIZ_HASH,
        label: 'Algorithms Quiz',
      },
      {
        page: 'best-practices-quiz',
        href: BEST_PRACTICES_QUIZ_HASH,
        label: 'Best Practices Quiz',
      },
    ],
  },
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

  const renderLink = (link: NavLink) => (
    <a
      key={link.page}
      href={link.href}
      className="main-nav__link"
      aria-current={currentPage === link.page ? 'page' : undefined}
      onClick={() => {
        setIsOpen(false);
        toggleRef.current?.focus();
      }}
    >
      {link.label}
    </a>
  );

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
      <span className="main-nav__brand">Design Bible</span>
      <div id="main-nav-menu" className="main-nav__menu" hidden={!isOpen}>
        {LINKS.map((link) => renderLink(link))}
        {GROUPS.map((group) => (
          <div
            key={group.id}
            className="main-nav__group"
            role="group"
            aria-labelledby={`main-nav-group-${group.id}`}
          >
            <span className="main-nav__group-label" id={`main-nav-group-${group.id}`}>
              {group.label}
            </span>
            {group.links.map((link) => renderLink(link))}
          </div>
        ))}
      </div>
    </nav>
  );
}
