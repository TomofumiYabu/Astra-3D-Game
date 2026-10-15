import { expect, test } from '@playwright/test';

test('renders the hotel, plays a real round, reports damage, and retries', async ({
  page,
}, testInfo) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  await page.goto('/?quality=low');
  const app = page.locator('#app');
  await expect(app).toHaveAttribute('data-state', 'ready');
  await expect(page.getByRole('img', { name: 'ホテルロビーの3Dゲーム画面' })).toHaveAttribute(
    'data-rendered',
    'true',
  );
  await expect(page.locator('#loading')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('lobby.png') });
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: '発射角度' })).toHaveValue('1');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('slider')).toHaveValue('0');
  await page.keyboard.down('Space');
  await expect(page.locator('#launch')).toHaveClass(/charging/);
  await page.waitForTimeout(1650); // Exercise an actual full-charge hold.
  await page.keyboard.up('Space');
  await expect(app).toHaveAttribute('data-state', 'flying');
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 40_000 });
  await expect(app).toHaveAttribute('data-state', 'result');
  const knocked = Number(await page.getByTestId('knocked').textContent());
  expect(knocked).toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId('result-score')).not.toHaveText('¥0');
  await expect(page.getByTestId('result-score')).toHaveText(
    await page.getByTestId('damage').innerText(),
  );
  await page.screenshot({ path: testInfo.outputPath('result.png') });
  await page.getByRole('button', { name: /もう一度、おもてなしする/ }).click();
  await expect(app).toHaveAttribute('data-state', 'ready');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByTestId('damage')).toHaveText('¥0');
  await expect(page.getByTestId('knocked')).toHaveText('0');
  await expect(page.locator('#launch')).toBeEnabled();
  expect(failures).toEqual([]);
});

test('pointer input works, interrupted charging cancels, and R resets in flight', async ({
  page,
}) => {
  await page.goto('/?quality=low');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
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
  await page.keyboard.press('r');
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'ready');
  await expect(page.getByTestId('knocked')).toHaveText('0');
  await page.getByRole('button', { name: '効果音をオンにする' }).click();
  await expect(page.getByRole('button', { name: '効果音をオフにする' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
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
  await expect(page.getByRole('alert')).toContainText('ホテルを開けませんでした');
  await expect(page.getByRole('button', { name: '再読み込み' })).toBeVisible();
});
