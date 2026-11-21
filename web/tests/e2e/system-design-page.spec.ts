import { expect, test } from '@playwright/test';

const URL_SHORTENER = 'Design a URL shortener (TinyURL / bit.ly)';

test('groups the questions by difficulty and explains the company tags', async ({ page }) => {
  await page.goto('/#/system-design');

  await expect(
    page.getByRole('heading', { name: 'System Design Interview Questions', level: 1 }),
  ).toBeVisible();
  for (const level of ['Easy', 'Medium', 'Hard']) {
    await expect(page.getByRole('heading', { name: level, level: 2 })).toBeVisible();
  }
  await expect(page.getByRole('status')).toHaveText('Showing 27 of 27 questions');
  await expect(page.getByText(/companies do not publish their interview questions/)).toBeVisible();

  const chipTops = await page
    .getByRole('list', { name: 'Reported at' })
    .first()
    .getByRole('listitem')
    .evaluateAll((chips) => chips.map((chip) => chip.getBoundingClientRect().top));
  expect(chipTops.length).toBeGreaterThan(1);
  expect(new Set(chipTops).size).toBe(1);
  await page.screenshot({ path: test.info().outputPath('system-design.png') });
});

test('difficulty and company filters are shareable through the URL', async ({ page }) => {
  await page.goto('/#/system-design');
  const company = page.getByRole('group', { name: 'Company' });

  await page.getByRole('group', { name: 'Difficulty' }).getByRole('button', { name: 'Hard' }).click();
  await company.getByRole('button', { name: 'OpenAI' }).click();

  await expect(page).toHaveURL(/#\/system-design\?difficulty=Hard&company=OpenAI$/);

  await page.reload();

  await expect(company.getByRole('button', { name: 'OpenAI' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toHaveText('Showing 4 of 27 questions');
  await expect(page.getByRole('heading', { name: 'Easy', level: 2 })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(4);
});

test('expands a detailed solution with a diagram, trade-offs and code', async ({ page }) => {
  await page.goto('/#/system-design');
  const article = page.getByRole('article', { name: URL_SHORTENER });
  const summary = article.locator('summary');
  const box = await summary.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);

  await summary.click();

  await expect(article.getByRole('img', { name: /architecture diagram/ })).toBeVisible();
  await expect(article.getByRole('table')).toBeVisible();
  const code = article.getByRole('region', { name: /cryptographically random codes/ });
  await expect(code).toContainText('export function randomCode');
  await expect(code).toContainText('TOMBSTONE');
  await expect(
    article.getByRole('heading', { name: '10. Follow-up questions', level: 4 }),
  ).toBeVisible();
  await article.screenshot({ path: test.info().outputPath('system-design-solution.png') });
});

test('fits a phone screen without horizontal page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#/system-design');

  await page.getByRole('article', { name: URL_SHORTENER }).locator('summary').click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('nav link opens the system design page and marks it active', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'System Design' }).click();

  await expect(
    page.getByRole('heading', { name: 'System Design Interview Questions', level: 1 }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('link', { name: 'System Design' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
