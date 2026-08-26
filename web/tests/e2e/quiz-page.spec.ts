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
  await expect(page.getByText('Question 1 of 15')).toBeVisible();
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
  await page.getByRole('button', { name: /builder/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /adapter/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /observer/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /facade/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /prototype/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /bridge/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /proxy/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /flyweight/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /template method/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
  await page.getByRole('button', { name: /visitor/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();

  await expect(
    page.getByRole('heading', { name: 'You won the top prize!', level: 2 }),
  ).toBeVisible();
  await expect(page.getByText('You leave with $1,000,000.')).toBeVisible();
  await expect(page.getByText('Congratulations, Pattern Architect!')).toBeVisible();
  await expect(page.locator('.quiz-celebration__piece').first()).toBeVisible();
});

test('shows game over on a wrong answer and supports restart', async ({ page }) => {  await page.getByRole('button', { name: /builder/i }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();

  await expect(page.getByRole('heading', { name: 'Game over!', level: 2 })).toBeVisible();
  await expect(page.getByText('You leave with $0.')).toBeVisible();

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText('Question 1 of 15')).toBeVisible();
});

test('50:50 lifeline removes two wrong answers and can only be used once', async ({ page }) => {
  await page.getByRole('button', { name: '50:50' }).click();

  await expect(page.getByRole('button', { name: /singleton/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /mediator/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /builder/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /decorator/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '50:50' })).toBeDisabled();
});

test('hint lifeline reveals a hint once per game', async ({ page }) => {
  await page.getByRole('button', { name: 'Hint' }).click();

  await expect(page.getByText(/guards its own single instance/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hint' })).toBeDisabled();

  await page.getByRole('button', { name: 'Lock answer' }).click();
  await expect(page.getByText('Question 2 of 15')).toBeVisible();
  await expect(page.getByText(/guards its own single instance/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hint' })).toBeDisabled();
});
