import { useState } from 'react';
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

  return (
    <div className="code-examples">
      <div
        className="code-examples__tabs"
        role="tablist"
        aria-label="Example language"
      >
        {EXAMPLE_LANGUAGES.map((meta) => (
          <button
            key={meta.id}
            type="button"
            role="tab"
            id={`code-tab-${meta.id}`}
            className="code-examples__tab"
            aria-selected={language === meta.id}
            aria-controls="code-examples-panel"
            tabIndex={language === meta.id ? 0 : -1}
            onClick={() => setLanguage(meta.id)}
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
