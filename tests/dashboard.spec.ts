import { test, expect } from './fixtures';

test.describe('Dashboard (already authenticated)', () => {
    test('lands directly on the dashboard without seeing the login form', async ({ page }) => {
        await page.goto('/app/dashboard');

        await expect(page).toHaveURL(/\/app\/dashboard/);
        await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible();
    });
});
