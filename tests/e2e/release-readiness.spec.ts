import { expect, test } from '@playwright/test';

test('public data notices show shipped versions, provenance, coverage, and licenses', async ({
  page
}) => {
  await page.goto('/data-sources');

  for (const dataset of ['Maps Dataset', 'Map modifiers Dataset']) {
    const notice = page.getByRole('region', { name: dataset });
    await expect(notice).toContainText('2026.08.25');
    await expect(notice).toContainText('Path of Exile Wiki');
    await expect(notice).toContainText('Reviewed');
    await expect(notice).toContainText('Coverage');
    await expect(notice).toContainText('CC BY-NC-SA 3.0');
  }

  await page.getByRole('link', { name: 'License Notices' }).click();
  await expect(
    page.getByRole('region', { name: 'Maps Dataset license' })
  ).toContainText('CC BY-NC-SA 3.0');
  await expect(
    page.getByRole('region', { name: 'Map modifiers Dataset license' })
  ).toContainText('CC BY-NC-SA 3.0');

  await page.goto('/tools/regex');
  const correctionLink = page.getByRole('link', {
    name: 'Report a missing Curated entry'
  });
  await expect(correctionLink).toHaveAttribute(
    'href',
    '/data-sources#corrections'
  );
  expect(await correctionLink.getAttribute('href')).not.toContain('?');
});
