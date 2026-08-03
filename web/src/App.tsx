import { IndexPage } from './pages/IndexPage';
import { DatabaseDesignBestPracticesPage } from './pages/DatabaseDesignBestPracticesPage';

const DATABASE_DESIGN_PAGE_PATH = '/database-design-best-practices';

function normalizePathname(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  return normalizedPath === '' ? '/' : normalizedPath;
}

export function App() {
  const pathname = normalizePathname(window.location.pathname);
  const isDatabaseDesignPage =
    pathname === DATABASE_DESIGN_PAGE_PATH ||
    pathname.endsWith(DATABASE_DESIGN_PAGE_PATH);

  if (isDatabaseDesignPage) {
    return <DatabaseDesignBestPracticesPage />;
  }

  return <IndexPage />;
}
