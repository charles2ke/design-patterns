import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
import { IndexPage } from './pages/IndexPage';
import { NavBar } from './components/NavBar';

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return hash;
}

export function App() {
  const hash = useHashRoute();
  const isBestPractices = hash === '#/best-practices';

  return (
    <>
      <NavBar currentPage={isBestPractices ? 'best-practices' : 'index'} />
      {isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
}
