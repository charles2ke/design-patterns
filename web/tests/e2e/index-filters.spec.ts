import { expect, test } from '@playwright/test';

test('search and category filters are shareable through the URL', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByLabel('Search patterns').fill('undo');
  await page.getByRole('button', { name: 'Behavioral' }).click();

  await expect(page).toHaveURL(/#\/\?q=undo&category=Behavioral$/);

  await page.reload();

  await expect(page.getByLabel('Search patterns')).toHaveValue('undo');
  await expect(page.getByRole('status')).toHaveText('Showing 2 of 23 patterns');
});

test('in-page table of contents links keep the active filters', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByLabel('Search patterns').fill('undo');
  await expect(page.getByRole('status')).toHaveText('Showing 2 of 23 patterns');

  await page
    .getByRole('navigation', { name: 'Table of contents' })
    .getByRole('link')
    .first()
    .click();

  await expect(page.getByLabel('Search patterns')).toHaveValue('undo');
  await expect(page.getByRole('status')).toHaveText('Showing 2 of 23 patterns');
});

test.describe('theme', () => {
  test.use({ colorScheme: 'dark' });

  test('follows the OS preference and persists an explicit choice', async ({
    page,
  }) => {
    await page.goto('/');
    const html = page.locator('html');

    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});
