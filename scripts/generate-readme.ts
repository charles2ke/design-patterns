import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { patterns } from '../web/src/data/patterns.ts';
import {
  EXAMPLE_LANGUAGES,
  patternExamples,
} from '../web/src/data/pattern-examples.ts';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const readmePath = path.join(repoRoot, 'README.md');
const startHeading = '## Gang of Four (GoF) Design Patterns';
const examplesHeading = '## Example Code (C#, Java, React, Python, Go, Rust)';
const endHeading = '## Quick Pattern Selection Guide';

function buildCatalogSection(): string {
  const counts = patterns.reduce<Record<string, number>>((acc, pattern) => {
    acc[pattern.category] = (acc[pattern.category] ?? 0) + 1;
    return acc;
  }, {});

  const table = [
    '| ID | Pattern | Category | Intent | Use when |',
    '| --- | --- | --- | --- | --- |',
    ...patterns.map(
      (pattern) =>
        `| ${pattern.id} | ${pattern.name} | ${pattern.category} | ${pattern.intent} | ${pattern.useWhen} |`,
    ),
  ].join('\n');

  return [
    startHeading,
    '',
    'The GoF catalog contains 23 object-oriented patterns grouped into three families:',
    '',
    `- **Creational**: ${counts.Creational ?? 0}`,
    `- **Structural**: ${counts.Structural ?? 0}`,
    `- **Behavioral**: ${counts.Behavioral ?? 0}`,
    '',
    table,
    '',
    '---',
    '',
  ].join('\n');
}

function buildExamplesSection(): string {
  const sections = patternExamples.map((example) => {
    const pattern = patterns.find((item) => item.slug === example.slug);

    if (!pattern) {
      throw new Error(`Unknown pattern slug in examples: ${example.slug}`);
    }

    const snippets = EXAMPLE_LANGUAGES.map((language) =>
      [
        `#### ${language.label}`,
        '```' + language.fence,
        example.snippets[language.id],
        '```',
        '',
      ].join('\n'),
    ).join('\n');

    return [`### ${pattern.name} (${pattern.category})`, '', snippets].join('\n');
  });

  return [
    examplesHeading,
    '',
    'Below are practical GoF examples across all requested languages.',
    '',
    ...sections,
    '---',
    '',
    '',
  ].join('\n');
}

async function main() {
  const readme = await readFile(readmePath, 'utf8');
  const startIndex = readme.indexOf(startHeading);
  const endIndex = readme.indexOf(endHeading);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Could not locate the generated section boundaries in README.md');
  }

  const generated = `${buildCatalogSection()}${buildExamplesSection()}`;
  const updated = `${readme.slice(0, startIndex)}${generated}${readme.slice(endIndex)}`;

  if (updated !== readme) {
    await writeFile(readmePath, updated, 'utf8');
    console.log('Updated README.md');
    return;
  }

  console.log('README.md is already up to date');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
