import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function useOriginalSinSnapshot(page: Page) {
  await page.route('**/api/price-snapshots/disenchant*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          activeLeague: 'Allflame',
          source: 'poe.ninja',
          retrievedAt: new Date().toISOString(),
          divineToChaos: 120,
          catalystToChaos: 1.5,
          categories: {
            weapon: [],
            armour: [],
            accessory: [
              {
                id: 'accessory:1:original-sin-amethyst-ring',
                name: 'Original Sin',
                baseType: 'Amethyst Ring',
                category: 'accessory',
                chaosValue: 100,
                listingCount: 8,
                detailsId: 'original-sin-amethyst-ring',
                iconUrl: 'https://web.poecdn.com/original-sin.png'
              }
            ]
          }
        }
      })
    })
  );
}

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
  await expect(search.getByText('Coming later')).toHaveCount(3);
  await expect(
    search.getByText('Scarab expected value').locator('..')
  ).not.toHaveAttribute('href');

  await search.getByRole('searchbox', { name: 'Search Tools' }).fill('regex');
  await search.getByRole('link', { name: /Regex generator/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tools\/regex$/);
});

test('unpriced Disenchant candidates do not render when prices are unavailable', async ({
  page
}) => {
  await page.route('**/api/price-snapshots/disenchant*', route =>
    route.fulfill({ status: 503 })
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Search Tools' }).click();

  const search = page.getByRole('dialog', { name: 'Search Tools' });
  await search
    .getByRole('searchbox', { name: 'Search Tools' })
    .fill('disenchant');
  await search.getByRole('link', { name: 'Disenchant calculator' }).click();

  await expect(page).toHaveURL(/\/tools\/disenchant$/);
  await expect(
    page.getByRole('heading', { name: 'Disenchant calculator' })
  ).toBeVisible();
  const marketInfo = page.getByRole('button', { name: 'Prices unavailable' });
  await expect(marketInfo).toBeVisible();
  await marketInfo.hover();
  await expect(
    page.getByRole('link', { name: 'poe-disenchant-tool Dust mapping' })
  ).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: 'MIT License, Copyright (c) 2025 Mateusz Dionizy'
    })
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('Unpriced', { exact: true })).toHaveCount(0);
  await expect(page.getByText('No candidates match')).toBeVisible();
});

test('player receives an atomic poe.ninja snapshot as a Total Cost ranking', async ({
  page
}) => {
  const retrievedAt = new Date().toISOString();
  await page.route('**/api/price-snapshots/disenchant*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          activeLeague: 'Allflame',
          source: 'poe.ninja',
          retrievedAt,
          divineToChaos: 120,
          categories: {
            weapon: [],
            armour: [],
            accessory: [
              {
                id: 'accessory:1:original-sin-amethyst-ring',
                name: 'Original Sin',
                baseType: 'Amethyst Ring',
                category: 'accessory',
                chaosValue: 100,
                listingCount: 8,
                detailsId: 'original-sin-amethyst-ring',
                iconUrl: 'https://web.poecdn.com/original-sin.png'
              }
            ]
          }
        }
      })
    })
  );

  await page.goto('/tools/disenchant');

  const marketInfo = page.getByRole('button', { name: /poe\.ninja/ });
  await expect(marketInfo).toBeVisible();
  const ranking = page.getByRole('table');
  await expect(ranking.getByText('Original Sin')).toBeVisible();
  const originalSinRow = ranking
    .getByRole('row')
    .filter({ hasText: 'Original Sin' });
  await expect(originalSinRow.getByLabel('100', { exact: true })).toBeVisible();
  await expect(originalSinRow.getByAltText('Chaos Orb').first()).toBeVisible();
  await page.getByRole('button', { name: '1,095 data gaps' }).hover();
  await expect(
    page.getByText('1,095 unpriced and 0 without Dust data.')
  ).toBeVisible();
});

test('stale prices remain ranked, expire after 24 hours, and refresh only on focus', async ({
  page,
  browserName
}) => {
  test.skip(
    browserName !== 'chromium',
    'Snapshot lifecycle is covered in Chromium.'
  );
  let requestCount = 0;
  let expired = false;
  await page.clock.install();
  await page.route('**/api/price-snapshots/disenchant*', route => {
    requestCount += 1;
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          activeLeague: 'Allflame',
          source: 'poe.ninja',
          retrievedAt: new Date(
            Date.now() - (expired ? 25 : 2) * 60 * 60_000
          ).toISOString(),
          divineToChaos: 120,
          categories: { weapon: [], armour: [], accessory: [] }
        }
      })
    });
  });

  await page.goto('/tools/disenchant');
  await page.getByRole('button', { name: /Stale prices/ }).hover();
  await expect(page.getByText('Stale prices', { exact: true })).toBeVisible();
  const staleSummary = page.getByRole('tooltip', {
    name: /Market data - Stale Snapshot/
  });
  await expect(staleSummary).toBeVisible();
  await expect(staleSummary).toHaveClass(/text-amber-200/);
  await expect(
    staleSummary.getByText('Market data - Stale Snapshot')
  ).toBeVisible();
  await expect(staleSummary.locator('svg')).toHaveCount(1);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('Unpriced', { exact: true })).toHaveCount(0);
  await page.waitForTimeout(100);
  const settledRequestCount = requestCount;
  await page.clock.fastForward('02:00:00');
  expect(requestCount).toBe(settledRequestCount);

  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => requestCount).toBe(settledRequestCount + 1);

  expired = true;
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Prices expired' })
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('the browser falls back to its complete snapshot and clear local data removes it', async ({
  page,
  browserName
}) => {
  test.skip(
    browserName !== 'chromium',
    'IndexedDB fallback is covered in Chromium.'
  );
  let available = true;
  await page.route('**/api/price-snapshots/disenchant*', route =>
    available
      ? route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            dustDatasetVersion: '2026.08.25',
            snapshot: {
              activeLeague: 'Allflame',
              source: 'poe.ninja',
              retrievedAt: new Date().toISOString(),
              divineToChaos: 120,
              categories: {
                weapon: [],
                armour: [],
                accessory: [
                  {
                    id: 'accessory:1:original-sin-amethyst-ring',
                    name: 'Original Sin',
                    baseType: 'Amethyst Ring',
                    category: 'accessory',
                    chaosValue: 100,
                    listingCount: 8,
                    detailsId: 'original-sin-amethyst-ring'
                  }
                ]
              }
            }
          })
        })
      : route.fulfill({ status: 503 })
  );

  await page.goto('/tools/disenchant');
  await expect(page.getByRole('table')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean>(resolve => {
            const request = indexedDB.open('exile-toolkit', 1);
            request.onerror = () => resolve(false);
            request.onsuccess = () => {
              const get = request.result
                .transaction('price-snapshots', 'readonly')
                .objectStore('price-snapshots')
                .get('disenchant:v2:Allflame');
              get.onerror = () => resolve(false);
              get.onsuccess = () => resolve(Boolean(get.result));
            };
          })
      )
    )
    .toBe(true);

  available = false;
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original');
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem('exile-toolkit.disenchant-state.v1')
      )
    )
    .not.toBeNull();

  await page.getByRole('button', { name: 'Clear local data' }).click();
  await page
    .getByRole('alertdialog', { name: 'Clear local data' })
    .getByRole('button', { name: 'Confirm clear' })
    .click();
  await page.waitForLoadState('domcontentloaded');
  await expect(
    page.getByRole('button', { name: 'Prices unavailable' })
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem('exile-toolkit.disenchant-state.v1')
    )
  ).toBeNull();
});

test('a failed Disenchant icon preserves the candidate text fallback', async ({
  page
}) => {
  await useOriginalSinSnapshot(page);
  await page.route('https://web.poecdn.com/**', route => route.abort());
  await page.goto('/tools/disenchant');

  const candidates = page.getByRole('table');
  await expect(candidates.getByText('Original Sin')).toBeVisible();
  await expect(
    candidates.getByTestId('candidate-icon-frame').getByText('O').first()
  ).toBeVisible();
  await expect(
    candidates.getByTestId('candidate-icon-frame').locator('img')
  ).toHaveCount(0);
});

test('Disenchant candidates stay usable as compact cards on mobile', async ({
  page
}) => {
  await useOriginalSinSnapshot(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/tools/disenchant');

  const candidates = page.getByRole('list', {
    name: 'Dust per Total Cost ranking'
  });
  await expect(candidates).toBeVisible();
  await expect(candidates.getByText('Original Sin')).toBeVisible();
  await expect(candidates.getByText('(q20)').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('Disenchant browsing has no automatically detectable accessibility violations', async ({
  page
}) => {
  await useOriginalSinSnapshot(page);
  await page.goto('/tools/disenchant');
  await expect(
    page.getByRole('heading', { name: 'Disenchant calculator' })
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
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

  await page.keyboard.press('Control+Shift+3');
  await expect(page).toHaveURL(/\/tools\/disenchant$/);
  await expect(
    page.getByRole('heading', { name: 'Disenchant calculator' })
  ).toBeVisible();
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
