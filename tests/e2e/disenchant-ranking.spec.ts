import { expect, test, type Locator, type Page } from '@playwright/test';
import { disenchantDataset } from '../../packages/data/src/disenchant-dataset';

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

const pricedItemOverrides = new Map(
  pricedItems.map(item => [item[0], item] as const)
);

const completePriceLines = disenchantDataset.entries.flatMap(
  (candidate, index) => {
    if (candidate.name === "Lioneye's Glare") return [];
    const override = pricedItemOverrides.get(candidate.name);
    if (override) return [priceLine(override, index)];
    const chaosValue = (index % 200) + 1;
    return [
      {
        id: `${candidate.category}:${index}:${candidate.id}`,
        name: candidate.name,
        baseType: candidate.baseType,
        category: candidate.category,
        chaosValue,
        divineValue: chaosValue / 120,
        listingCount: 200,
        detailsId: candidate.id
      }
    ];
  }
);

async function useCompletePriceSnapshot(page: Page) {
  await page.route('**/api/price-snapshots/disenchant*', route => {
    const activeLeague =
      new URL(route.request().url()).searchParams.get('league') ?? 'Allflame';
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        dustDatasetVersion: '2026.08.25',
        snapshot: {
          activeLeague,
          source: 'poe.ninja',
          retrievedAt: new Date().toISOString(),
          divineToChaos: 120,
          catalystToChaos: 1.5,
          categories: {
            weapon: [
              ...completePriceLines.filter(
                ({ category }) => category === 'weapon'
              ),
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
            armour: completePriceLines.filter(
              ({ category }) => category === 'armour'
            ),
            accessory: [
              ...completePriceLines.filter(
                ({ category }) => category === 'accessory'
              ),
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
    });
  });
}

async function openFilters(page: Page) {
  const button = page.getByRole('button', { name: /^Filters/ });
  if ((await button.getAttribute('aria-expanded')) !== 'true') {
    await button.click();
  }
  await expect(
    page.getByRole('heading', { name: 'Apply Filter' })
  ).toBeVisible();
}

async function setSliderValue(
  page: Page,
  name: string | RegExp,
  value: number,
  step = 1
) {
  const slider = page.getByRole('slider', { name });
  const minimum = Number(await slider.getAttribute('aria-valuemin'));
  const maximum = Number(await slider.getAttribute('aria-valuemax'));
  const clamped = Math.min(maximum, Math.max(minimum, value));
  await slider.focus();
  await slider.press('Home');
  const presses = Math.round((clamped - minimum) / step);
  for (let index = 0; index < presses; index += 1) {
    await slider.press('ArrowRight');
  }
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
    divineValue: name === 'Original Sin' ? 0.9 : chaosValue / 120,
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
  await expect(page.getByText(/matching$/)).toHaveCount(0);
});

test('variants with identical Dust and Trade data render once', async ({
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
  await expect(row.getByLabel('4', { exact: true })).toBeVisible();
  await expect(row).not.toContainText('Technique');
});

test('table toolbar follows the compact search, Filters, Efficiency, and Trade layout', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');

  const search = page.getByPlaceholder('Filter by name or variant...');
  const filters = page.getByRole('button', { name: /^Filters/ });
  const efficiency = page.getByRole('button', {
    name: 'Efficiency',
    exact: true
  });
  const trade = page.getByRole('button', { name: 'Trade', exact: true });
  await expect(search).toBeVisible();
  await expect(filters).toBeVisible();
  await expect(efficiency).toBeVisible();
  await expect(trade).toBeVisible();

  const [searchBox, filtersBox, efficiencyBox, tradeBox] = await Promise.all([
    search.boundingBox(),
    filters.boundingBox(),
    efficiency.boundingBox(),
    trade.boundingBox()
  ]);
  expect(filtersBox?.x).toBeGreaterThan(searchBox?.x ?? 0);
  expect(tradeBox?.x).toBeGreaterThan(efficiencyBox?.x ?? 0);

  await filters.click();
  await expect(
    page.getByRole('heading', { name: 'Apply Filter' })
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="popover-content"]').filter({
      has: page.getByRole('heading', { name: 'Apply Filter' })
    })
  ).toBeVisible();

  const filterPanel = page
    .locator('[data-slot="popover-content"]')
    .filter({ has: page.getByRole('heading', { name: 'Apply Filter' }) });
  await expect(
    filterPanel.getByRole('tab', { name: /price filter tab/i })
  ).toBeVisible();
  await expect(
    filterPanel.getByRole('tab', { name: /dust filter tab/i })
  ).toBeVisible();
  await expect(
    filterPanel.getByRole('tab', { name: /gold filter tab/i })
  ).toBeVisible();
  await expect(filterPanel.getByAltText('Chaos Orb').first()).toBeVisible();
  await expect(
    filterPanel.getByAltText('Thaumaturgic Dust').first()
  ).toBeVisible();
  await expect(filterPanel.getByAltText('Gold').first()).toBeVisible();
  await expect(filterPanel.getByText('Table options')).toHaveCount(0);

  await filterPanel.getByRole('tab', { name: /price filter tab/i }).click();
  await setSliderValue(page, 'Upper bound price filter', 5);
  await expect(filters).toContainText('1');
  await expect(page.getByText('Price ≤5', { exact: true })).toBeVisible();
});

test('filter selection and slider use a clear accent without input lag', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await openFilters(page);

  const priceTab = page.getByRole('tab', { name: /price filter tab/i });
  const dustTab = page.getByRole('tab', { name: /dust filter tab/i });
  const [selectedStyles, idleStyles] = await Promise.all([
    priceTab.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    }),
    dustTab.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    })
  ]);
  expect(selectedStyles).not.toEqual(idleStyles);
  expect(selectedStyles.background).not.toBe('rgba(0, 0, 0, 0)');

  const slider = page.getByRole('slider', {
    name: 'Upper bound price filter'
  });
  const sliderParts = slider.locator('xpath=ancestor::*[@data-slot="slider"]');
  const thumbBorder = await slider.evaluate(
    element => getComputedStyle(element).borderTopColor
  );
  const thumbBorderWidth = await slider.evaluate(
    element => getComputedStyle(element).borderTopWidth
  );
  const rangeColor = await sliderParts
    .locator('[data-slot="slider-range"]')
    .evaluate(element => getComputedStyle(element).backgroundColor);
  expect(thumbBorder).not.toBe('rgba(0, 0, 0, 0)');
  expect(thumbBorder).not.toBe('rgba(255, 255, 255, 0.1)');
  expect(thumbBorderWidth).toBe('1px');
  expect(rangeColor).not.toBe('rgba(0, 0, 0, 0)');

  await slider.focus();
  const persistence = await slider.evaluate(element => {
    const before = localStorage.getItem('exile-toolkit.disenchant-state.v1');
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
    );
    return {
      before,
      after: localStorage.getItem('exile-toolkit.disenchant-state.v1')
    };
  });
  expect(persistence.after).toBe(persistence.before);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = localStorage.getItem('exile-toolkit.disenchant-state.v1');
        return saved ? JSON.parse(saved).maxChaosPrice : undefined;
      })
    )
    .toBe(0);
});

test('Efficiency slider follows the reference draft-and-commit interaction', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page.getByRole('button', { name: 'Efficiency', exact: true }).click();

  const slider = page.getByRole('slider', {
    name: 'Chaos value per ten thousand Gold'
  });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();

  const savedBefore = await page.evaluate(() =>
    localStorage.getItem('exile-toolkit.disenchant-state.v1')
  );
  await page.mouse.move(box!.x + box!.width * 0.1, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height / 2, {
    steps: 20
  });

  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem('exile-toolkit.disenchant-state.v1')
      )
    )
    .toBe(savedBefore);

  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = localStorage.getItem('exile-toolkit.disenchant-state.v1');
        return saved ? JSON.parse(saved).goldValueChaosPer10k : undefined;
      })
    )
    .toBeGreaterThan(5);
});

test('active sorting text and Dust Value tooltip match the reference states', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  const activeSort = page.getByRole('button', {
    name: /Sort by Efficiency/
  });
  const inactiveSort = page.getByRole('button', { name: 'Sort by Price' });
  const [activeColor, inactiveColor] = await Promise.all([
    activeSort.evaluate(element => getComputedStyle(element).color),
    inactiveSort.evaluate(element => getComputedStyle(element).color)
  ]);
  expect(activeColor).not.toBe(inactiveColor);

  await page.getByRole('button', { name: 'About Dust Value' }).focus();
  const tooltip = page
    .locator('[data-slot="tooltip-content"]:visible')
    .filter({ hasText: 'Item Quality' })
    .first();
  await expect(tooltip).toBeVisible();
  const itemTypeBadge = tooltip
    .getByText('Weapons & Armors', { exact: true })
    .first();
  const qualityBadge = tooltip
    .getByText('Always Quality to 20%', { exact: true })
    .first();
  await expect(itemTypeBadge).toHaveAttribute('data-slot', 'badge');
  await expect(qualityBadge).toHaveAttribute('data-slot', 'badge');
  expect((await qualityBadge.boundingBox())?.x).toBeGreaterThan(
    (await itemTypeBadge.boundingBox())?.x ?? 0
  );
  await expect(tooltip).toContainText(
    'Dust scales 2:1 with quality → 20% quality → +40% dust'
  );
  await expect(tooltip).toContainText('ilvl 84 (1x)');
  expect((await tooltip.boundingBox())?.width).toBeGreaterThan(400);
});

test('Total Cost efficiency shows the complete reference breakdown', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');

  const row = page.getByRole('table').getByRole('row').filter({
    hasText: 'Original Sin'
  });
  await row
    .getByRole('button', { name: 'Show total cost breakdown for Original Sin' })
    .focus();

  const tooltip = page
    .locator('[data-slot="tooltip-content"]')
    .filter({ hasText: 'Total Cost Breakdown' });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(
    'Total Cost combines item Price with your selected Chaos valuation of the Gold Fee.'
  );
  await expect(tooltip).toContainText('Price130 Chaos');
  await expect(tooltip).toContainText('Gold Fee66,192 Gold');
  await expect(tooltip).toContainText('Gold Equivalent33.1 Chaos');
  await expect(tooltip).toContainText('Total Cost163.1 Chaos');
  await expect(tooltip).toContainText(
    'Gold is valued at 5 Chaos per 10,000 Gold. Fees are estimates and may vary for individual listings.'
  );
  await expect(tooltip).toContainText('Catalyst Recommendation');
});

test('table uses currency icons, compact Dust values, quality labels, and fixed columns', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');

  const table = page.getByRole('table');
  const row = table.getByRole('row').filter({ hasText: 'Original Sin' });
  await expect(row.getByAltText('Chaos Orb').first()).toBeVisible();
  await expect(row.getByAltText('Thaumaturgic Dust').first()).toBeVisible();
  await expect(row.getByText('(q20)')).toBeVisible();
  await expect(row.getByText(/ilvl 84/)).toHaveCount(0);

  const compactDust = row.getByLabel('3,951,115', { exact: true });
  await expect(compactDust.locator(':scope > span').first()).toHaveText('4M');
  await compactDust.focus();
  const numberTooltip = page
    .locator('[data-slot="tooltip-content"]')
    .filter({ hasText: '3,951,115' });
  await expect(numberTooltip).toBeVisible();
  const compactPrice = row.getByLabel('100', { exact: true }).first();
  await compactPrice.focus();
  const priceTooltip = page
    .locator('[data-slot="tooltip-content"]')
    .filter({ hasText: '100' });
  await expect(priceTooltip).toBeVisible();
  await expectTooltipToPaintAboveTable(page, priceTooltip);
  const catalyst = row.getByLabel('Catalyst recommendation details');
  await catalyst.focus();
  const catalystTooltip = page
    .locator('[data-slot="tooltip-content"]')
    .filter({ hasText: 'Catalyst Recommendation' });
  await expect(catalystTooltip).toBeVisible();
  await expect(catalystTooltip).toContainText('20 Catalysts');
  await expect(catalystTooltip).toContainText('+40% Dust');
  await expect(catalystTooltip).toContainText(
    'Use cheapest catalyst available on the market.'
  );
  await expectTooltipToPaintAboveTable(page, catalystTooltip);

  const headers = await table.getByRole('columnheader').allTextContents();
  expect(headers).toEqual([
    'Item icon',
    'Name',
    'Price',
    'Dust Value',
    'Dust / Chaos',
    'Efficiency · Total Cost',
    'Gold Fee',
    'Trade Link',
    'Favorite'
  ]);
  await page.getByRole('button', { name: 'About Dust Value' }).focus();
  await expect(
    page
      .locator('[data-slot="tooltip-content"]')
      .filter({ hasText: 'Item Quality' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'About Gold Fee' }).focus();
  await expect(
    page
      .locator('[data-slot="tooltip-content"]')
      .filter({ hasText: 'Gold Fee Modifiers' })
  ).toBeVisible();
});

async function expectTooltipToPaintAboveTable(page: Page, tooltip: Locator) {
  const isTopmost = await tooltip.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const topmost = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2
    );
    return (
      topmost !== null && (topmost === element || element.contains(topmost))
    );
  });
  expect(isTopmost).toBe(true);
}

test('global league selection updates price requests and Trade links', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('combobox', { name: 'Active league' })
    .selectOption('Hardcore Allflame');

  await page.getByRole('button', { name: 'Trade', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Active league' })
  ).toHaveValue('Hardcore Allflame');
  await page.getByRole('button', { name: 'Close' }).click();
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');

  const row = page
    .getByRole('table')
    .getByRole('row')
    .filter({ hasText: 'Original Sin' });
  await expect(
    row.getByRole('link', { name: /Open Trade search/ })
  ).toHaveAttribute('href', /trade\/search\/Hardcore%20Allflame\?q=/);
});

test('Gold fee filtering stays available when the player switches efficiency metrics', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  await expect(
    page.getByRole('columnheader', { name: /Gold Fee/ })
  ).toBeVisible();
  await openFilters(page);
  await expect(page.getByRole('tab', { name: 'Gold' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Efficiency', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Efficiency Metric' })
  ).toBeVisible();
  await page.getByRole('radio', { name: /Dust \/ Gold/ }).check();
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(
    page.getByRole('columnheader', { name: /Efficiency · Gold/ })
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: /Gold Fee/ })
  ).toBeVisible();
  await openFilters(page);
  await page.getByRole('tab', { name: 'Gold' }).click();
  await setSliderValue(page, 'Upper bound gold fee filter', 5_000, 500);
  await expect(page.getByRole('table').getByText('Original Sin')).toHaveCount(
    0
  );
  await page.getByRole('button', { name: 'Close' }).click();
  await page.reload();
  await expect(
    page.getByRole('columnheader', { name: /Efficiency · Gold/ })
  ).toBeVisible();
});

test('Trade panel currency display persists without changing the Ranking', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');
  const row = page.getByRole('table').getByRole('row').filter({
    hasText: 'Original Sin'
  });
  await expect(row.getByAltText('Chaos Orb').first()).toBeVisible();

  await page.getByRole('button', { name: 'Trade' }).click();
  await page.getByRole('combobox', { name: 'Display Currency' }).click();
  await page.getByRole('option', { name: 'Divine' }).click();
  await expect(row.getByAltText('Divine Orb')).toBeVisible();
  await expect(row.getByLabel('0.9', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Trade' }).click();
  await expect(
    page.getByRole('combobox', { name: 'Display Currency' })
  ).toHaveText('Divine');
  await expect(row.getByAltText('Divine Orb')).toBeVisible();
});

test('Efficiency keeps its padding and Trade uses one scrollbar', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  await page.getByRole('button', { name: 'Efficiency', exact: true }).click();
  const efficiencyPopover = page.locator('[data-slot="popover-content"]');
  await expect(efficiencyPopover).toHaveCSS('padding-left', '16px');
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Trade', exact: true }).click();
  const tradePanel = page.locator('#disenchant-trade-settings');
  const activeVerticalScrollers = await tradePanel.evaluate(element => {
    const popover = element.closest('[data-slot="popover-content"]');
    if (!popover) return 0;
    return [popover, ...popover.querySelectorAll('*')].filter(node => {
      const overflowY = getComputedStyle(node).overflowY;
      return (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      );
    }).length;
  });

  expect(activeVerticalScrollers).toBe(1);
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
});

test('favorites persist, pin before pagination, and remain subject to filters', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Starforge');
  await page
    .getByRole('button', { name: 'Add Starforge to favorites' })
    .click();
  await page.getByRole('button', { name: 'Clear unique search' }).click();

  await expect(
    page.getByRole('table').locator('tbody tr').first()
  ).toContainText('Starforge');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remove Starforge from favorites' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('table').locator('tbody tr').first()
  ).toContainText('Starforge');

  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');
  await expect(page.getByRole('table').getByText('Starforge')).toHaveCount(0);
});

test('Trade item level updates Dust values and exact low-stock searches', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  await page.getByRole('button', { name: 'Trade', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Trade Settings' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  const tradeSettingsScroll = page.locator('#disenchant-trade-settings-scroll');
  expect(
    await tradeSettingsScroll.evaluate(
      element => element.scrollHeight > element.clientHeight
    )
  ).toBe(true);
  const minimumItemLevel = page.getByRole('slider', {
    name: 'Minimum Item Level'
  });
  await expect(minimumItemLevel).toHaveAttribute('aria-valuemin', '65');
  await expect(minimumItemLevel).toHaveAttribute('aria-valuemax', '84');
  await expect(minimumItemLevel).toHaveAttribute('aria-valuenow', '84');
  await setSliderValue(page, 'Minimum Item Level', 75);
  await expect(page.getByText('Include Corrupted Items')).toBeVisible();
  await page.getByRole('combobox', { name: 'Online Status' }).click();
  await page.getByRole('option', { name: 'Any', exact: true }).click();
  await page.getByRole('combobox', { name: 'Listing Time' }).click();
  await page.getByRole('option', { name: '1 day' }).click();
  await page.getByRole('checkbox', { name: 'Include corrupted items' }).check();
  await page.getByRole('button', { name: 'Close' }).click();

  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Original Sin');
  const originalSin = page.getByRole('table').getByRole('row').filter({
    hasText: 'Original Sin'
  });
  await expect(originalSin.getByText('(q20)')).toBeVisible();
  await expect(
    originalSin.getByLabel('2,173,113', { exact: true })
  ).toBeVisible();
  const originalSinTradeUrl = await originalSin
    .getByRole('link', { name: /Open Trade search/ })
    .getAttribute('href');
  const originalSinPayload = JSON.parse(
    decodeURIComponent(
      new URL(originalSinTradeUrl ?? '').searchParams.get('q') ?? '{}'
    )
  ) as {
    query: {
      status: { option: string };
      filters: {
        misc_filters: {
          filters: {
            ilvl: { min: number };
            corrupted: { option: string };
          };
        };
        trade_filters: { filters: { indexed: { option: string } } };
      };
    };
  };
  expect(originalSinPayload.query.filters.misc_filters.filters.ilvl.min).toBe(
    75
  );
  expect(originalSinPayload.query.status.option).toBe('any');
  expect(
    originalSinPayload.query.filters.misc_filters.filters.corrupted.option
  ).toBe('any');
  expect(
    originalSinPayload.query.filters.trade_filters.filters.indexed.option
  ).toBe('1day');
  expect(
    originalSinPayload.query.filters.trade_filters.filters
  ).not.toHaveProperty('price');

  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill("Rakiata's Dance");
  const row = page.getByRole('table').getByRole('row').filter({
    hasText: "Rakiata's Dance"
  });
  const trade = row.getByRole('link', {
    name: /Open Trade search for Rakiata's Dance.*low stock/
  });
  await expect(trade).toHaveAttribute(
    'href',
    /pathofexile\.com\/trade\/search\/Allflame\?q=/
  );
  await trade.focus();
  const tradeTooltip = page
    .locator('[data-slot="tooltip-content"]')
    .filter({ hasText: 'Low stock' });
  await expect(tradeTooltip).toContainText('poe.ninja reported 25 listings');
  await expect(tradeTooltip).toContainText(
    'Corrupted listings below q20 may return less Dust.'
  );
  await expectTooltipToPaintAboveTable(page, tradeTooltip);
  await expect(row.getByTestId('candidate-icon-frame')).toHaveCSS(
    'border-top-width',
    '0px'
  );
});

test('player combines reference numeric filters and clears each independently', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await openFilters(page);

  await setSliderValue(page, 'Upper bound price filter', 5);
  await expect(
    page.getByRole('table').getByText("Rakiata's Dance")
  ).toBeVisible();
  await expect(page.getByRole('table').getByText('Reefbane')).toHaveCount(0);

  await expect(
    page.getByRole('slider', { name: 'Upper bound price filter' })
  ).toHaveAttribute('aria-valuenow', '5');
  await page.getByRole('tab', { name: 'Dust' }).click();
  const dustLower = page.getByRole('slider', {
    name: 'Lower bound dust value filter'
  });
  await dustLower.focus();
  await dustLower.press('Home');
  await dustLower.press('ArrowRight');
  await expect(page.getByTestId('dust-filter-chip')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Filters/ })).toContainText(
    '2'
  );
  await page.getByRole('tab', { name: 'Price' }).click();
  await expect(
    page.getByRole('slider', { name: 'Upper bound price filter' })
  ).toHaveAttribute('aria-valuenow', '5');
  await page.getByRole('tab', { name: 'Dust' }).click();
  await page
    .getByRole('button', { name: 'Clear lower bound dust value filter' })
    .click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('tab', { name: 'Price' }).click();
  await page
    .getByRole('button', { name: 'Clear upper bound price filter' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Clear upper bound price filter' })
  ).toBeDisabled();
});

test('only reference-ranked items render and every Ranking column sorts both ways', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill("Lioneye's Glare");
  await expect(
    page.getByRole('table').getByText("Lioneye's Glare")
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear unique search' }).click();
  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('Market-only Relic');
  await expect(
    page.getByRole('table').getByText('Market-only Relic')
  ).toHaveCount(0);
  await expect(
    page.getByRole('table').getByText('Dust unavailable')
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear unique search' }).click();

  for (const column of ['Name', 'Price', 'Dust Value', 'Dust / Chaos']) {
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

test('page size and reference filters persist while page number resets', async ({
  page
}) => {
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  for (const pageSize of ['10', '20', '30', '40', '50']) {
    await page.getByLabel('Rows per page').selectOption(pageSize);
    await expect(page.getByLabel('Rows per page')).toHaveValue(pageSize);
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(
      Number(pageSize)
    );
  }

  await page.getByLabel('Rows per page').selectOption('10');
  await expect(page.getByTestId('pagination-summary')).toContainText(
    'Showing 1–10 of'
  );
  await page.getByRole('button', { name: 'Go to last page' }).click();
  await expect(page.getByTestId('pagination-summary')).not.toContainText(
    'Showing 1–10 of'
  );
  await page.getByRole('button', { name: 'Go to first page' }).click();
  await expect(page.getByText(/Page 1 of/)).toBeVisible();
  await page.getByRole('button', { name: 'Sort by Name' }).click();
  await page.getByRole('button', { name: 'Go to next page' }).click();
  await expect(page.getByText(/Page 2 of/)).toBeVisible();

  await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .fill('forge');
  await openFilters(page);
  await setSliderValue(page, 'Upper bound price filter', 5);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await page.reload();

  await expect(page.getByLabel('Rows per page')).toHaveValue('10');
  await expect(
    page.getByRole('searchbox', { name: 'Search unique items' })
  ).toHaveValue('forge');
  await openFilters(page);
  await expect(
    page.getByRole('slider', { name: 'Upper bound price filter' })
  ).toHaveAttribute('aria-valuenow', '5');
  await expect(
    page.getByRole('columnheader', { name: /Name/ })
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
  await expect(page.getByLabel('Rows per page')).toHaveValue('10');
  const desktopFirst = await page
    .getByRole('table')
    .locator('tbody tr')
    .first()
    .locator('td')
    .nth(1)
    .innerText();

  await page.setViewportSize({ width: 320, height: 720 });
  const mobileFirst = await page
    .getByRole('list', { name: 'Dust per Total Cost ranking' })
    .getByRole('listitem')
    .first()
    .innerText();
  expect(mobileFirst).toContain(desktopFirst);

  const filtersBox = await page
    .getByRole('button', { name: /^Filters/ })
    .boundingBox();
  const sortBox = await page
    .getByRole('button', { name: /^Sort options/ })
    .boundingBox();
  const efficiencyBox = await page
    .getByRole('button', { name: 'Efficiency', exact: true })
    .boundingBox();
  const tradeBox = await page
    .getByRole('button', { name: 'Trade', exact: true })
    .boundingBox();
  const searchBox = await page
    .getByRole('searchbox', { name: 'Search unique items' })
    .boundingBox();
  expect(sortBox?.x).toBeGreaterThan(filtersBox?.x ?? 0);
  expect(efficiencyBox?.y).toBeGreaterThan(filtersBox?.y ?? 0);
  expect(tradeBox?.x).toBeGreaterThan(efficiencyBox?.x ?? 0);
  expect(searchBox?.y).toBeGreaterThan(efficiencyBox?.y ?? 0);

  await page.getByRole('button', { name: /^Sort options/ }).click();
  await page.getByRole('button', { name: 'Name', exact: true }).click();
  await page.getByRole('button', { name: /^Sort options/ }).click();
  await page.getByRole('button', { name: 'Name', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /Current: Name, ascending/ })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Go to next page' }).click();
  await expect(page.getByText(/Page 2 of/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test('saved filters do not reveal unpriced rows when prices become unavailable', async ({
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
  await page.route('**/api/price-snapshots/disenchant*', route =>
    route.fulfill({ status: 503 })
  );
  await page.goto('/tools/disenchant');

  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.getByText('Unpriced', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/matching$/)).toHaveCount(0);
  await openFilters(page);
  await expect(
    page.getByRole('tab', { name: /price filter tab/i })
  ).toBeDisabled();
  await expect(page.getByText('No candidates match')).toBeVisible();
});

test('former item-level 85 default migrates to the reference maximum', async ({
  page
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'exile-toolkit.disenchant-state.v1',
      JSON.stringify({
        version: 2,
        rankingMode: 'dust-per-gold',
        goldValueChaosPer10k: 7,
        minItemLevel: 85,
        includeCorrupted: true,
        onlineStatus: 'available',
        listingTime: '3days',
        favorites: [],
        search: 'Original Sin',
        category: 'all',
        showUnpriced: true,
        showDustUnavailable: true,
        sorting: [{ id: 'efficiency', desc: true }],
        columnVisibility: { category: false },
        pageSize: 10
      })
    )
  );
  await useCompletePriceSnapshot(page);
  await page.goto('/tools/disenchant');

  await expect(
    page.getByRole('searchbox', { name: 'Search unique items' })
  ).toHaveValue('Original Sin');
  await page.getByRole('button', { name: 'Trade', exact: true }).click();
  await expect(
    page.getByRole('slider', { name: 'Minimum Item Level' })
  ).toHaveAttribute('aria-valuenow', '84');
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
    await expect(page.getByLabel('Rows per page')).toHaveValue('10');
  });
}
