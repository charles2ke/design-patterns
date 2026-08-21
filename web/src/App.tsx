import { useEffect, useState } from 'react';
import { BestPracticesPage } from './pages/BestPracticesPage';
import { IndexPage } from './pages/IndexPage';
import { Nav } from './components/Nav';
import { BEST_PRACTICES_HASH, QUIZ_HASH } from './routes';
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

  return (
    <>
      <Nav
        currentPage={
          isQuiz ? 'quiz' : isBestPractices ? 'best-practices' : 'index'
        }
      />
      {isQuiz ? <QuizPage /> : isBestPractices ? <BestPracticesPage /> : <IndexPage />}
    </>
  );
}
