/**
 * ============================================================
 *  PRODUCTS TESTS — PRD 9.3 & 14.4
 * ============================================================
 *  Covers:
 *  - Halaman produk render tanpa crash
 *  - Tombol "Tambah Produk" membuka dialog form
 *  - Validasi form: field wajib diisi
 *  - Validasi form: harga tidak boleh negatif
 *  - Dialog bisa ditutup (cancel)
 *  - Field pencarian produk terlihat
 * ============================================================
 */
import { test, expect } from './helpers/auth';

test.describe('Products Page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/products');
    await page.waitForTimeout(500);
  });

  test('halaman produk berhasil dirender', async ({ authedPage: page }) => {
    await expect(page.getByText('Produk')).toBeVisible();
    await expect(page.getByRole('button', { name: /tambah produk/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="Cari"]')).toBeVisible();
  });

  test('tombol tambah produk membuka dialog form', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /tambah produk/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/kode produk/i)).toBeVisible();
    await expect(page.getByLabel(/nama produk/i)).toBeVisible();
    await expect(page.getByLabel(/harga/i)).toBeVisible();
  });

  test('form produk: submit kosong menampilkan validasi', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /tambah produk/i }).click();
    await page.getByRole('button', { name: /simpan/i }).click();
    await expect(page.getByText('Kode produk wajib diisi')).toBeVisible();
    await expect(page.getByText('Nama produk wajib diisi')).toBeVisible();
  });

  test('form produk: harga negatif menampilkan validasi', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /tambah produk/i }).click();
    await page.getByLabel(/kode produk/i).fill('TEST-001');
    await page.getByLabel(/nama produk/i).fill('Test Produk');
    await page.getByLabel(/harga/i).fill('-1000');
    await page.getByRole('button', { name: /simpan/i }).click();
    await expect(page.getByText('Harga tidak boleh negatif')).toBeVisible();
  });

  test('dialog produk bisa ditutup dengan tombol batal', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /tambah produk/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /batal/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('search input menerima input teks', async ({ authedPage: page }) => {
    const searchInput = page.locator('input[placeholder*="Cari"]');
    await searchInput.fill('test produk');
    await expect(searchInput).toHaveValue('test produk');
  });
});
