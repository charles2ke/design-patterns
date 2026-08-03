import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
import { BackendBestPracticesPage } from './pages/BackendBestPracticesPage';
import { DatabaseDesignBestPracticesPage } from './pages/DatabaseDesignBestPracticesPage';
import { IndexPage } from './pages/IndexPage';
import { Nav } from './components/Nav';
import { BACKEND_BEST_PRACTICES_HASH } from './routes';

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
  const isBackendBestPractices = hash === BACKEND_BEST_PRACTICES_HASH;

  if (isDatabaseDesignPage) {
    return <DatabaseDesignBestPracticesPage />;
  }

  if (isBackendBestPractices) {
    return <BackendBestPracticesPage />;
  }

  return (
    <>
      <Nav currentPage={isBestPractices ? 'best-practices' : 'index'} />
      {isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
}
