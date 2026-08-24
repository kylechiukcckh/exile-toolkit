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
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    '^(?:Dunes Map)$'
  );

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
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    '^(?:Beach Map)$'
  );
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
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    '^(?:Area has patches of Burning Ground|Area has patches of Chilled Ground|Area has patches of desecrated ground)$'
  );

  await search.fill('burning');
  await page
    .getByRole('button', { name: 'Clear visible Ground effects' })
    .click();
  await expect(page.getByText('2 modifiers selected')).toBeVisible();

  await page.getByRole('button', { name: 'Maps', exact: true }).click();
  await expect(page.getByText('1 map selected')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    '^(?:Beach Map)$'
  );
});

test('player copies a Regex part and gets accessible confirmation', async ({
  page
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => undefined }
    });
  });
  await page.goto('/tools/regex');
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();

  await expect(page.getByText('250 character limit')).toBeVisible();
  await expect(page.getByText('15 / 250 characters')).toBeVisible();
  await page.getByRole('button', { name: 'Copy part 1' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Copied regex part 1.' })
  ).toHaveText('Copied regex part 1.');
});

test('player receives deterministic parts for an overlong Selection', async ({
  page
}) => {
  await page.addInitScript(() => {
    const customEntries = Array.from({ length: 130 }, (_, index) => ({
      id: `custom-${index}`,
      name: String.fromCodePoint(0x4e00 + index),
      category: 'map'
    }));
    localStorage.setItem(
      'exile-toolkit.regex-state.v1',
      JSON.stringify({
        customEntries,
        presets: [
          {
            id: 'preset-overlong',
            name: 'Overlong Custom Selection',
            category: 'map',
            entryIds: customEntries.map(entry => entry.id)
          }
        ]
      })
    );
  });
  await page.goto('/tools/regex');
  await page
    .getByRole('button', {
      name: 'Apply local preset Overlong Custom Selection'
    })
    .click();

  await expect(page.getByText('130 maps selected')).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Regex part 2' })
  ).toBeVisible();
  await expect(page.getByText(/\/ 250 characters/)).toHaveCount(2);
});

test('player applies built-in and manages local presets across reloads', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page
    .getByRole('button', { name: 'Apply preset Starter Atlas maps' })
    .click();
  await expect(page.getByText('3 maps selected')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Matched maps', exact: true })
  ).toContainText('Mesa Map');

  await page.getByRole('textbox', { name: 'Preset name' }).fill('Farm maps');
  await page.getByRole('button', { name: 'Save current' }).click();
  await page
    .getByRole('textbox', { name: 'Rename Farm maps' })
    .fill('Favorites');
  await page.getByRole('button', { name: 'Save name for Farm maps' }).click();
  await page.reload();

  await page
    .getByRole('button', { name: 'Apply local preset Favorites' })
    .click();
  await expect(page.getByText('3 maps selected')).toBeVisible();
  await page
    .getByRole('button', { name: 'Delete local preset Favorites' })
    .click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Apply local preset Favorites' })
  ).toHaveCount(0);
});

test('player adds, removes, and restores a distinct Custom entry', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page
    .getByRole('textbox', { name: 'Custom entry' })
    .fill('Museum [Replica] Map');
  await page.getByRole('button', { name: 'Add Custom' }).click();

  await expect(page.getByText('Custom', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    '^(?:Museum \\[Replica\\] Map)$'
  );
  await page.reload();
  await page
    .getByRole('checkbox', { name: 'Custom entry Museum [Replica] Map' })
    .check();
  await expect(page.getByText('1 map selected')).toBeVisible();
  await page
    .getByRole('button', { name: 'Remove Custom entry Museum [Replica] Map' })
    .click();
  await expect(
    page.getByRole('checkbox', { name: 'Custom entry Museum [Replica] Map' })
  ).toHaveCount(0);
});

test('player cannot add Custom text that duplicates Curated data', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page.getByRole('textbox', { name: 'Custom entry' }).fill(' beach map ');
  await page.getByRole('button', { name: 'Add Custom' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'duplicates an active category entry'
  );
  await expect(
    page.getByRole('checkbox', { name: 'Custom entry beach map' })
  ).toHaveCount(0);
});

test('player is warned when an outdated local preset entry is ignored', async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'exile-toolkit.regex-state.v1',
      JSON.stringify({
        customEntries: [],
        presets: [
          {
            id: 'old-preset',
            name: 'Old maps',
            category: 'map',
            entryIds: ['removed-map', 'beach-map']
          }
        ]
      })
    );
  });
  await page.goto('/tools/regex');

  await expect(page.getByRole('alert')).toContainText(
    'ignored unavailable entry "removed-map"'
  );
  await page
    .getByRole('button', { name: 'Apply local preset Old maps' })
    .click();
  await expect(page.getByText('1 map selected')).toBeVisible();
});

test('player can manually copy when clipboard access fails', async ({
  page
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Clipboard denied');
        }
      }
    });
  });
  await page.goto('/tools/regex');
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();
  await page.getByRole('button', { name: 'Copy part 1' }).click();

  await expect(
    page.getByRole('status').filter({ hasText: 'Could not copy regex part 1.' })
  ).toContainText('Select the generated text and copy it manually.');
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    '^(?:Beach Map)$'
  );
});
