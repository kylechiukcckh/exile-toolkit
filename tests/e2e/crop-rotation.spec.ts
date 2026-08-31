import { expect, test } from '@playwright/test';
import { economyPriceSnapshotFields } from './fixtures/economy-price-snapshot';

test('player enters duplicate Crop pairs and calculates an all-wither Rotation path', async ({
  page
}) => {
  await page.route('**/api/price-snapshots/economy*', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          ...economyPriceSnapshotFields,
          activeLeague: 'Allflame',
          source: 'poe.ninja',
          retrievedAt: new Date().toISOString(),
          divineToChaos: 120,
          categories: { weapon: [], armour: [], accessory: [] }
        }
      })
    })
  );
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Crop Rotation calculator', exact: true })
    .click();

  const calculate = page.getByRole('button', { name: 'Calculate' });
  await expect(calculate).toBeDisabled();
  await page
    .getByRole('button', { name: 'Add Yellow and Blue Crop pair' })
    .click();
  await page
    .getByRole('button', { name: 'Add Yellow and Blue Crop pair' })
    .click();
  await page
    .getByRole('button', { name: 'Add Blue and Purple Crop pair' })
    .click();

  await expect(page.getByText('3 of 5 Crop pairs')).toBeVisible();
  await expect(calculate).toBeEnabled();
  await expect(
    page.getByRole('heading', { name: 'Rotation path' })
  ).toHaveCount(0);
  await calculate.click();

  await expect(
    page.getByRole('heading', { name: 'Rotation path' })
  ).toBeVisible();
  await expect(page.getByTestId('rotation-step')).toHaveCount(3);
  await expect(page.getByText('Expected Chaos value')).toBeVisible();
  const yellowLifeforce = page.getByRole('group', {
    name: 'Expected Yellow Lifeforce'
  });
  await expect(yellowLifeforce).toBeVisible();
  await expect(
    yellowLifeforce.getByRole('img', { name: 'Yellow Lifeforce' })
  ).toHaveAttribute('src', /web\.poecdn\.com/);
  await expect(
    page.getByText(/visible seed counts and tiers are not modeled/i)
  ).toBeVisible();
  await expect(page.getByText(/all unchosen crops wither/i)).toBeVisible();
});
