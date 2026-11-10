// The GGDS WordPress theme, in the WordPress that scripts/test-wordpress.mjs starts (WP_URL).
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: process.env.WP_URL ?? 'http://localhost:8089' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
