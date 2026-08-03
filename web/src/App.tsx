import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
<<<<<<< HEAD
import { IndexPage } from './pages/IndexPage';
import { NavBar } from './components/NavBar';

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
=======
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
>>>>>>> origin/main
  }, []);

  return hash;
}

export function App() {
  const hash = useHashRoute();
<<<<<<< HEAD
  const isBestPractices = hash === '#/best-practices';

  return (
    <>
      <NavBar currentPage={isBestPractices ? 'best-practices' : 'index'} />
=======
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
>>>>>>> origin/main
      {isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
}
