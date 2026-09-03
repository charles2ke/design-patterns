import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/quiz/algorithms-data-structures');
});

test('loads the algorithms quiz and shows the first question', async ({ page }) => {
  await expect(
    page.getByRole('heading', {
      name: 'Who Wants to Be an Algorithms Ace?',
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText('Question 1 of 15')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lock answer' })).toBeVisible();
});

test('offers four answer options and both lifelines', async ({ page }) => {
  await expect(page.locator('.quiz-option')).toHaveCount(4);

  await page.getByRole('button', { name: '50:50' }).click();

  await expect(page.locator('.quiz-option')).toHaveCount(2);
  await expect(page.getByRole('button', { name: '50:50' })).toBeDisabled();

  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.locator('.quiz-hint')).toBeVisible();
});

test('is reachable from the navigation menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Algorithms Quiz' }).click();

  await expect(
    page.getByRole('heading', {
      name: 'Who Wants to Be an Algorithms Ace?',
      level: 1,
    }),
  ).toBeVisible();
});
