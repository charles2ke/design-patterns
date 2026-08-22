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

test('shows a visual flow for each pattern', async ({ page }) => {
  await expect(page.getByRole('list', { name: 'Visual flow' })).toHaveCount(23);
  await expect(page.getByText('Client requests instance')).toBeVisible();
  await expect(
    page.getByText('Singleton creates or returns cached instance'),
  ).toBeVisible();
  await expect(page.getByText('Client uses shared object')).toBeVisible();
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

test('can navigate to database design best practices under the best practices tab', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Open best practices tab' }).click();

  await expect(page).toHaveURL(/#\/best-practices$/);
  await expect(
    page.getByRole('heading', { name: 'Front-End Best Practices', level: 1 }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Database Design' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Database Design Best Practices',
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);

  await page.getByRole('link', { name: 'Design Patterns' }).click();
  await expect(
    page.getByRole('heading', { name: 'Design Patterns Index', level: 1 }),
  ).toBeVisible();
});
