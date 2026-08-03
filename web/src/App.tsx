import { useEffect, useState } from 'react';
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
}
