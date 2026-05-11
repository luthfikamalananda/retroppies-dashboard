/**
 * ============================================================
 *  NAVIGATION TESTS — PRD 7 (Information Architecture)
 * ============================================================
 *  Covers:
 *  - Semua halaman protected dapat diakses setelah login
 *  - Tidak ada JS runtime error saat navigasi antar halaman
 *  - Sidebar menampilkan menu yang benar per role
 *  - Error boundary TIDAK muncul (crash = fail)
 * ============================================================
 */
import { test, expect } from './helpers/auth';
import { collectErrors } from './helpers/auth';

const ALL_PAGES = [
  { label: 'Dashboard',  path: '/app/dashboard',    sidebar: 'Dashboard' },
  { label: 'Produk',     path: '/app/products',     sidebar: 'Produk' },
  { label: 'Template',   path: '/app/templates',    sidebar: 'Template' },
  { label: 'Timer',      path: '/app/timers',       sidebar: 'Timer' },
  { label: 'Voucher',    path: '/app/vouchers',     sidebar: 'Voucher' },
  { label: 'Transaksi',  path: '/app/transactions', sidebar: 'Transaksi' },
  { label: 'Akun',       path: '/app/accounts',     sidebar: 'Akun' },
];

test.describe('Navigation — semua halaman render tanpa crash', () => {
  // authedPage = fixture yang sudah login sebagai admin
  test('navigasi via sidebar tidak menghasilkan JS error', async ({ authedPage: page }) => {
    const errors = collectErrors(page);

    for (const { sidebar } of ALL_PAGES) {
      await page.click(`text=${sidebar}`);
      // Tunggu halaman settle (komponen lazy load)
      await page.waitForTimeout(800);
      // Pastikan error boundary tidak tampil
      await expect(page.getByText('Oops, terjadi kesalahan')).not.toBeVisible();
    }

    expect(errors).toHaveLength(0);
  });

  // Test setiap halaman secara individual (goto langsung)
  for (const { label, path } of ALL_PAGES) {
    test(`halaman ${label} (${path}) tidak crash`, async ({ authedPage: page }) => {
      const errors = collectErrors(page);
      await page.goto(path);
      await page.waitForTimeout(800);
      await expect(page.getByText('Oops, terjadi kesalahan')).not.toBeVisible();
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Navigation — sidebar visibility per role', () => {
  test('admin melihat semua menu sidebar', async ({ authedPage: page }) => {
    const menuLabels = ['Dashboard', 'Produk', 'Template', 'Timer', 'Voucher', 'Transaksi', 'Akun'];
    for (const label of menuLabels) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('manager hanya melihat menu sesuai permission', async ({ page }) => {
    // Login sebagai manager
    await page.goto('/login');
    await page.fill('input[name="username"]', 'manager@retroppies.com');
    await page.fill('input[name="password"]', 'manager123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Manager punya: dashboard, vouchers, transactions
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voucher' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Transaksi' })).toBeVisible();

    // Manager tidak punya: products, templates, timers, accounts
    await expect(page.getByRole('link', { name: 'Produk' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Template' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Timer' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Akun' })).not.toBeVisible();
  });
});

test.describe('Navigation — AppShell layout', () => {
  test('sidebar collapse toggle berfungsi', async ({ authedPage: page }) => {
    // Tombol collapse ada di topbar
    const collapseBtn = page.locator('header button').first();
    await expect(collapseBtn).toBeVisible();
    // Klik collapse
    await collapseBtn.click();
    await page.waitForTimeout(300);
    // Label sidebar tersembunyi saat collapsed
    await expect(page.getByRole('link', { name: 'Produk' })).not.toBeVisible();
    // Klik lagi untuk expand
    await collapseBtn.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('link', { name: 'Produk' })).toBeVisible();
  });

  test('topbar menampilkan nama atau avatar user', async ({ authedPage: page }) => {
    // Avatar dengan initial 'A' (admin)
    await expect(page.getByRole('button', { name: 'A' })).toBeVisible();
  });
});
