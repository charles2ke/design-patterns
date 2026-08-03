import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows the full Gang of Four catalog on first load', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(
    'Showing 23 of 23 patterns',
  );
  await expect(page.locator('article')).toHaveCount(23);
});

test('searching narrows the catalog to matching patterns', async ({ page }) => {
  await page.getByLabel('Search patterns').fill('undo');

  await expect(page.locator('article')).toHaveCount(2);
  await expect(page.getByTestId('pattern-command')).toBeVisible();
  await expect(page.getByTestId('pattern-memento')).toBeVisible();
});

test('table of contents links jump to the selected pattern', async ({
  page,
}) => {
  await page.getByRole('link', { name: '19. Observer' }).click();

  await expect(page).toHaveURL(/#pattern-observer$/);
  await expect(page.getByTestId('pattern-observer')).toBeVisible();
});

test('category filters restrict the catalog', async ({ page }) => {
  await page.getByRole('button', { name: 'Structural', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(7);

  await page.getByRole('button', { name: 'Behavioral', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(11);

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(23);
});

test('empty results can be cleared to restore the catalog', async ({
  page,
}) => {
  await page.getByLabel('Search patterns').fill('serverless');

  await expect(page.getByText('No patterns match your filters.')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page.getByLabel('Search patterns')).toHaveValue('');
  await expect(page.locator('article')).toHaveCount(23);
});

test('can navigate to and from database design best practices page', async ({
  page,
}) => {
  await page
    .getByRole('link', { name: 'Open database design best practices page' })
    .click();

  await expect(page).toHaveURL(/\/database-design-best-practices$/);
  await expect(
    page.getByRole('heading', {
      name: 'Database Design Best Practices',
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);

  await page
    .getByRole('link', { name: 'Back to design patterns index' })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
  ).toBeVisible();
});
