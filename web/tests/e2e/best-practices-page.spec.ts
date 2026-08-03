import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/best-practices');
});

test('shows the best practices heading on load', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Front-End Best Practices', level: 1 }),
  ).toBeVisible();
});

test('lists all best practices', async ({ page }) => {
  await expect(page.locator('article')).toHaveCount(15);
  await expect(page.getByRole('status')).toHaveText('15 of 15 best practices');
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
  await page.getByRole('link', { name: 'Design Patterns' }).click();

  await expect(
    page.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
  ).toBeVisible();
  await expect(page.locator('article')).toHaveCount(23);
});

test('nav shows best practices link as active', async ({ page }) => {
  await expect(
    page.getByRole('link', { name: 'Best Practices' }),
  ).toHaveAttribute('aria-current', 'page');
});
