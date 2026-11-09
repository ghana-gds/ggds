import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the built site (pnpm run build), served under the strict CSP (scripts/serve.mjs).
const PORT = 4173;

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env['CI'],
    env: { PORT: String(PORT) },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
