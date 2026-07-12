import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

/**
 * Which environment to hit is picked with PW_ENV=dev|production.
 * Defaults to dev so `npx playwright test` "just works" locally.
 */
const env = process.env.PW_ENV === 'production' ? 'production' : 'dev';

const baseURL =
    env === 'production'
        ? process.env.PW_PROD_BASE_URL
        : process.env.PW_DEV_BASE_URL;

if (!baseURL) {
    throw new Error(
        `Missing base URL for PW_ENV=${env}. Set PW_DEV_BASE_URL / PW_PROD_BASE_URL in .env`,
    );
}

export default defineConfig({
    testDir: './tests',
    globalSetup: './tests/global-setup.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'on',
        video: 'off',
        // Jeda antar aksi saat headed (PW_SLOWMO), supaya gerakan browser
        // bisa diamati manual alih-alih lewat dalam sekejap.
        launchOptions: {
            slowMo: process.env.PW_SLOWMO ? Number(process.env.PW_SLOWMO) : 0,
        },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Only spin up the local dev server for the "dev" env — production is
    // already deployed and shouldn't be started locally.
    webServer:
        env === 'dev'
            ? {
                  command: 'npm run dev',
                  url: baseURL,
                  reuseExistingServer: !process.env.CI,
              }
            : undefined,
});
