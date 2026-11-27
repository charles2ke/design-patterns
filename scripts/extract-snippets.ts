import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findPatternExample,
  type ExampleLanguage,
} from '../web/src/data/pattern-examples.ts';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const testsRoot = path.resolve(scriptDir, '..', 'snippet-tests');
const source = 'web/src/data/pattern-examples.ts';

type TestedLanguage = Extract<ExampleLanguage, 'csharp' | 'go' | 'python'>;

interface SnippetTarget {
  slug: string;
  language: TestedLanguage;
  /** Output path relative to `snippet-tests/`, matching a pattern in `snippet-tests/.gitignore`. */
  file: string;
  /** Code the snippet needs before it compiles on its own, such as a Go package clause. */
  header?: string;
}

const generatedNotice: Record<TestedLanguage, string> = {
  csharp: `// Generated from ${source} by scripts/extract-snippets.ts. Do not edit.`,
  go: `// Code generated from ${source} by scripts/extract-snippets.ts. DO NOT EDIT.`,
  python: `# Generated from ${source} by scripts/extract-snippets.ts. Do not edit.`,
};

const targets: SnippetTarget[] = [
  { slug: 'prototype', language: 'python', file: 'python/prototype_snippet.py' },
  {
    slug: 'flyweight',
    language: 'go',
    file: 'go/flyweight/snippet.go',
    header: 'package flyweight',
  },
  {
    slug: 'chain-of-responsibility',
    language: 'go',
    file: 'go/chain/snippet.go',
    header: 'package chain',
  },
  {
    slug: 'template-method',
    language: 'csharp',
    file: 'csharp/TemplateMethodSnippet.cs',
    header: 'namespace Snippets.TemplateMethod;',
  },
  {
    slug: 'template-method',
    language: 'go',
    file: 'go/templatemethod/snippet.go',
    header: 'package templatemethod',
  },
];

async function main() {
  for (const target of targets) {
    const example = findPatternExample(target.slug);

    if (!example) {
      throw new Error(`Unknown pattern slug in snippet targets: ${target.slug}`);
    }

    const parts = [generatedNotice[target.language], target.header, example.snippets[target.language]];
    const outputPath = path.join(testsRoot, target.file);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${parts.filter(Boolean).join('\n\n')}\n`, 'utf8');
    console.log(`Wrote snippet-tests/${target.file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
