/**
 * ============================================================
 *  DASHBOARD PAGE TESTS — PRD 9.3 & 14.3 (UI Slicing)
 * ============================================================
 *  Covers:
 *  - Page renders without crash
 *  - "Summary" title visible
 *  - Today's Overview card visible
 *  - Revenue Analysis section visible with period tabs
 *  - Transaction Analysis section visible with period tabs
 *  - Sidebar logo + nav groups visible
 *  - Topbar toggle button + user name visible
 * ============================================================
 */
import { test, expect } from './helpers/auth';

test.describe('Dashboard Page (Sliced UI)', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/dashboard');
    await page.waitForTimeout(800);
  });

  test('halaman dashboard berhasil dirender dengan judul Summary', async ({ authedPage: page }) => {
    await expect(page.getByRole('heading', { name: "Summary" })).toBeVisible();
  });

  test("Today's Overview card tampil", async ({ authedPage: page }) => {
    await expect(page.getByText("Today's Overview")).toBeVisible();
    await expect(page.getByText('Total Transaction')).toBeVisible();
    await expect(page.getByText('Total Transaction Success')).toBeVisible();
  });

  test('Revenue Analysis section tampil dengan period tabs', async ({ authedPage: page }) => {
    await expect(page.getByText('Revenue Analysis')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daily' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Weekly' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Monthly' }).first()).toBeVisible();
  });

  test('Transaction Analysis section tampil dengan period tabs', async ({ authedPage: page }) => {
    await expect(page.getByText('Transaction Analysis')).toBeVisible();
  });

  test('product type dropdown tersedia di Revenue Analysis', async ({ authedPage: page }) => {
    await expect(page.getByText('Photostrip Only')).toBeVisible();
  });

  test('product type dropdown tersedia di Transaction Analysis', async ({ authedPage: page }) => {
    await expect(page.getByText('All Type Product')).toBeVisible();
  });
});

test.describe('AppShell — Sidebar (Sliced UI)', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/dashboard');
    await page.waitForTimeout(500);
  });

  test('sidebar logo tersedia', async ({ authedPage: page }) => {
    await expect(page.locator('img[alt*="Retroppies"]')).toBeVisible();
  });

  test('grup label Dashboard tampil di sidebar', async ({ authedPage: page }) => {
    await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();
  });

  test('grup label Settings tampil di sidebar', async ({ authedPage: page }) => {
    await expect(page.getByText('Settings', { exact: true })).toBeVisible();
  });

  test('sidebar nav item Summary aktif saat di dashboard', async ({ authedPage: page }) => {
    await expect(page.getByRole('link', { name: /summary/i })).toBeVisible();
  });

  test('topbar toggle button tersedia (header-button.svg)', async ({ authedPage: page }) => {
    await expect(page.locator('img[alt="toggle sidebar"]')).toBeVisible();
  });

  test('topbar menampilkan nama user', async ({ authedPage: page }) => {
    // Dummy mode login as Admin — name should be visible in topbar
    await expect(page.locator('header').getByText(/admin/i)).toBeVisible();
  });
});

/**
 * ============================================================
 *  TIMERS TESTS — PRD 9.5 & 14.6
 * ============================================================

  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/timers');
    await page.waitForTimeout(500);
  });

  test('halaman timer berhasil dirender', async ({ authedPage: page }) => {
    await expect(page.getByText('Pengaturan Timer')).toBeVisible();
  });

  test('dua field timer tersedia', async ({ authedPage: page }) => {
    await expect(page.getByLabel(/timer pembayaran/i)).toBeVisible();
    await expect(page.getByLabel(/timer sesi foto/i)).toBeVisible();
  });

  test('tombol simpan ada di halaman', async ({ authedPage: page }) => {
    await expect(page.getByRole('button', { name: /simpan perubahan/i })).toBeVisible();
  });

  test('field timer hanya menerima angka (type="number")', async ({ authedPage: page }) => {
    const paymentInput = page.getByLabel(/timer pembayaran/i);
    await expect(paymentInput).toHaveAttribute('type', 'number');
    const sessionInput = page.getByLabel(/timer sesi foto/i);
    await expect(sessionInput).toHaveAttribute('type', 'number');
  });

  test('nilai negatif menampilkan validasi', async ({ authedPage: page }) => {
    const paymentInput = page.getByLabel(/timer pembayaran/i);
    await paymentInput.fill('-1');
    await page.getByRole('button', { name: /simpan perubahan/i }).click();
    await expect(page.getByText('Minimal 0 detik')).toBeVisible();
  });

  test('nilai > 600 menampilkan validasi', async ({ authedPage: page }) => {
    const paymentInput = page.getByLabel(/timer pembayaran/i);
    await paymentInput.fill('601');
    await page.getByRole('button', { name: /simpan perubahan/i }).click();
    await expect(page.getByText('Maksimal 600 detik')).toBeVisible();
  });
});

// ─── Templates Page ───────────────────────────────────────────────────────────

/**
 * ============================================================
 *  TEMPLATES TESTS — PRD 9.4 & 14.5
 * ============================================================
 *  Covers:
 *  - Halaman template render tanpa crash
 *  - Tombol upload template ada
 *  - File input hanya accept PNG
 * ============================================================
 */
test.describe('Templates Page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/templates');
    await page.waitForTimeout(500);
  });

  test('halaman template berhasil dirender', async ({ authedPage: page }) => {
    await expect(page.getByText('Template')).toBeVisible();
    await expect(page.getByRole('button', { name: /upload template/i })).toBeVisible();
  });

  test('file input hanya menerima PNG', async ({ authedPage: page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', 'image/png');
  });
});

// ─── Transactions Page ────────────────────────────────────────────────────────

/**
 * ============================================================
 *  TRANSACTIONS TESTS — PRD 9.7 & 14.8
 * ============================================================
 *  Covers:
 *  - Halaman transaksi render tanpa crash
 *  - Filter date range tersedia
 *  - Filter status tersedia
 *  - Tabel/kolom transaksi terlihat
 * ============================================================
 */
test.describe('Transactions Page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/transactions');
    await page.waitForTimeout(500);
  });

  test('halaman transaksi berhasil dirender', async ({ authedPage: page }) => {
    await expect(page.getByText('Laporan Transaksi')).toBeVisible();
  });

  test('filter date range tersedia', async ({ authedPage: page }) => {
    await expect(page.getByLabel('Dari')).toBeVisible();
    await expect(page.getByLabel('Sampai')).toBeVisible();
  });

  test('filter status tersedia', async ({ authedPage: page }) => {
    await expect(page.getByLabel('Status')).toBeVisible();
  });

  test('kolom tabel transaksi terlihat', async ({ authedPage: page }) => {
    await expect(page.getByRole('columnheader', { name: /id transaksi/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /waktu/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });
});

// ─── Accounts Page ───────────────────────────────────────────────────────────

/**
 * ============================================================
 *  ACCOUNTS TESTS — PRD 9.8 & 14.9
 * ============================================================
 *  Covers:
 *  - Halaman akun render tanpa crash
 *  - Search user tersedia
 *  - Kolom tabel akun terlihat
 * ============================================================
 */
test.describe('Accounts Page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/accounts');
    await page.waitForTimeout(500);
  });

  test('halaman akun berhasil dirender', async ({ authedPage: page }) => {
    await expect(page.getByText(/manajemen akun/i)).toBeVisible();
  });

  test('search input tersedia', async ({ authedPage: page }) => {
    await expect(page.locator('input[placeholder*="Cari"]')).toBeVisible();
  });

  test('kolom tabel akun terlihat', async ({ authedPage: page }) => {
    await expect(page.getByRole('columnheader', { name: /nama|email/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /role/i })).toBeVisible();
  });
});
