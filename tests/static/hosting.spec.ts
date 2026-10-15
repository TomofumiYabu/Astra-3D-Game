import { expect, test } from '@playwright/test';

test('a plain static host serves the game and navigation under a project path', async ({
  page,
  request,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('requestfailed', (request) => failures.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  // Root assets must genuinely be unavailable, so an absolute asset path cannot pass accidentally.
  expect((await request.get('/favicon.svg')).status()).toBe(404);
  await page.goto('/Astra-3D-Game/?quality=low');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
  expect(
    await page.locator('h1').evaluate((element) => getComputedStyle(element).fontSize),
  ).not.toBe('32px');
  const iconUrl = await page
    .locator('link[rel="icon"]')
    .evaluate((element) => (element as HTMLLinkElement).href);
  expect(new URL(iconUrl).pathname).toBe('/Astra-3D-Game/favicon.svg');
  expect((await request.get(iconUrl)).status()).toBe(200);
  await page.getByRole('link', { name: 'それ、投げるんですか？ ホーム' }).click();
  await expect(page).toHaveURL(/\/Astra-3D-Game\/$/);
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  expect(failures).toEqual([]);
});
