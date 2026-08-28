import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/algorithms-data-structures');
});

test('shows the algorithms and data structures heading on load', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Algorithms and Data Structures', level: 1 }),
  ).toBeVisible();
});

test('renders the core content sections', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Overview', level: 2 })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Algorithmic complexity (Big O)', level: 2 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Searching', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sorting', level: 2 })).toBeVisible();
});

test('renders code examples for data structures and algorithms', async ({ page }) => {
  await expect(page.locator('.algorithms-page__example')).not.toHaveCount(0);
  await expect(page.getByText('Example: binary search', { exact: true })).toBeVisible();
  await expect(page.getByText('Example: merge sort', { exact: true })).toBeVisible();
  await expect(page.getByText('Example: breadth-first search', { exact: true })).toBeVisible();
});

test('nav link navigates back to the design patterns index', async ({ page }) => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Design Patterns' }).click();

  await expect(
    page.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('article')).toHaveCount(23);
});

test('nav shows the algorithms & data structures link as active', async ({ page }) => {
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(
    page.getByRole('link', { name: 'Algorithms & Data Structures' }),
  ).toHaveAttribute('aria-current', 'page');
});
