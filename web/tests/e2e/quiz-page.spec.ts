import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/quiz');
});

test('loads the quiz and shows the first question', async ({ page }) => {
  await expect(
    page.getByRole('heading', {
      name: 'Who Wants to Be a Pattern Architect?',
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText('Question 1 of 5')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lock answer' })).toBeVisible();
});

test('can win the top prize by answering all questions correctly', async ({ page }) => {
  await page.getByRole('button', { name: /singleton/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /decorator/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /chain of responsibility/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /strategy/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /memento/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();

  await expect(
    page.getByRole('heading', { name: 'You won the top prize!', level: 2 }),
  ).toBeVisible();
  await expect(page.getByText('You leave with $10,000.')).toBeVisible();
});

test('shows game over on a wrong answer and supports restart', async ({ page }) => {
  await page.getByRole('button', { name: /builder/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();

  await expect(page.getByRole('heading', { name: 'Game over!', level: 2 })).toBeVisible();
  await expect(page.getByText('You leave with $0.')).toBeVisible();

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText('Question 1 of 5')).toBeVisible();
});
