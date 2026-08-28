import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
import { AlgorithmsDataStructuresPage } from './pages/AlgorithmsDataStructuresPage';
import { IndexPage } from './pages/IndexPage';
import { Nav } from './components/Nav';
import { SiteFooter } from './components/SiteFooter';
import { ALGORITHMS_DATA_STRUCTURES_HASH, BEST_PRACTICES_HASH, QUIZ_HASH } from './routes';
import { QuizPage } from './pages/QuizPage';

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
  const isQuiz = hash === QUIZ_HASH || hash.startsWith(`${QUIZ_HASH}/`);
  const isBestPractices =
    hash === BEST_PRACTICES_HASH || hash.startsWith(`${BEST_PRACTICES_HASH}/`);
  const isAlgorithmsDataStructures =
    hash === ALGORITHMS_DATA_STRUCTURES_HASH ||
    hash.startsWith(`${ALGORITHMS_DATA_STRUCTURES_HASH}/`);

  return (
    <>
      <Nav
        currentPage={
          isQuiz
            ? 'quiz'
            : isBestPractices
              ? 'best-practices'
              : isAlgorithmsDataStructures
                ? 'algorithms-data-structures'
                : 'index'
        }
      />
      <div className="app-content">
        {isQuiz ? (
          <QuizPage />
        ) : isBestPractices ? (
          <BestPracticesPage />
        ) : isAlgorithmsDataStructures ? (
          <AlgorithmsDataStructuresPage />
        ) : (
          <IndexPage />
        )}
      </div>
      <SiteFooter />
    </>
  );
}
