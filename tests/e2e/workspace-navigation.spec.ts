import { expect, test } from '@playwright/test';

const trustPages = [
  ['About', '/about', 'guest-first workspace'],
  ['Data Sources', '/data-sources', 'A missing price is unknown'],
  ['Privacy', '/privacy', 'Pasted content will not be retained'],
  ['License Notices', '/licenses', 'not treated as permission to copy'],
  [
    'Non-affiliation',
    '/non-affiliation',
    'not affiliated with or endorsed by Grinding Gear Games'
  ]
] as const;

test('visitor navigates the workspace and public trust pages', async ({
  page
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('banner').getByRole('combobox', { name: 'Active league' })
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Service available');

  for (const tool of [
    'Cluster jewel tool',
    'Scarab expected value',
    'Warrant price checker'
  ]) {
    const card = page.getByRole('article', { name: tool });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Coming later');
    await expect(card.getByRole('button')).toHaveCount(0);
  }

  const regexTool = page.getByRole('article', { name: 'Regex generator' });
  await expect(regexTool).toContainText('Available');
  await expect(
    regexTool.getByRole('link', { name: 'Open regex generator' })
  ).toHaveAttribute('href', '/tools/regex');

  const disenchantTool = page.getByRole('article', {
    name: 'Disenchant calculator'
  });
  await expect(disenchantTool).toContainText('Available');
  await expect(
    disenchantTool.getByRole('link', { name: 'Open Disenchant calculator' })
  ).toHaveAttribute('href', '/tools/disenchant');

  for (const [pageName, path, trustStatement] of trustPages) {
    await page.getByRole('link', { name: pageName, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole('heading', { level: 1, name: pageName })
    ).toBeVisible();
    await expect(
      page.getByText(trustStatement, { exact: false })
    ).toBeVisible();
  }

  await expect(
    page.getByRole('banner').getByRole('combobox', { name: 'Active league' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'Workspace home' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('visitor opens the workspace navigation on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(
    page.getByRole('navigation', { name: 'Workspace' })
  ).toBeHidden();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Workspace' })
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('navigation', { name: 'Workspace' })
  ).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Open navigation' })
  ).toBeFocused();

  await page.getByRole('button', { name: 'Open navigation' }).click();

  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole('navigation', { name: 'Workspace' })
  ).toBeHidden();
});
