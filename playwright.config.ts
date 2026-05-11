import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Config — Retroppies Dashboard
 *
 * Jalankan test:
 *   npx playwright test              — semua test (headless)
 *   npx playwright test --ui         — UI mode (visual, bisa pause)
 *   npx playwright test --debug      — debug mode (step-by-step)
 *   npx playwright test auth         — filter file nama "auth"
 *   npx playwright show-report       — buka HTML report terakhir
 *
 * Dev server harus aktif di port 5173 sebelum test dijalankan.
 * Gunakan: nvm use 20.19.1 && npm run dev
 */
export default defineConfig({
  testDir: './tests',

  // Gagalkan semua test jika ada yang tidak expect-ed
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    // Screenshot otomatis saat test gagal
    screenshot: 'only-on-failure',
    // Video saat test gagal (berguna untuk debugging)
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Dev server tidak di-autostart oleh Playwright.
  // Jalankan `npm run dev` tersendiri sebelum test.
  // (Uncomment webServer di bawah jika ingin Playwright yang mengelolanya)
  //
  // webServer: {
  //   command: 'nvm use 20.19.1 && npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  // },
});
