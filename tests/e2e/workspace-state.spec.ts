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
  await expect(page.getByRole('combobox', { name: /^Theme:/ })).toHaveCount(1);
  await expect(
    page.getByRole('combobox', { name: 'Display currency' })
  ).toHaveCount(0);

  await league.selectOption('Standard');
  await page.reload();
  await expect(league).toHaveValue('Standard');
});
