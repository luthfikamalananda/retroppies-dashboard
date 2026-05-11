import { test, expect } from './helpers/auth';
import path from 'path';

test.describe('Templates Page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/templates');
    await page.waitForTimeout(500);
  });

  test('halaman berhasil dirender dengan judul dan breadcrumb', async ({ authedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Your Layout' })).toBeVisible();
    await expect(page.getByText('Template & Layout')).toBeVisible();
    await expect(page.getByText('Your Layout').last()).toBeVisible();
  });

  test('tombol Upload Layout tersedia', async ({ authedPage: page }) => {
    await expect(page.getByRole('button', { name: /upload layout/i })).toBeVisible();
  });

  test('klik Upload Layout membuka file picker (input file tersedia)', async ({ authedPage: page }) => {
    const fileInput = page.locator('input[type="file"][accept="image/png"]');
    await expect(fileInput).toBeAttached();
  });

  test('upload file non-PNG menampilkan pesan error', async ({ authedPage: page }) => {
    const fileInput = page.locator('input[type="file"][accept="image/png"]');

    // Buat file JPEG dummy via buffer
    await fileInput.setInputFiles({
      name: 'dummy.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg-content'),
    });

    await expect(page.getByText('Hanya file PNG yang diperbolehkan.')).toBeVisible();
  });

  test('upload PNG valid menampilkan preview dan tombol Upload/Batal', async ({ authedPage: page }) => {
    const fileInput = page.locator('input[type="file"][accept="image/png"]');

    // PNG minimal (1x1 pixel transparent PNG)
    const minimalPng = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
      '0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
      'hex'
    );

    await fileInput.setInputFiles({
      name: 'layout.png',
      mimeType: 'image/png',
      buffer: minimalPng,
    });

    await expect(page.getByRole('button', { name: /^upload$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /batal/i })).toBeVisible();
    await expect(page.getByText('layout.png')).toBeVisible();
  });

  test('tombol Batal menutup preview upload', async ({ authedPage: page }) => {
    const fileInput = page.locator('input[type="file"][accept="image/png"]');

    const minimalPng = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
      '0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
      'hex'
    );

    await fileInput.setInputFiles({
      name: 'layout.png',
      mimeType: 'image/png',
      buffer: minimalPng,
    });

    await expect(page.getByText('layout.png')).toBeVisible();
    await page.getByRole('button', { name: /batal/i }).click();
    await expect(page.getByText('layout.png')).not.toBeVisible();
  });

  test('breadcrumb home link mengarah ke dashboard', async ({ authedPage: page }) => {
    const homeLink = page.locator('nav[aria-label="breadcrumb"] a').first();
    await homeLink.click();
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 3000 });
  });

  test('navigasi sidebar ke Design Template berhasil', async ({ authedPage: page }) => {
    // Navigasi dari halaman lain lalu kembali ke templates
    await page.goto('/app/dashboard');
    await page.getByRole('link', { name: /design template/i }).click();
    await expect(page).toHaveURL(/\/app\/templates/);
    await expect(page.getByRole('heading', { name: 'Your Layout' })).toBeVisible();
  });
});
