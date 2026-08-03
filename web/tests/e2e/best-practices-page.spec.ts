import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/best-practices');
});

<<<<<<< HEAD
test('shows the AI-First Best Practices page with all 12 practices', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: 'AI-First Best Practices', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Showing 12 of 12 practices',
  );
  await expect(page.locator('article')).toHaveCount(12);
});

test('searching narrows the practices to matching results', async ({ page }) => {
  await page.getByLabel('Search patterns').fill('supply-chain');

  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByTestId('practice-dependency-hygiene')).toBeVisible();
});

test('category filter restricts practices to the selected category', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Safety', exact: true }).click();

  await expect(page.locator('article')).toHaveCount(3);

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(12);
});

test('empty results can be cleared to restore all practices', async ({
  page,
}) => {
  await page.getByLabel('Search patterns').fill('no-match-xyz');

  await expect(
    page.getByText('No practices match your filters.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page.getByLabel('Search patterns')).toHaveValue('');
  await expect(page.locator('article')).toHaveCount(12);
});

test('navigation bar links between pages', async ({ page }) => {
  await expect(
    page.getByRole('link', { name: 'AI-First Best Practices' }),
  ).toHaveAttribute('aria-current', 'page');

=======
test('shows the best practices heading on load', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Front-End Best Practices', level: 1 }),
  ).toBeVisible();
});

test('lists all best practices', async ({ page }) => {
  await expect(page.locator('article')).toHaveCount(15);
  await expect(page.getByRole('status')).toHaveText('15 best practices');
});

test('renders cards with category, summary, and why sections', async ({
  page,
}) => {
  const firstCard = page.getByTestId('practice-semantic-html');
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByText('Accessibility')).toBeVisible();
  await expect(firstCard.getByText(/Prefer elements that carry meaning/)).toBeVisible();
  await expect(firstCard.getByText(/Screen readers and search engines/)).toBeVisible();
});

test('nav link navigates back to the design patterns index', async ({
  page,
}) => {
>>>>>>> origin/main
  await page.getByRole('link', { name: 'Design Patterns' }).click();

  await expect(
    page.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
  ).toBeVisible();
<<<<<<< HEAD
  await expect(
    page.getByRole('link', { name: 'Design Patterns' }),
=======
  await expect(page.locator('article')).toHaveCount(23);
});

test('nav shows best practices link as active', async ({ page }) => {
  await expect(
    page.getByRole('link', { name: 'Best Practices' }),
>>>>>>> origin/main
  ).toHaveAttribute('aria-current', 'page');
});
