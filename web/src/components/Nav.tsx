interface NavProps {
  currentPage: 'index' | 'best-practices' | 'quiz' | 'algorithms-data-structures';
}

export function Nav({ currentPage }: NavProps) {
  return (
    <nav className="main-nav" aria-label="Site navigation">
      <a
        href="#/"
        className="main-nav__link"
        aria-current={currentPage === 'index' ? 'page' : undefined}
      >
        Design Patterns
      </a>
      <a
        href="#/best-practices"
        className="main-nav__link"
        aria-current={currentPage === 'best-practices' ? 'page' : undefined}
      >
        Best Practices
      </a>
      <a
        href="#/algorithms-data-structures"
        className="main-nav__link"
        aria-current={currentPage === 'algorithms-data-structures' ? 'page' : undefined}
      >
        Algorithms &amp; Data Structures
      </a>
      <a
        href="#/quiz"
        className="main-nav__link"
        aria-current={currentPage === 'quiz' ? 'page' : undefined}
      >
        Quiz
      </a>
    </nav>
  );
}
