import { expect, test, type Page } from '@playwright/test';

const ANSWER_BY_PROMPT_FRAGMENT: [RegExp, RegExp][] = [
  [/ensures only one object instance exists/i, /singleton/i],
  [/wraps an object to add behavior dynamically/i, /decorator/i],
  [/multiple handlers process a request in sequence/i, /chain of responsibility/i],
  [/interchangeable algorithms selected at runtime/i, /strategy/i],
  [/captures and restores object state/i, /memento/i],
  [/separates the construction of a complex object/i, /builder/i],
  [/converts the interface of a class/i, /adapter/i],
  [/notifies dependent objects automatically/i, /observer/i],
  [/simplified entry point to a complex subsystem/i, /facade/i],
  [/cloning an existing instance/i, /prototype/i],
  [/decouples an abstraction from its implementation/i, /bridge/i],
  [/placeholder that controls access/i, /proxy/i],
  [/sharing intrinsic state across many similar objects/i, /flyweight/i],
  [/algorithm skeleton in a base class/i, /template method/i],
  [/adds new operations to an object structure/i, /visitor/i],
];

async function correctAnswerPattern(page: Page): Promise<RegExp> {
  const prompt = (await page.locator('.quiz-card__question').textContent()) ?? '';
  const match = ANSWER_BY_PROMPT_FRAGMENT.find(([fragment]) => fragment.test(prompt));
  if (!match) {
    throw new Error(`No known answer for prompt: ${prompt}`);
  }
  return match[1];
}

async function answerCurrentQuestionCorrectly(page: Page) {
  await page.getByRole('button', { name: await correctAnswerPattern(page) }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
}

async function answerCurrentQuestionWrongly(page: Page) {
  const correct = await correctAnswerPattern(page);
  const labels = await page
    .locator('.quiz-option span:not(.quiz-option__letter)')
    .allTextContents();
  const wrong = labels.find((label) => !correct.test(label));
  if (!wrong) {
    throw new Error('No wrong answer available');
  }
  await page.locator('.quiz-option').filter({ hasText: wrong }).click();
  await page.getByRole('button', { name: 'Lock answer' }).click();
}

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
  for (let index = 0; index < ANSWER_BY_PROMPT_FRAGMENT.length; index += 1) {
    await answerCurrentQuestionCorrectly(page);
  }

  await expect(
    page.getByRole('heading', { name: 'You won the top prize!', level: 2 }),
  ).toBeVisible();
  await expect(page.getByText('You leave with $1,000,000.')).toBeVisible();
  await expect(page.getByText('Congratulations, Pattern Architect!')).toBeVisible();
  await expect(page.locator('.quiz-celebration__piece').first()).toBeVisible();
});

test('shows game over on a wrong answer and supports restart', async ({ page }) => {
  await answerCurrentQuestionWrongly(page);

  await expect(page.getByRole('heading', { name: 'Game over!', level: 2 })).toBeVisible();
  await expect(page.getByText('You leave with $0.')).toBeVisible();

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText('Question 1 of 15')).toBeVisible();
});

test('50:50 lifeline removes two wrong answers and can only be used once', async ({
  page,
}) => {
  const correct = await correctAnswerPattern(page);

  await page.getByRole('button', { name: '50:50' }).click();

  await expect(page.locator('.quiz-option')).toHaveCount(2);
  await expect(page.getByRole('button', { name: correct })).toBeVisible();
  await expect(page.getByRole('button', { name: '50:50' })).toBeDisabled();
});

test('hint lifeline reveals a hint once per game', async ({ page }) => {
  await page.getByRole('button', { name: 'Hint' }).click();

  const hint = page.locator('.quiz-hint');
  await expect(hint).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hint' })).toBeDisabled();

  await answerCurrentQuestionCorrectly(page);
  await expect(page.getByText('Question 2 of 15')).toBeVisible();
  await expect(hint).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hint' })).toBeDisabled();
});

test('shuffles the question order between games', async ({ page }) => {
  const prompts = new Set<string>();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    prompts.add((await page.locator('.quiz-card__question').textContent()) ?? '');
    await answerCurrentQuestionWrongly(page);
    await page.getByRole('button', { name: 'Play again' }).click();
  }

  expect(prompts.size).toBeGreaterThan(1);
});

test('shows an animated 30 second countdown that restarts per question', async ({
  page,
}) => {
  const timer = page.getByRole('timer');

  await expect(timer).toHaveText('30s');
  await expect(page.locator('.quiz-timer__clock')).toBeVisible();
  await expect(timer).toHaveText('28s', { timeout: 5000 });

  await answerCurrentQuestionCorrectly(page);

  await expect(page.getByText('Question 2 of 15')).toBeVisible();
  await expect(timer).toHaveText('30s');
});
