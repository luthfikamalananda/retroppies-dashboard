import { test as base, type Page } from '@playwright/test';

// ─── Credentials (DUMMY_MODE = true) ────────────────────────────────────────
export const ADMIN = {
  username: 'admin@retroppies.com',
  password: 'admin123',
};
export const MANAGER = {
  username: 'manager@retroppies.com',
  password: 'manager123',
};

// ─── Login helper ────────────────────────────────────────────────────────────
export async function login(page: Page, username = ADMIN.username, password = ADMIN.password) {
  await page.goto('/login');
  await page.waitForSelector('input[name="username"]');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 5000 });
}

// ─── No-crash helper ─────────────────────────────────────────────────────────
// Pasang listener error SEBELUM navigasi, lalu navigasi, lalu return errors.
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// ─── Custom fixture: authenticated page ──────────────────────────────────────
// Gunakan ini agar setiap test otomatis login tanpa mengulang kode.
//
// Contoh:
//   import { test } from '../helpers/auth';
//   test('halaman produk', async ({ authedPage }) => { ... });
//
type AuthFixtures = { authedPage: Page };

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
