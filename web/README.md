# Design Patterns Index (React)

A React + TypeScript single-page app for learning design patterns. It includes a
searchable index of the 23 Gang of Four patterns, a best-practices knowledge
hub, and a modern Who Wants to Be a Millionaire-style quiz focused on design
pattern knowledge.

![Index page](docs/screenshots/index-page.png)
![Quiz page](docs/screenshots/quiz-page.png)
![Quiz win celebration](docs/screenshots/quiz-win.png)

## Best-practice skills

Each best-practices section links to a matching Copilot agent skill in
[`.github/skills`](../.github/skills), so the same guidance can be applied while
writing or reviewing code:

- [Front-End](../.github/skills/frontend-best-practices/SKILL.md)
- [Backend](../.github/skills/backend-best-practices/SKILL.md)
- [Database Design](../.github/skills/database-design-best-practices/SKILL.md)
- [AI First](../.github/skills/ai-first-best-practices/SKILL.md)

![Backend best practices with skill link](docs/screenshots/best-practices-backend.png)

## Getting started

```bash
cd web
npm install
npm run dev
```

## Deployment

- Production builds use `VITE_BASE_PATH` so the app can be deployed under the
  repository GitHub Pages path.
- Pushes to `main` automatically build `web/dist` and deploy it to GitHub
  Pages.
- Each deployment writes `build-info.json` (commit SHA, ref and build time) into
  the published site, and the workflow fails if the live site does not serve the
  commit that was just deployed. Check
  https://charles2ke.github.io/design-patterns/build-info.json to confirm what
  is currently live.
- Default production URL: https://charles2ke.github.io/design-patterns/

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build |
| `npm run lint` | Lint with oxlint |
| `npm test` | Run unit + scenario tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage (100% thresholds enforced) |
| `npm run test:e2e` | Run Playwright end-to-end scenarios |

## Folder structure

```
web/
├── index.html
├── playwright.config.ts      # E2E test configuration
├── vite.config.ts            # Vite + Vitest (unit test) configuration
├── docs/screenshots/         # UI screenshots
├── src/
│   ├── components/           # Presentational components (+ __tests__)
│   ├── data/                 # Static GoF pattern catalog (+ __tests__)
│   ├── hooks/                # Reusable state logic (+ __tests__)
│   ├── pages/                # Page-level composition (+ __tests__)
│   ├── styles/               # Global stylesheet
│   ├── test/                 # Test setup files
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Pure helpers (+ __tests__)
│   ├── App.tsx
│   └── main.tsx
└── tests/e2e/                # Playwright scenario tests
```

## Testing

- **Unit tests** (`src/**/__tests__`) cover every component, hook, util, the
  data set and the app entry point. Coverage thresholds are set to 100% for
  statements, branches, functions and lines.
- **Scenario tests** cover complete user journeys across index, best-practices,
  and quiz flows both at the component level with Testing Library and end-to-end
  in a real browser with Playwright.
