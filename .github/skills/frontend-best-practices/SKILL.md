---
name: frontend-best-practices
description: Apply front-end best practices for accessibility, performance, code quality, security, and architecture when writing or reviewing web UI code. Use when working on React components, HTML, CSS, or browser-facing JavaScript/TypeScript.
---

# Front-End Best Practices

Guidelines for building accessible, performant, and maintainable web applications.
Mirrors the front-end section of the site: https://charles2ke.github.io/design-patterns/#/best-practices

## Accessibility

- Use semantic HTML (`<nav>`, `<main>`, `<article>`, `<button>`) instead of generic `<div>`/`<span>`; it reduces the need for ARIA and helps assistive tech.
- Ensure every interactive element is reachable and operable by keyboard, with a visible focus indicator and logical tab order.
- Meet WCAG 2.1 AA contrast: at least 4.5:1 for normal text and 3:1 for large text.
- Give images meaningful `alt` text, and label form controls with a real `<label>`.

## Performance

- Lazy-load off-screen images, iframes, and non-critical scripts.
- Split bundles by route with dynamic `import()` so each route ships only the code it needs.
- Serve modern image formats (WebP/AVIF) with `<picture>` fallbacks.
- Budget and measure Core Web Vitals (LCP, CLS, INP) rather than guessing.

## Code quality

- Keep components small and single-purpose; extract logic into hooks or pure helpers that can be unit tested.
- Prefer explicit, typed props over loose objects; avoid `any` in TypeScript.
- Co-locate tests with the code they cover and test behavior through the accessible DOM, not implementation details.

## Security

- Never inject unsanitized user content into the DOM; avoid `dangerouslySetInnerHTML` unless the value is sanitized.
- Keep secrets out of client bundles — anything shipped to the browser is public.
- Validate and encode data coming from APIs before rendering it.

## Architecture

- Keep state as close to where it is used as possible; lift it only when shared.
- Separate data fetching from presentation so views stay easy to test.
- Define routing and navigation in one place so links stay consistent.

## Checklist

- [ ] Semantic markup and keyboard operability verified
- [ ] Contrast and focus styles checked
- [ ] Bundle impact considered (lazy loading / code splitting)
- [ ] No unsanitized HTML or leaked secrets
- [ ] Tests cover the new behavior
