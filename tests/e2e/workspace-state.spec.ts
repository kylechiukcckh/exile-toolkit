import { expect, test } from '@playwright/test';

test('native league options use the active theme colors', async ({ page }) => {
  await page.goto('/');
  const option = page
    .getByRole('combobox', { name: 'Active league' })
    .locator('option')
    .first();

  for (const theme of ['dark', 'system'] as const) {
    await page.locator('html').evaluate((element, activeTheme) => {
      element.dataset.theme = activeTheme;
    }, theme);

    const colors = await option.evaluate(element => {
      const optionStyles = getComputedStyle(element);
      const themeProbe = document.createElement('span');
      themeProbe.style.color = 'var(--foreground)';
      themeProbe.style.backgroundColor = 'var(--background)';
      document.body.append(themeProbe);
      const themeStyles = getComputedStyle(themeProbe);
      const colors = {
        optionBackground: optionStyles.backgroundColor,
        optionForeground: optionStyles.color,
        themeBackground: themeStyles.backgroundColor,
        themeForeground: themeStyles.color
      };
      themeProbe.remove();

      return colors;
    });

    expect(colors.optionBackground).toBe(colors.themeBackground);
    expect(colors.optionForeground).toBe(colors.themeForeground);
  }
});

test('header owns the global league and the only theme control', async ({
  page
}) => {
  await page.goto('/');
  const league = page.getByRole('combobox', { name: 'Active league' });
  await expect(league.locator('option')).toHaveText([
    'Allflame',
    'Hardcore Allflame',
    'Standard',
    'Hardcore'
  ]);
  await expect(page.getByRole('button', { name: 'Toggle theme' })).toHaveCount(
    1
  );
  await expect(
    page.getByRole('combobox', { name: 'Display currency' })
  ).toHaveCount(0);

  await league.selectOption('Standard');
  await page.reload();
  await expect(league).toHaveValue('Standard');
});

test('player shares and restores approved regex Tool state', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page.getByRole('button', { name: 'Map modifiers' }).click();
  await page
    .getByRole('button', { name: 'Apply preset Player penalties' })
    .click();
  const expectedRegex = await page
    .getByRole('textbox', { name: 'Regex part 1' })
    .inputValue();

  await page.getByRole('button', { name: 'Share Tool state' }).click();
  const sharedUrl = await page
    .getByRole('textbox', { name: 'Share URL' })
    .inputValue();
  expect(sharedUrl).toContain('?state=');
  expect(sharedUrl).not.toContain('cannot-regenerate');
  expect(sharedUrl).not.toContain('Players cannot Regenerate');

  await page.goto(sharedUrl);
  await expect(
    page.getByRole('button', { name: 'Map modifiers' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('4 modifiers selected')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Regex part 1' })).toHaveValue(
    expectedRegex
  );
  await expect(
    page.getByRole('region', { name: 'Matched modifiers', exact: true })
  ).toContainText('Players are Cursed with Vulnerability');
});

test('share action never includes Custom entry text', async ({ page }) => {
  await page.goto('/tools/regex');
  await page
    .getByRole('textbox', { name: 'Custom entry' })
    .fill('private map text');
  await page.getByRole('button', { name: 'Add Custom' }).click();

  await expect(
    page.getByRole('button', { name: 'Share Tool state' })
  ).toBeDisabled();
  await expect(
    page.getByText('Their text stays in this browser.')
  ).toBeVisible();
  await expect(page).not.toHaveURL(/state=/);
});

for (const [name, state, explanation] of [
  ['malformed', 'not-base64', 'malformed'],
  [
    'unsupported',
    'eyJ2ZXJzaW9uIjoyLCJjYXRlZ29yeSI6Im1hcCIsInNlbGVjdGVkSWRzIjpbXX0=',
    'version 2 is not supported'
  ],
  ['oversized', 'a'.repeat(2001), 'too large']
] as const) {
  test(`player recovers from ${name} shared Tool state`, async ({ page }) => {
    await page.goto(`/tools/regex?state=${state}`);

    await expect(page.getByRole('alert')).toContainText(explanation);
    await expect(
      page.getByRole('checkbox', { name: 'Beach Map' })
    ).toBeVisible();
    await expect(page.getByText('0 maps selected')).toBeVisible();
  });
}

test('workspace theme, favorites, and Saved calculations survive reload', async ({
  page
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page
    .getByRole('button', { name: 'Add Regex generator to favorites' })
    .click();
  await page
    .getByRole('link', { name: 'Regex generator', exact: true })
    .click();
  await page.getByRole('checkbox', { name: 'Beach Map' }).check();
  await page
    .getByRole('textbox', { name: 'Custom entry' })
    .fill('explicitly saved custom text');
  await page.getByRole('button', { name: 'Add Custom' }).click();
  await page.getByRole('button', { name: 'Save calculation' }).click();
  await page.reload();
  await page.getByRole('link', { name: 'Workspace home' }).click();

  await expect(
    page.getByRole('button', { name: 'Toggle theme' })
  ).toHaveAttribute('title', 'Theme: System');
  await expect(
    page.getByRole('button', { name: 'Remove Regex generator from favorites' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByText('Saved calculations').locator('..')
  ).toContainText('1');
  const savedWorkspace = await page.evaluate(() =>
    localStorage.getItem('exile-toolkit.workspace-state.v1')
  );
  expect(savedWorkspace).toContain('explicitly saved custom text');
});

test('Tool history keeps 20 actions without retaining unsaved Custom text', async ({
  page
}) => {
  await page.goto('/tools/regex');
  await page
    .getByRole('textbox', { name: 'Custom entry' })
    .fill('private pasted text');
  await page.getByRole('button', { name: 'Add Custom' }).click();

  const mapNames = [
    'Beach Map',
    'Cemetery Map',
    'City Square Map',
    'Dunes Map',
    'Glacier Map',
    'Jungle Valley Map',
    'Mesa Map',
    'Strand Map',
    'Toxic Sewer Map',
    'Underground Sea Map',
    'Volcano Map',
    'Waste Pool Map'
  ];
  for (const mapName of mapNames) {
    await page.getByRole('checkbox', { name: mapName }).check();
  }
  for (const mapName of mapNames.slice(0, 11)) {
    await page.getByRole('checkbox', { name: mapName }).uncheck();
  }
  await page.getByRole('link', { name: 'Workspace home' }).click();

  await expect(
    page.getByText('Recent Tool actions').locator('..')
  ).toContainText('20 / 20');
  const savedWorkspace = await page.evaluate(() =>
    localStorage.getItem('exile-toolkit.workspace-state.v1')
  );
  expect(savedWorkspace).not.toContain('private pasted text');
});
