import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { IndexPage } from './pages/IndexPage';
import { BackendBestPracticesPage } from './pages/BackendBestPracticesPage';
import { BACKEND_BEST_PRACTICES_HASH } from './routes';

export function App() {
  const [hash, setHash] = useState(() => window.location.hash.toLowerCase());

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash.toLowerCase());
    };

    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  if (hash === BACKEND_BEST_PRACTICES_HASH) {
    return <BackendBestPracticesPage />;
  }

  return <IndexPage />;
=======
import { BestPracticesPage } from './pages/BestPracticesPage';
import { DatabaseDesignBestPracticesPage } from './pages/DatabaseDesignBestPracticesPage';
import { IndexPage } from './pages/IndexPage';
import { Nav } from './components/Nav';

const DATABASE_DESIGN_PAGE_PATH = '/database-design-best-practices';

function normalizePathname(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  return normalizedPath === '' ? '/' : normalizedPath;
}

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
  const pathname = normalizePathname(window.location.pathname);
  const isDatabaseDesignPage =
    pathname === DATABASE_DESIGN_PAGE_PATH ||
    pathname.endsWith(DATABASE_DESIGN_PAGE_PATH);
  const isBestPractices = hash === '#/best-practices';

  if (isDatabaseDesignPage) {
    return <DatabaseDesignBestPracticesPage />;
  }

  return (
    <>
      <Nav currentPage={isBestPractices ? 'best-practices' : 'index'} />
      {isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
>>>>>>> origin/main
}
