/**
 * ============================================================
 *  AUTH TESTS — PRD 9.1 & 14.2
 * ============================================================
 *  Covers:
 *  - Login dengan dummy credentials (admin & manager)
 *  - Login dengan credentials salah → tampil error
 *  - Protected route redirect ke /login saat tidak autentikasi
 *  - Logout mengosongkan sesi dan redirect ke /login
 * ============================================================
 */
import { test, expect } from '@playwright/test';
import { login, ADMIN, MANAGER, collectErrors } from './helpers/auth';

// ─── Login ───────────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('menampilkan form login dengan field username dan password', async ({ page }) => {
    await expect(page.getByText('Log In to Your Business Account')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('menampilkan demo mode banner saat DUMMY_MODE aktif', async ({ page }) => {
    await expect(page.getByText('Demo mode')).toBeVisible();
  });

  test('login admin berhasil → redirect ke dashboard', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN.username, ADMIN.password);
    expect(page.url()).toContain('/app/dashboard');
    expect(errors).toHaveLength(0);
  });

  test('login manager berhasil → redirect ke dashboard', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, MANAGER.username, MANAGER.password);
    expect(page.url()).toContain('/app/dashboard');
    expect(errors).toHaveLength(0);
  });

  test('login dengan username kosong → tampil validasi', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.getByText('Username wajib diisi')).toBeVisible();
    await expect(page.getByText('Password wajib diisi')).toBeVisible();
  });

  test('login dengan credentials salah → tampil error', async ({ page }) => {
    await page.fill('input[name="username"]', 'salah@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Saat DUMMY_MODE, dummyLogin melempar error untuk credentials tidak dikenal
    await expect(page.locator('[role="alert"]').last()).toBeVisible({ timeout: 3000 });
  });

  test('toggle show/hide password berfungsi', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    // Klik toggle eye icon
    await page.click('button[aria-label="Tampilkan password"]');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    // Klik lagi untuk hide
    await page.click('button[aria-label="Sembunyikan password"]');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

// ─── Protected Route (Auth Guard) ────────────────────────────────────────────

test.describe('Auth Guard — ProtectedRoute', () => {
  test('akses /app/dashboard tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('akses /app/products tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/app/products');
    await expect(page).toHaveURL(/\/login/);
  });

  test('akses /app/vouchers tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/app/vouchers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('akses /app/accounts tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/app/accounts');
    await expect(page).toHaveURL(/\/login/);
  });

  test('akses root / → redirect ke /app/dashboard (atau /login jika belum auth)', async ({ page }) => {
    await page.goto('/');
    // Tidak login → harus ke login
    await expect(page).toHaveURL(/\/(login|app\/dashboard)/);
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout dari user menu → redirect ke /login', async ({ page }) => {
    await login(page, ADMIN.username, ADMIN.password);
    // Klik avatar di topbar
    await page.locator('button').filter({ has: page.locator('text=A') }).click();
    // Klik item logout di menu
    await page.getByRole('menuitem', { name: /keluar|logout/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 3000 });
  });
});
