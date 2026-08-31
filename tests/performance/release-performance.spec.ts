import { expect, test } from '@playwright/test';
import { economyPriceSnapshotResponse } from '../e2e/fixtures/economy-price-snapshot';

test('production build meets shell, regex, and Disenchant timing budgets', async ({
  page,
  context
}) => {
  const browserSession = await context.newCDPSession(page);
  await browserSession.send('Network.enable');
  await browserSession.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: 1_250_000,
    uploadThroughput: 625_000
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Exile Toolkit' })
  ).toBeVisible();
  expect(await page.evaluate(() => performance.now())).toBeLessThan(2_000);

  await page
    .getByRole('link', { name: 'Regex generator', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Map regex generator' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'Workspace home' }).click();
  const switchStarted = Date.now();
  await page
    .getByRole('link', { name: 'Regex generator', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Map regex generator' })
  ).toBeVisible();
  expect(Date.now() - switchStarted).toBeLessThan(250);

  const calculationMs = await page.evaluate(async () => {
    const checkbox = document.querySelector<HTMLElement>('[role="checkbox"]');
    if (!checkbox) throw new Error('Map checkbox unavailable');
    const started = performance.now();
    checkbox.click();
    while (!document.querySelector<HTMLInputElement>('[data-regex-part]')) {
      await new Promise(requestAnimationFrame);
    }
    return performance.now() - started;
  });
  expect(calculationMs).toBeLessThan(100);

  await page.route('**/api/price-snapshots/economy*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        economyPriceSnapshotResponse({
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
        })
      )
    })
  );
  await page.goto('/tools/disenchant');
  await expect(
    page.getByRole('row').filter({ hasText: 'Original Sin' })
  ).toBeVisible();
  const rankingMs = await page.evaluate(async () => {
    const input =
      document.querySelector<HTMLInputElement>('#disenchant-search');
    if (!input) throw new Error('Disenchant search unavailable');
    const started = performance.now();
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    valueSetter?.call(input, 'No such item');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    while (!document.body.textContent?.includes('No candidates match')) {
      await new Promise(requestAnimationFrame);
    }
    return performance.now() - started;
  });
  expect(rankingMs).toBeLessThan(100);
});

test('five-pair Crop Rotation calculation and branch replacement stay under budget', async ({
  page
}) => {
  await page.route('**/api/price-snapshots/economy*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(economyPriceSnapshotResponse())
    })
  );
  await page.goto('/tools/crop-rotation');

  for (const name of [
    'Add Yellow and Yellow Crop pair',
    'Add Yellow and Blue Crop pair',
    'Add Yellow and Purple Crop pair',
    'Add Blue and Blue Crop pair',
    'Add Blue and Purple Crop pair'
  ]) {
    await page.getByRole('button', { name }).click();
  }

  const calculationMs = await page.evaluate(async () => {
    const calculate = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Calculate'
    );
    if (!calculate) throw new Error('Calculate action unavailable');
    const started = performance.now();
    calculate.click();
    while (
      document.querySelectorAll('[data-testid="rotation-step"]').length !== 5
    ) {
      await new Promise(requestAnimationFrame);
    }
    return performance.now() - started;
  });
  expect(calculationMs).toBeLessThan(100);

  const branchReplacementMs = await page.evaluate(async () => {
    const outcome = document.querySelector<HTMLInputElement>(
      'input[aria-label$="Did not wither"]'
    );
    if (!outcome) throw new Error('Wither outcome unavailable');
    const started = performance.now();
    outcome.click();
    while (
      document.querySelectorAll('[data-testid="rotation-step"]').length !== 6
    ) {
      await new Promise(requestAnimationFrame);
    }
    return performance.now() - started;
  });
  expect(branchReplacementMs).toBeLessThan(100);
});
