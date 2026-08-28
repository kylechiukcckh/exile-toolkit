import { expect, test, type Page } from '@playwright/test';

const pricedItems = [
  ['Original Sin', 'Amethyst Ring', 'accessory', 100],
  ['Headhunter', 'Leather Belt', 'accessory', 80],
  ['Mageblood', 'Heavy Belt', 'accessory', 60],
  ['Defiance of Destiny', 'Paua Amulet', 'accessory', 40],
  ['Reefbane', 'Fishing Rod', 'weapon', 20],
  ['Replica Shroud of the Lightless', 'Carnal Armour', 'armour', 10],
  ['Stasis Prison', 'Carnal Armour', 'armour', 8],
  ['The Squire', 'Elegant Round Shield', 'armour', 6],
  ["Rakiata's Dance", 'Engraved Greatsword', 'weapon', 5],
  ["Angler's Plait", 'Unset Ring', 'accessory', 4],
  ['Starforge', 'Infernal Sword', 'weapon', 3],
  ['Voidforge', 'Infernal Sword', 'weapon', 2]
] as const;

async function useCompletePriceSnapshot(page: Page) {
  await page.route('**/api/price-snapshots/disenchant', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          activeLeague: 'Allflame',
          source: 'poe.ninja',
          retrievedAt: new Date().toISOString(),
          divineToChaos: 120,
          categories: {
            weapon: [
              ...pricedItems
                .filter(([, , category]) => category === 'weapon')
                .map(priceLine),
              {
                id: 'weapon:rakiata-precise',
                name: "Rakiata's Dance",
                baseType: 'Engraved Greatsword',
                category: 'weapon',
                variant: 'Precise Technique',
                chaosValue: 4,
                listingCount: 25,
                detailsId: 'rakiata-precise'
              },
              {
                id: 'weapon:rakiata-resolute',
                name: "Rakiata's Dance",
                baseType: 'Engraved Greatsword',
                category: 'weapon',
                variant: 'Resolute Technique',
                chaosValue: 6,
                listingCount: 40,
                detailsId: 'rakiata-resolute'
              }
            ],
            armour: pricedItems
              .filter(([, , category]) => category === 'armour')
              .map(priceLine),
            accessory: [
              ...pricedItems
                .filter(([, , category]) => category === 'accessory')
                .map(priceLine),
              {
                id: 'accessory:missing:dust-gap',
                name: 'Market-only Relic',
                baseType: 'Gold Ring',
                category: 'accessory',
                chaosValue: 1,
                listingCount: 5,
                detailsId: 'dust-gap'
              }
            ]
          }
        }
      })
    })
  );
}

async function openFilters(page: Page) {
  const button = page.getByRole('button', { name: /^Filters/ });
  if ((await button.getAttribute('aria-expanded')) !== 'true') {
    await button.click();
  }
  await expect(
    page.getByRole('heading', { name: 'Filter candidates' })
  ).toBeVisible();
}

function priceLine(
  [name, baseType, category, chaosValue]: (typeof pricedItems)[number],
  index: number
) {
  return {
    id: `${category}:${index}:${name}`,
    name,
    baseType,
    category,
    chaosValue,
    listingCount: 200,
    detailsId: `${category}-${index}`
  };
}

test('player searches the Ranking by unique name without case sensitivity', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  const ranking = page.getByRole('table');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('mAgEbLoOd');

  await expect(ranking.getByText('Mageblood')).toBeVisible();
  await expect(ranking.getByText('Original Sin')).toHaveCount(0);
  await expect(page.getByText('1 matching')).toBeVisible();
});

test('same-item price variants with the same Dust value render once', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill("Rakiata's Dance");

  const row = page.getByRole('table').getByRole('row').filter({
    hasText: "Rakiata's Dance"
  });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('4 c');
  await expect(row).not.toContainText('Technique');
});

test('player combines numeric and category filters and clears each independently', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await openFilters(page);

  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('weapon');
  await page.getByRole('spinbutton', { name: /Maximum Chaos price/ }).fill('5');
  await expect(
    page.getByRole('table').getByText("Rakiata's Dance")
  ).toBeVisible();
  await expect(page.getByRole('table').getByText('Reefbane')).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear category filter' }).click();
  await expect(
    page.getByRole('spinbutton', { name: /Maximum Chaos price/ })
  ).toHaveValue('5');
  await expect(
    page.getByRole('table').getByText("Angler's Plait")
  ).toBeVisible();
  await expect(page.getByRole('table').getByText('Original Sin')).toHaveCount(
    0
  );

  await page
    .getByRole('spinbutton', { name: /Minimum Dust value/ })
    .fill('999999999');
  await expect(
    page.getByRole('heading', { name: 'No candidates match' })
  ).toBeVisible();
  await expect(
    page.getByRole('spinbutton', { name: /Maximum Chaos price/ })
  ).toHaveValue('5');
  await page.getByRole('button', { name: 'Clear Minimum Dust value' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Clear Maximum Chaos price' }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'Maximum Chaos price' })
  ).toHaveValue('');
});

test('player reveals explicit market gaps and sorts every Ranking column both ways', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page.getByLabel('Candidates per page').selectOption('20');
  await openFilters(page);

  await expect(
    page.getByRole('checkbox', { name: 'Show Unpriced (1,084)' })
  ).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Show Dust unavailable (1)' })
  ).toBeVisible();

  await page.getByRole('checkbox', { name: 'Show Unpriced (1,084)' }).click();
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill("Lioneye's Glare");
  await expect(
    page.getByRole('table').getByText("Lioneye's Glare")
  ).toBeVisible();
  await expect(
    page.getByRole('table').getByText('Unpriced').first()
  ).toBeVisible();

  await page.getByRole('button', { name: 'Clear unique search' }).click();
  await page
    .getByRole('checkbox', { name: 'Show Dust unavailable (1)' })
    .click();
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Market-only Relic');
  await expect(
    page.getByRole('table').getByText('Dust unavailable').first()
  ).toBeVisible();

  await page.getByRole('button', { name: 'Clear unique search' }).click();
  await page.getByRole('checkbox', { name: 'Show Unpriced (1,084)' }).click();
  await page
    .getByRole('checkbox', { name: 'Show Dust unavailable (1)' })
    .click();
  await page.getByRole('button', { name: 'Done' }).click();

  for (const column of [
    'Unique',
    'Chaos price',
    'Dust value',
    'Dust / Chaos'
  ]) {
    const sort = page.getByRole('button', { name: `Sort by ${column}` });
    await sort.click();
    await expect(
      page.getByRole('columnheader', { name: new RegExp(column) })
    ).toHaveAttribute('aria-sort', /ascending|descending/);
    const firstDirection = await page
      .getByRole('columnheader', { name: new RegExp(column) })
      .getAttribute('aria-sort');
    await sort.click();
    await expect(
      page.getByRole('columnheader', { name: new RegExp(column) })
    ).toHaveAttribute(
      'aria-sort',
      firstDirection === 'ascending' ? 'descending' : 'ascending'
    );
  }
});

test('page size and table choices persist while page number resets', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  for (const pageSize of ['10', '20', '30', '40', '50']) {
    await page.getByLabel('Candidates per page').selectOption(pageSize);
    await expect(page.getByLabel('Candidates per page')).toHaveValue(pageSize);
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(
      Math.min(Number(pageSize), pricedItems.length)
    );
  }

  await page.getByLabel('Candidates per page').selectOption('10');
  await page.getByRole('button', { name: 'Sort by Unique' }).click();
  await openFilters(page);
  await page.getByRole('checkbox', { name: 'Show Category' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();

  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('forge');
  await openFilters(page);
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('weapon');
  await page.getByRole('spinbutton', { name: 'Maximum Chaos price' }).fill('5');
  await page.getByRole('spinbutton', { name: 'Minimum Dust value' }).fill('1');
  await page.getByRole('checkbox', { name: 'Show Unpriced (1,084)' }).click();
  await page
    .getByRole('checkbox', { name: 'Show Dust unavailable (1)' })
    .click();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await page.reload();

  await expect(page.getByLabel('Candidates per page')).toHaveValue('10');
  await expect(
    page.getByRole('searchbox', { name: 'Search unique items' })
  ).toHaveValue('forge');
  await openFilters(page);
  await expect(
    page.getByRole('combobox', { name: 'Category', exact: true })
  ).toHaveValue('weapon');
  await expect(
    page.getByRole('spinbutton', { name: 'Maximum Chaos price' })
  ).toHaveValue('5');
  await expect(
    page.getByRole('spinbutton', { name: 'Minimum Dust value' })
  ).toHaveValue('1');
  await expect(
    page.getByRole('checkbox', { name: 'Show Unpriced (1,084)' })
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Show Dust unavailable (1)' })
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Show Category' })
  ).not.toBeChecked();
  await expect(
    page.getByRole('columnheader', { name: /Unique/ })
  ).toHaveAttribute('aria-sort', /ascending|descending/);
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await expect(page).not.toHaveURL(/[?&](filter|search|state)=/);
  await expect(
    page.getByRole('button', { name: /Saved calculation/i })
  ).toHaveCount(0);
});

test('malformed saved table state resets safely and desktop and mobile share order', async ({
  page
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('exile-toolkit.disenchant-state.v1', '{bad json')
  );
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  await expect(
    page.getByRole('status').filter({
      hasText: 'Saved Disenchant table settings were reset.'
    })
  ).toBeVisible();
  await expect(page.getByLabel('Candidates per page')).toHaveValue('10');
  const desktopFirst = await page
    .getByRole('table')
    .locator('tbody tr')
    .first()
    .innerText();

  await page.setViewportSize({ width: 320, height: 720 });
  const mobileFirst = await page
    .getByRole('list', { name: 'Dust per Chaos ranking' })
    .getByRole('listitem')
    .first()
    .innerText();
  expect(mobileFirst).toContain(desktopFirst.split('\n')[0]);

  await openFilters(page);
  await page.getByRole('combobox', { name: 'Sort by' }).selectOption('name');
  await page
    .getByRole('combobox', { name: 'Sort direction' })
    .selectOption('ascending');
  await expect(
    page
      .getByRole('list', { name: 'Dust per Chaos ranking' })
      .getByRole('listitem')
      .first()
  ).toContainText("Angler's Plait");

  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('weapon');
  await expect(
    page
      .getByRole('list', { name: 'Dust per Chaos ranking' })
      .getByRole('listitem')
      .first()
  ).toContainText("Rakiata's Dance");

  await page.getByRole('checkbox', { name: 'Show Dust / Chaos' }).click();
  await expect(
    page
      .getByRole('list', { name: 'Dust per Chaos ranking' })
      .getByText('Dust / Chaos')
  ).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('all');
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test('a saved price filter does not hide the Dataset when prices become unavailable', async ({
  page
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'exile-toolkit.disenchant-state.v1',
      JSON.stringify({
        version: 1,
        rankingMode: 'dust-per-chaos',
        search: '',
        category: 'all',
        maxChaosPrice: 1,
        showUnpriced: false,
        showDustUnavailable: false,
        sorting: [{ id: 'dustPerChaos', desc: true }],
        columnVisibility: {},
        pageSize: 10
      })
    )
  );
  await page.route('**/api/price-snapshots/disenchant', route =>
    route.fulfill({ status: 503 })
  );
  await page.goto('/tools/disenchant');

  await expect(page.getByRole('table').getByText('Original Sin')).toBeVisible();
  await expect(page.getByText('1,096 matching')).toBeVisible();
  await openFilters(page);
  await expect(
    page.getByRole('spinbutton', { name: 'Maximum Chaos price' })
  ).toBeDisabled();
  await expect(
    page.getByRole('columnheader', { name: 'Assumption' })
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Market state' })
  ).toBeVisible();
});

for (const [savedStateName, savedState] of [
  [
    'outdated',
    {
      version: 2,
      rankingMode: 'dust-per-chaos',
      search: '',
      category: 'all',
      showUnpriced: false,
      showDustUnavailable: false,
      sorting: [{ id: 'dustPerChaos', desc: true }],
      columnVisibility: {},
      pageSize: 10
    }
  ],
  [
    'schema-invalid',
    {
      version: 1,
      rankingMode: 'dust-per-chaos',
      search: '',
      category: 'currency',
      showUnpriced: false,
      showDustUnavailable: false,
      sorting: [{ id: 'not-a-column', desc: true }],
      columnVisibility: {},
      pageSize: 75
    }
  ]
] as const) {
  test(`${savedStateName} saved table state resets safely`, async ({
    page
  }) => {
    await page.addInitScript(
      ({ state }) =>
        localStorage.setItem(
          'exile-toolkit.disenchant-state.v1',
          JSON.stringify(state)
        ),
      { state: savedState }
    );
    await useCompletePriceSnapshot(page);
    await page.goto('/tools/disenchant');

    await expect(
      page.getByRole('status').filter({
        hasText: 'Saved Disenchant table settings were reset.'
      })
    ).toBeVisible();
    await expect(page.getByLabel('Candidates per page')).toHaveValue('10');
  });
}
