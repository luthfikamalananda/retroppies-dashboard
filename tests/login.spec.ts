import { test, expect } from '@playwright/test';

const USERNAME = process.env.PW_TEST_USERNAME;
const PASSWORD = process.env.PW_TEST_PASSWORD;

test.describe('Login', () => {
    test('logs in with valid credentials and reaches the dashboard', async ({ page }) => {
        test.skip(!USERNAME || !PASSWORD, 'PW_TEST_USERNAME / PW_TEST_PASSWORD not set in .env');

        await page.goto('/login');

        await page.locator('#login-username').fill(USERNAME!);
        await page.locator('#login-password').fill(PASSWORD!);
        await page.getByRole('button', { name: 'Log In' }).click();

        await expect(page).toHaveURL(/\/app\/dashboard/);
    });

    test('shows an error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.locator('#login-username').fill('invalid-user-does-not-exist');
        await page.locator('#login-password').fill('wrong-password');
        await page.getByRole('button', { name: 'Log In' }).click();

        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });
});
