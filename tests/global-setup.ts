import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SESSION_STORAGE_FILE = path.resolve(
    __dirname,
    '../playwright/.auth/session-storage.json',
);

// Runs once before the whole test run: logs in for real through the UI and
// captures sessionStorage (where authStore persists the logged-in user), so
// other tests can skip the login form and start already authenticated.
export default async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;
    const username = process.env.PW_TEST_USERNAME;
    const password = process.env.PW_TEST_PASSWORD;

    if (!username || !password) {
        console.warn(
            '[global-setup] PW_TEST_USERNAME / PW_TEST_PASSWORD not set — skipping login capture.',
        );
        return;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage({ baseURL });

    await page.goto('/login');
    await page.locator('#login-username').fill(username);
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL(/\/app\/dashboard/);

    const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));

    fs.mkdirSync(path.dirname(SESSION_STORAGE_FILE), { recursive: true });
    fs.writeFileSync(SESSION_STORAGE_FILE, sessionStorage);

    await browser.close();
}
