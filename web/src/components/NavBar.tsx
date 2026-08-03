interface NavBarProps {
  currentPage: string;
}

export function NavBar({ currentPage }: NavBarProps) {
  return (
    <nav className="nav-bar" aria-label="Site navigation">
      <ul className="nav-bar__list">
        <li>
          <a
            href="#/"
            className="nav-bar__link"
            aria-current={currentPage === 'index' ? 'page' : undefined}
          >
            Design Patterns
          </a>
        </li>
        <li>
          <a
            href="#/best-practices"
            className="nav-bar__link"
            aria-current={currentPage === 'best-practices' ? 'page' : undefined}
          >
            AI-First Best Practices
          </a>
        </li>
      </ul>
    </nav>
  );
}
