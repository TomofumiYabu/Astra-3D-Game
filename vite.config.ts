import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative assets work both at a domain root and under a GitHub Pages project path.
  base: './',
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  test: { include: ['tests/unit/**/*.test.ts'], maxWorkers: 2 },
});
