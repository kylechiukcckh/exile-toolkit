import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('player finds available and coming-later Tools from global search', async ({
  page,
  browserName
}) => {
  await page.goto('/');
  if (browserName === 'chromium') {
    await page.keyboard.press('Control+K');
  } else {
    await page.getByRole('button', { name: 'Search Tools' }).click();
  }

  const search = page.getByRole('dialog', { name: 'Search Tools' });
  await expect(search).toBeVisible();
  await expect(
    search.getByRole('link', { name: /Regex generator/ })
  ).toBeVisible();
  await expect(search.getByText('Scarab expected value')).toBeVisible();
  await expect(search.getByText('Coming later')).toHaveCount(4);
  await expect(
    search.getByText('Scarab expected value').locator('..')
  ).not.toHaveAttribute('href');

  await search.getByRole('searchbox', { name: 'Search Tools' }).fill('regex');
  await search.getByRole('link', { name: /Regex generator/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tools\/regex$/);
});

test('documented shortcuts navigate, focus search, and copy the intended Regex part', async ({
  page,
  browserName
}) => {
  test.skip(
    browserName !== 'chromium',
    'Keyboard modifier mapping is covered in Chromium.'
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          Reflect.set(window, '__copiedRegex', text);
          return Promise.resolve();
        }
      }
    });
  });
  await page.goto('/');
  await page.keyboard.press('Control+Shift+2');
  await expect(page).toHaveURL(/\/tools\/regex$/);
  await expect(
    page.getByRole('heading', { name: 'Map regex generator' })
  ).toBeVisible();

  await page.keyboard.press('/');
  await expect(
    page.getByRole('searchbox', { name: 'Search maps' })
  ).toBeFocused();
  await page.keyboard.type('Beach');
  await page.keyboard.press('Control+Shift+2');
  await expect(
    page.getByRole('searchbox', { name: 'Search maps' })
  ).toHaveValue('Beach');

  await page.keyboard.press('Escape');
  await page.getByRole('checkbox', { name: 'Beach Map' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: 'Beach Map' })).toBeChecked();
  await page.getByRole('textbox', { name: 'Regex part 1' }).focus();
  const expected = await page
    .getByRole('textbox', { name: 'Regex part 1' })
    .inputValue();
  await page.keyboard.press('Control+Shift+C');
  await expect(
    page.getByRole('status').filter({ hasText: 'Copied regex part 1' })
  ).toContainText('Copied regex part 1');
  expect(await page.evaluate(() => Reflect.get(window, '__copiedRegex'))).toBe(
    expected
  );

  await page.keyboard.press('Control+Shift+1');
  await expect(page).toHaveURL(/\/$/);
});

test('main public workflow has no automatically detectable accessibility violations', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('maps and map-modifier workflow works in the supported browser', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();
  await expect(
    page.getByRole('textbox', { name: 'Regex part 1' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Map modifiers' }).click();
  await page
    .getByRole('checkbox', { name: 'Players cannot Regenerate Life' })
    .check();
  await expect(page.getByText('1 modifier selected')).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Regex part 1' })
  ).toBeVisible();
});

test('mobile workflow remains operable at the supported narrow viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/tools/regex');
  await page.getByRole('button', { name: 'Search Tools' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Search Tools' })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();

  await expect(
    page.getByRole('textbox', { name: 'Regex part 1' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy part 1' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test('workspace respects the reduced-motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const motionDuration = await page
    .locator('.status-dot')
    .evaluate(element => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(motionDuration)).toBeLessThanOrEqual(0.00001);
});
