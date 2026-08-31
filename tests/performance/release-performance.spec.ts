import { expect, test } from '@playwright/test';

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
    route.fulfill({ status: 503 })
  );
  await page.goto('/tools/disenchant');
  await expect(page.getByText('1,096 matching')).toBeVisible();
  const rankingMs = await page.evaluate(async () => {
    const input =
      document.querySelector<HTMLInputElement>('#disenchant-search');
    if (!input) throw new Error('Disenchant search unavailable');
    const started = performance.now();
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    valueSetter?.call(input, 'Original Sin');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    while (!document.body.textContent?.includes('1 matching')) {
      await new Promise(requestAnimationFrame);
    }
    return performance.now() - started;
  });
  expect(rankingMs).toBeLessThan(100);
});
