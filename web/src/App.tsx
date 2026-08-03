import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
import { IndexPage } from './pages/IndexPage';
<<<<<<< HEAD
import { Nav } from './components/Nav';

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return hash;
}

export function App() {
  const hash = useHashRoute();
  const isBestPractices = hash === '#/best-practices';

  return (
    <>
      <Nav currentPage={isBestPractices ? 'best-practices' : 'index'} />
      {isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
=======
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
>>>>>>> origin/main
}
