import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
import { IndexPage } from './pages/IndexPage';
import { Nav } from './components/Nav';
import { BEST_PRACTICES_HASH } from './routes';

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
  const isBestPractices =
    hash === BEST_PRACTICES_HASH || hash.startsWith(`${BEST_PRACTICES_HASH}/`);

  return (
    <>
      <Nav currentPage={isBestPractices ? 'best-practices' : 'index'} />
      {isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
}
