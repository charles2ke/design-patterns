import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/quiz/best-practices');
});

test('loads the best practices quiz and shows the first question', async ({ page }) => {
  await expect(
    page.getByRole('heading', {
      name: 'Who Wants to Be a Best Practices Pro?',
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText('Question 1 of 15')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lock answer' })).toBeVisible();
});

test('shows the prize ladder and a running countdown', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Prize Ladder', level: 2 }),
  ).toBeVisible();

  const timer = page.getByRole('timer');
  await expect(timer).toHaveText('30s');
  await expect(timer).toHaveText('28s', { timeout: 5000 });
});

test('is reachable from the navigation menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Best Practices Quiz' }).click();

  await expect(
    page.getByRole('heading', {
      name: 'Who Wants to Be a Best Practices Pro?',
      level: 1,
    }),
  ).toBeVisible();
});
