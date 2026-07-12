# To-Do: Hubungkan Playwright E2E ke CI

Status: **belum dikerjakan** — eksplorasi Playwright dulu, ini catatan rencana untuk nanti.

## Konteks

- E2E test sudah ada di `tests/` (lihat `playwright.config.ts`), jalan terhadap backend
  asli (tanpa mock), dua environment: `dev` (`PW_DEV_BASE_URL`) dan `production`
  (`PW_PROD_BASE_URL`), dipilih lewat `PW_ENV`.
- CI saat ini (`.github/workflows/deploy.yml`) hanya `build` lalu langsung `deploy` ke VPS
  setiap push ke `main` — **tidak ada gate pengetesan apa pun**. Kalau tidak dihubungkan,
  test yang sudah ditulis tidak pernah otomatis mencegah regresi masuk ke production.
- Login E2E butuh kredensial nyata (`PW_TEST_USERNAME` / `PW_TEST_PASSWORD`), sekarang
  hanya ada di `.env` lokal (gitignored) — di CI harus lewat GitHub Secrets.

## To-Do

- [ ] **Putuskan target environment untuk test di CI.**
      Pilihan: (a) test ke `dev` dengan build/preview lokal di runner (`webServer` sudah
      auto-start via `npm run dev`/`vite preview`), atau (b) test ke `production` setelah
      deploy selesai (lebih realistis, tapi berarti bug baru ketahuan *setelah* live).
      Rekomendasi awal: gate dulu pakai (a) sebelum deploy; opsional tambah smoke test ke
      (b) setelah deploy sebagai pengecekan akhir.
- [ ] **Tambah GitHub Secrets**: `PW_TEST_USERNAME`, `PW_TEST_PASSWORD`, dan
      `PW_PROD_BASE_URL` (kalau nanti dipakai smoke test pasca-deploy). Jangan hardcode di
      workflow file.
- [ ] **Tambah job baru di `.github/workflows/deploy.yml`** (atau file terpisah,
      `.github/workflows/e2e.yml`) yang: checkout → `npm ci` → `npx playwright install
      --with-deps chromium` → `npm run test:e2e`.
- [ ] **Jadikan job `build-and-deploy` bergantung ke job test** (`needs: e2e`), supaya
      deploy ke VPS otomatis batal kalau ada test yang gagal.
- [ ] **Upload `playwright-report/` sebagai artifact** (`actions/upload-artifact`) saat
      test gagal, supaya bisa didownload dan dibuka manual (lihat screenshot/trace) tanpa
      perlu reproduce di lokal.
- [ ] **Putuskan pemicu (trigger).** Sesuai judul to-do ini ("tiap commit ke main") berarti
      `on: push: branches: [main]` — tapi pertimbangkan juga jalankan di setiap **Pull
      Request** ke `main`, supaya regresi ketahuan sebelum merge, bukan sesudah.
- [ ] **Tinjau ulang cakupan test** sebelum di-gate — pastikan hanya alur kritis (bukan
      semua halaman) supaya CI tidak jadi lambat/rapuh. Lihat catatan tradeoff di obrolan
      sebelumnya soal test pyramid.
- [ ] **(Opsional) Cache browser Playwright** antar run CI (`actions/cache` pada
      `~/.cache/ms-playwright`) supaya tidak download ulang tiap kali.
- [ ] **Auto-regenerate `docs/test-coverage.md`** di job test (`npm run
      test:e2e:coverage-doc` setelah `test:e2e`), lalu commit-back hasilnya (atau upload
      sebagai artifact) supaya dokumen coverage selalu sinkron dengan test terbaru di
      `main`, tidak cuma ter-generate manual di lokal developer.

## Referensi

- Config saat ini: `playwright.config.ts`, `tests/global-setup.ts`, `tests/fixtures.ts`
- Generator dokumen coverage: `scripts/generate-test-coverage.mjs` → `docs/test-coverage.md`
- Workflow yang akan diubah: `.github/workflows/deploy.yml`
