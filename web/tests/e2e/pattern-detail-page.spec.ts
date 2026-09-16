import { expect, test } from '@playwright/test';

test('opening a pattern shows its deep dive and code examples', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Open Observer details' }).click();

  await expect(page).toHaveURL(/#\/patterns\/observer$/);
  await expect(
    page.getByRole('heading', { name: 'Observer', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Participants' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Common pitfalls' }),
  ).toBeVisible();

  await expect(page.getByRole('tabpanel')).toContainText('public class Subject');
  await page.getByRole('tab', { name: 'Python' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('def set_state');
});

test('related pattern links navigate between detail pages', async ({
  page,
}) => {
  await page.goto('/#/patterns/observer');

  await page.getByRole('link', { name: 'Mediator' }).click();

  await expect(page).toHaveURL(/#\/patterns\/mediator$/);
  await expect(
    page.getByRole('heading', { name: 'Mediator', level: 1 }),
  ).toBeVisible();
});

test('unknown pattern slugs show a not-found message', async ({ page }) => {
  await page.goto('/#/patterns/not-a-pattern');

  await expect(
    page.getByRole('heading', { name: 'Pattern not found', level: 1 }),
  ).toBeVisible();
});
