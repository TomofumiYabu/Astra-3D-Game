import { defineConfig } from '@playwright/test';
import mainConfig from './playwright.config';

export default defineConfig({
  ...mainConfig,
  testDir: './tests/static',
  outputDir: 'test-results/static',
  reporter: 'list',
  use: { ...mainConfig.use, baseURL: 'http://127.0.0.1:4174' },
  webServer: {
    command: 'node scripts/serve-static.mjs',
    url: 'http://127.0.0.1:4174/Astra-3D-Game/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
