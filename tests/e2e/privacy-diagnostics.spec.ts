import { expect, test } from '@playwright/test';

test('visitor can read the exact analytics and diagnostics boundary', async ({
  page
}) => {
  await page.goto('/privacy');

  await expect(
    page.getByText('only an aggregate page identifier')
  ).toBeVisible();
  await expect(
    page.getByText('do not include a browser identifier')
  ).toBeVisible();
  await expect(page.getByText('outbound analytics disabled')).toBeVisible();
  await expect(
    page.getByText(
      'Sentry and other third-party error trackers are not installed.'
    )
  ).toBeVisible();
});

test('automated browser runs do not send outbound analytics', async ({
  page
}) => {
  let analyticsRequests = 0;
  await page.route('**/api/events', async route => {
    analyticsRequests += 1;
    await route.fulfill({ status: 202, body: '{"accepted":true}' });
  });

  await page.goto('/');
  await page
    .getByRole('link', { name: 'Regex generator', exact: true })
    .click();
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();

  expect(analyticsRequests).toBe(0);
});
