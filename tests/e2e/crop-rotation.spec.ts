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

  await expect(page.getByText('YY', { exact: true })).toHaveCount(0);
  await expect(page.getByText('BB', { exact: true })).toHaveCount(0);
  const marketData = page.getByRole('button', { name: /poe\.ninja/i });
  await expect(marketData).toBeVisible();
  await marketData.hover();
  await expect(
    page.getByRole('tooltip').filter({ hasText: 'Market data' })
  ).toContainText('Allflame league');

  const yellowPurple = page.getByRole('button', {
    name: 'Add Yellow and Purple Crop pair'
  });
  await yellowPurple.focus();
  await expect(
    page.getByRole('tooltip', { name: 'Add Yellow and Purple Crop pair' })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Advanced' }).click();
  await expect(page.getByText('Cropbot reference setup.')).toBeVisible();
  await page.keyboard.press('Escape');

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

  const rotationSteps = page.getByTestId('rotation-step');
  const initialPath = await rotationSteps.evaluateAll(steps =>
    steps.map(step => ({
      id: (step as HTMLElement).dataset.stepId,
      label: step.getAttribute('aria-label')
    }))
  );
  const initialChaos = await page
    .getByRole('group', { name: 'Expected Chaos value' })
    .locator('dd')
    .textContent();
  const outcomes = page.getByRole('checkbox', { name: 'Did not wither' });
  await expect(outcomes).toHaveCount(3);
  await outcomes.nth(1).check();
  await expect(page.getByText('Surviving crop')).toBeVisible();
  await expect(rotationSteps).toHaveCount(4);
  await expect(outcomes.nth(1)).toBeChecked();
  const laterBranchPath = await rotationSteps.evaluateAll(steps =>
    steps.map(step => ({
      id: (step as HTMLElement).dataset.stepId,
      label: step.getAttribute('aria-label')
    }))
  );
  expect(laterBranchPath.slice(0, 2)).toEqual(initialPath.slice(0, 2));
  expect(laterBranchPath.slice(2)).not.toEqual(initialPath.slice(2));
  await expect(
    page.getByRole('group', { name: 'Expected Chaos value' }).locator('dd')
  ).not.toHaveText(initialChaos!);

  await outcomes.nth(0).check();
  await expect(rotationSteps).toHaveCount(4);
  await expect(outcomes.nth(0)).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Did not wither' })
  ).toHaveCount(3);
  await expect(
    page.getByRole('checkbox', { name: 'Did not wither' }).nth(1)
  ).not.toBeChecked();
  const earlierBranchPath = await rotationSteps.evaluateAll(steps =>
    steps.map(step => ({
      id: (step as HTMLElement).dataset.stepId,
      label: step.getAttribute('aria-label')
    }))
  );
  expect(earlierBranchPath[0]).toEqual(initialPath[0]);
  expect(earlierBranchPath.slice(1)).not.toEqual(laterBranchPath.slice(1));
});

test('setup persists while calculations stay temporary and require explicit recalculation', async ({
  page
}) => {
  await page.route('**/api/price-snapshots/economy*', route => {
    const league =
      new URL(route.request().url()).searchParams.get('league') ?? 'Allflame';
    const lifeforcePrices =
      league === 'Standard'
        ? {
            ...economyPriceSnapshotFields.lifeforcePrices,
            purple: { chaosPerLifeforce: 0.08 }
          }
        : economyPriceSnapshotFields.lifeforcePrices;
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          ...economyPriceSnapshotFields,
          lifeforcePrices,
          activeLeague: league,
          source: 'poe.ninja',
          retrievedAt: new Date().toISOString(),
          divineToChaos: 120,
          categories: { weapon: [], armour: [], accessory: [] }
        }
      })
    });
  });
  await page.goto('/tools/crop-rotation');

  for (const name of [
    'Add Yellow and Yellow Crop pair',
    'Add Yellow and Purple Crop pair',
    'Add Blue and Purple Crop pair',
    'Add Yellow and Blue Crop pair'
  ]) {
    await page.getByRole('button', { name }).click();
  }
  await page.getByRole('button', { name: 'Advanced' }).click();
  await page.getByLabel('Map pack size').fill('70');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Did not wither' }).first().check();

  await page
    .getByRole('button', { name: 'Add Purple and Purple Crop pair' })
    .click();
  await expect(page.getByText(/calculation is outdated/i)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Rotation path' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Recalculate', exact: true })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Recalculate', exact: true }).click();
  await expect(page.getByText(/all unchosen crops wither/i)).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Did not wither' }).first()
  ).not.toBeChecked();

  await page.getByLabel('Active league').selectOption('Standard');
  await expect(page.getByText(/calculation is outdated/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Recalculate', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Recalculate', exact: true }).click();

  await page.getByRole('button', { name: 'Advanced' }).click();
  await page.getByLabel('Map pack size').fill('71');
  await page.keyboard.press('Escape');
  await expect(page.getByText(/calculation is outdated/i)).toBeVisible();
  await page.getByRole('button', { name: 'Reset calculation' }).click();
  await expect(page.getByText('0 of 5 Crop pairs')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Awaiting calculation' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Advanced' }).click();
  await expect(page.getByLabel('Map pack size')).toHaveValue('71');
  await page.keyboard.press('Escape');

  await page
    .getByRole('button', { name: 'Add Yellow and Purple Crop pair' })
    .click();
  await page.getByRole('button', { name: 'Advanced' }).click();
  await page.getByRole('button', { name: 'Restore reference setup' }).click();
  await expect(page.getByLabel('Map pack size')).toHaveValue('65');
  await page.keyboard.press('Escape');
  await expect(page.getByText('1 of 5 Crop pairs')).toBeVisible();

  await page.reload();
  await expect(page.getByText('1 of 5 Crop pairs')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Awaiting calculation' })
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Did not wither' })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Advanced' }).click();
  await expect(page.getByLabel('Map pack size')).toHaveValue('65');
});

test('Crop Rotation persistence resumes after clearing local data', async ({
  page
}) => {
  await page.goto('/tools/crop-rotation');
  await page
    .getByRole('button', { name: 'Add Yellow and Purple Crop pair' })
    .click();
  await page.getByRole('button', { name: 'Clear local data' }).click();
  await page
    .getByRole('alertdialog', { name: 'Clear local data' })
    .getByRole('button', { name: 'Confirm clear' })
    .click();
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByText('0 of 5 Crop pairs')).toBeVisible();
  await page
    .getByRole('button', { name: 'Add Yellow and Purple Crop pair' })
    .click();
  await page.reload();
  await expect(page.getByText('1 of 5 Crop pairs')).toBeVisible();
});

test('invalid persisted Crop Rotation state falls back safely', async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('exile-toolkit.crop-rotation-state.v1', '{bad json');
  });
  await page.goto('/tools/crop-rotation');

  await expect(page.getByText('0 of 5 Crop pairs')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Calculate', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Advanced' }).click();
  await expect(page.getByLabel('Map pack size')).toHaveValue('65');
});
