import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/interview-questions');
});

test('shows the interview questions heading and both categories', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Tough Interview Questions', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Design Patterns questions', level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'System Design questions', level: 2 }),
  ).toBeVisible();
  await expect(page.locator('article.interview-page__question')).toHaveCount(16);
});

test('expands a complete solution with code', async ({ page }) => {
  const article = page.getByRole('article', { name: /Design a distributed rate limiter/ });
  const code = article.locator('.interview-page__example pre');
  await expect(code).toBeHidden();

  const summary = article.locator('summary');
  const box = await summary.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);

  await summary.click();

  await expect(article.getByRole('heading', { name: 'Algorithm choice', level: 4 })).toBeVisible();
  await expect(code).toBeVisible();
  await expect(code).toContainText("redis.call('TIME')");
  await article.screenshot({ path: test.info().outputPath('rate-limiter-solution.png') });
});

test('nav shows the interview questions link as active', async ({ page }) => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('link', { name: 'Interview Questions' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('nav link navigates to the interview questions page from the index', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Interview Questions' }).click();

  await expect(
    page.getByRole('heading', { name: 'Tough Interview Questions', level: 1 }),
  ).toBeVisible();
});
