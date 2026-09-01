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

test('visitor can select the light theme from the header', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('combobox', { name: 'Theme: Dark' }).click();
  await page.getByRole('option', { name: 'Light' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    'rgb(250, 250, 249)'
  );
  await expect(
    page.getByRole('heading', {
      name: 'One workspace, six focused workflows'
    })
  ).toHaveCSS('color', 'rgb(41, 37, 36)');
  await expect(page.getByRole('combobox', { name: 'Theme: Light' })).toHaveCSS(
    'border-top-width',
    '0px'
  );
  await expect(
    page.getByRole('combobox', { name: 'Theme: Light' })
  ).not.toHaveCSS('box-shadow', / 2px/);

  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Theme: Light' })
  ).toBeVisible();
});

test('visitor can collapse and expand the desktop navigation', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const navigation = page.getByLabel('Desktop navigation');
  await expect(
    page.locator('header').getByRole('button', { name: 'Collapse navigation' })
  ).toBeVisible();
  const expandedWidth = await navigation.evaluate(
    element => element.getBoundingClientRect().width
  );

  await page.getByRole('button', { name: 'Collapse navigation' }).click();
  await expect(
    page.getByRole('button', { name: 'Expand navigation' })
  ).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(() =>
      navigation.evaluate(element => element.getBoundingClientRect().width)
    )
    .toBeLessThan(expandedWidth);

  await page.getByRole('button', { name: 'Expand navigation' }).click();
  await expect(
    page.getByRole('button', { name: 'Collapse navigation' })
  ).toHaveAttribute('aria-expanded', 'true');
});

test('desktop navigation stays fixed while the page scrolls', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');

  const brand = page
    .getByLabel('Desktop navigation')
    .getByRole('link', { name: 'Exile Toolkit home' });
  const initialTop = await brand.evaluate(
    element => element.getBoundingClientRect().top
  );

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() => brand.evaluate(element => element.getBoundingClientRect().top))
    .toBe(initialTop);
});

test('tool pages do not reuse the home page ambient glow', async ({ page }) => {
  await page.goto('/tools/disenchant');

  await expect(page.locator('.ambient-glow')).toHaveCount(0);
});
