import { expect, test } from '@playwright/test';

test('visitor sees a healthy Exile Toolkit shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Exile Toolkit' })
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Service available');
  await expect(
    page.getByRole('button', { name: 'Explore the roadmap' })
  ).toBeVisible();
});

test('visitor sees when the service is unavailable', async ({ page }) => {
  await page.route('**/api/health', async route =>
    route.abort('connectionfailed')
  );

  await page.goto('/');

  await expect(page.getByRole('status')).toContainText('Service unavailable');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Exile Toolkit' })
  ).toBeVisible();
});
