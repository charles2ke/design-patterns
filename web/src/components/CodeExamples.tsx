import { useRef, useState } from 'react';
import {
  EXAMPLE_LANGUAGES,
  type ExampleLanguage,
  type PatternExample,
} from '../data/pattern-examples';

interface CodeExamplesProps {
  example: PatternExample;
}

export function CodeExamples({ example }: CodeExamplesProps) {
  const [language, setLanguage] = useState<ExampleLanguage>(
    EXAMPLE_LANGUAGES[0].id,
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTabAt = (index: number) => {
    const count = EXAMPLE_LANGUAGES.length;
    const nextIndex = (index + count) % count;
    setLanguage(EXAMPLE_LANGUAGES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        focusTabAt(index + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusTabAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTabAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusTabAt(EXAMPLE_LANGUAGES.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="code-examples">
      <div
        className="code-examples__tabs"
        role="tablist"
        aria-label="Example language"
      >
        {EXAMPLE_LANGUAGES.map((meta, index) => (
          <button
            key={meta.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`code-tab-${meta.id}`}
            className="code-examples__tab"
            aria-selected={language === meta.id}
            aria-controls="code-examples-panel"
            tabIndex={language === meta.id ? 0 : -1}
            onClick={() => setLanguage(meta.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {meta.label}
          </button>
        ))}
      </div>
      <pre
        id="code-examples-panel"
        className="code-examples__code"
        role="tabpanel"
        aria-labelledby={`code-tab-${language}`}
        tabIndex={0}
      >
        <code>{example.snippets[language]}</code>
      </pre>
    </div>
  );
}
