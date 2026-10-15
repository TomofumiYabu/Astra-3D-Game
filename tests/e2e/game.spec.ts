import { expect, test } from '@playwright/test';

test('plays an actual throw, reports secondary impacts, replays it, shares and retries', async ({
  page,
}, testInfo) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('Clipboard intentionally unavailable');
        },
      },
      configurable: true,
    }),
  );
  await page.goto('/?quality=low');
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready');
  await expect(
    page.getByRole('img', { name: 'おじさんとサイボーグの3D投擲ゲーム画面' }),
  ).toHaveAttribute('data-rendered', 'true');
  await expect(page.locator('#loading')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('arena.png') });
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider')).toHaveValue('1');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('slider')).toHaveValue('0');
  await page.keyboard.down('Space');
  await expect(page.locator('#launch')).toHaveClass(/charging/);
  await page.waitForTimeout(1300);
  await page.keyboard.up('Space');
  await expect(app).toHaveAttribute('data-state', 'flying');
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 40000 });
  expect(Number(await page.getByTestId('knocked').textContent())).toBeGreaterThanOrEqual(10);
  expect(Number(await page.getByTestId('chain').textContent())).toBeGreaterThanOrEqual(5);
  const score = await page.getByTestId('score').innerText();
  expect(score).not.toBe('0');
  await expect(page.getByTestId('result-score')).toHaveText(score);
  await page.screenshot({ path: testInfo.outputPath('result.png') });
  await page.getByRole('button', { name: '結果とお題URLをコピー' }).click();
  await expect(page.getByRole('textbox', { name: '結果とお題URL' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '結果とお題URL' })).toHaveValue(
    /formation=breakthrough/,
  );
  await page.getByRole('button', { name: '今の一投を見る' }).click();
  await expect(app).toHaveAttribute('data-state', 'replay');
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('result-score')).toHaveText(score);
  await page.getByRole('button', { name: /もう一投、いきます/ }).click();
  await expect(app).toHaveAttribute('data-state', 'ready');
  await expect(page.getByTestId('score')).toHaveText('0');
  await expect(page.getByTestId('chain')).toHaveText('0');
  await expect(page.locator('#launch')).toBeEnabled();
  expect(failures).toEqual([]);
});

test('pointer cancellation, formation changes and in-flight reset work', async ({ page }) => {
  await page.goto('/?quality=low&formation=pincer');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  await expect(page.getByRole('button', { name: /左右包囲/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /千鳥ドミノ/ }).click();
  await expect(page).toHaveURL(/formation=domino/);
  const button = page.locator('#launch');
  await button.hover();
  await page.mouse.down();
  await expect(button).toHaveClass(/charging/);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();
  await expect(button).not.toHaveClass(/charging/);
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  await page.mouse.down();
  await page.waitForTimeout(300);
  await page.mouse.up();
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'flying');
  await expect(page.getByRole('button', { name: /千鳥ドミノ/ })).toBeDisabled();
  await page.keyboard.press('r');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  await expect(page.getByTestId('knocked')).toHaveText('0');
  await expect(page.getByRole('button', { name: /千鳥ドミノ/ })).toBeEnabled();
  await page.getByRole('button', { name: '効果音をオンにする' }).click();
  await expect(page.getByRole('button', { name: '効果音をオフにする' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('narrow screens and reduced motion retain visible controls without horizontal overflow', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?quality=low');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  const bounds = await page.locator('#launch').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.y + bounds!.height).toBeLessThan(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: testInfo.outputPath('narrow.png') });
});

test('explains WebGL unavailability instead of leaving a blank screen', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, ...args: unknown[]) {
        if (args[0] === 'webgl2' || args[0] === 'webgl') return null;
        return Reflect.apply(original, this, args);
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'error');
  await expect(page.getByRole('alert')).toContainText('会場を開けませんでした');
  await expect(page.getByRole('button', { name: '再読み込み' })).toBeVisible();
});
