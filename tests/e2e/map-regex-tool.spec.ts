import { expect, test } from '@playwright/test';

test('player searches maps and updates the Generated regex and Match preview', async ({
  page
}) => {
  await page.goto('/tools/regex');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Map regex generator' })
  ).toBeVisible();
  await expect(page.getByText('Dataset 2026.08.25')).toBeVisible();
  await expect(page.getByText('Select at least one map')).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Search maps' });
  await search.fill('dunes');
  await expect(page.getByRole('checkbox', { name: 'Dunes Map' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Beach Map' })).toBeHidden();

  await page.getByRole('checkbox', { name: 'Dunes Map' }).check();
  await expect(page.getByText('1 map selected')).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Generated regex' })
  ).toHaveValue('^(?:Dunes Map)$');

  const matched = page.getByRole('region', {
    name: 'Matched maps',
    exact: true
  });
  const unmatched = page.getByRole('region', {
    name: 'Unmatched maps',
    exact: true
  });
  await expect(matched).toContainText('Dunes Map');
  await expect(unmatched).toContainText('Beach Map');

  await search.fill('');
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();
  await expect(page.getByText('2 maps selected')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Dunes Map' }).uncheck();

  await expect(page.getByText('1 map selected')).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Generated regex' })
  ).toHaveValue('^(?:Beach Map)$');
  await expect(matched).toContainText('Beach Map');
  await expect(matched).not.toContainText('Dunes Map');
});

test('player sees guidance when map search has no results', async ({
  page
}) => {
  await page.goto('/tools/regex');

  await page.getByRole('searchbox', { name: 'Search maps' }).fill('not a map');
  await expect(page.getByText('No maps match this search.')).toBeVisible();
});

test('player switches categories and selects only visible modifier groups', async ({
  page
}) => {
  await page.goto('/tools/regex');

  await page.getByRole('checkbox', { name: 'Beach Map' }).check();
  await page.getByRole('button', { name: 'Map modifiers' }).click();

  await expect(page.getByText('0 modifiers selected')).toBeVisible();
  await expect(
    page.getByText('Map modifiers / Dataset 2026.08.25')
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Ground effects' })
  ).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Search modifiers' });
  await search.fill('ground');
  await expect(
    page.getByRole('checkbox', { name: 'Area has patches of Burning Ground' })
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Monsters cannot be Stunned' })
  ).toBeHidden();

  await page
    .getByRole('button', { name: 'Select visible Ground effects' })
    .click();
  await expect(page.getByText('3 modifiers selected')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Matched modifiers', exact: true })
  ).toContainText('Area has patches of Chilled Ground');
  await expect(
    page.getByRole('textbox', { name: 'Generated regex' })
  ).toHaveValue(
    '^(?:Area has patches of Burning Ground|Area has patches of Chilled Ground|Area has patches of desecrated ground)$'
  );

  await search.fill('burning');
  await page
    .getByRole('button', { name: 'Clear visible Ground effects' })
    .click();
  await expect(page.getByText('2 modifiers selected')).toBeVisible();

  await page.getByRole('button', { name: 'Maps', exact: true }).click();
  await expect(page.getByText('1 map selected')).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Generated regex' })
  ).toHaveValue('^(?:Beach Map)$');
});
