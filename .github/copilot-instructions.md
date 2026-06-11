# Copilot Instructions — Retroppies Dashboard

## 1. Baca PRD.md di setiap task

**WAJIB:** Sebelum mengerjakan task apapun, selalu baca `PRD.md` di root project.
Gunakan PRD sebagai acuan untuk:
- Mengetahui fitur apa saja yang sudah selesai (lihat Section 14 checklist)
- Memastikan implementasi sesuai dengan spesifikasi yang ada
- Menentukan apakah ada dependensi antar fitur yang perlu diperhatikan

**Setelah menyelesaikan suatu fitur:** update checklist di `PRD.md` Section 14 — ubah `[ ]` menjadi `[x]`. PRD.md adalah **satu-satunya sumber kebenaran** untuk progress tracking.

Jika user meminta fitur baru yang belum ada di PRD, tambahkan item baru ke Section 14 yang sesuai, lalu kerjakan.

---

## 2. Struktur Project

```
src/
├── api/           — Semua HTTP call (satu file per domain)
├── components/
│   ├── common/    — Shared UI: ConfirmDialog, ErrorAlert, EmptyState, GlobalSnackbar, GlobalErrorBoundary
│   └── layout/    — AppShell, Sidebar, Topbar
├── features/      — Form dialogs & fitur-spesifik komponen (per domain)
├── hooks/         — Custom hooks (usePermissions, useLogout)
├── mocks/         — dummyAuth.ts (DUMMY_MODE switch untuk demo tanpa API)
├── pages/         — One file per route
├── routes/        — AppRoutes, ProtectedRoute
├── stores/        — Zustand: authStore, scopeStore, uiStore
└── theme/         — MUI theme.ts
```

---

## 3. Tech Stack & Versi

| Package | Versi | Catatan penting |
|---|---|---|
| React | 19 | JSX transform baru — tidak perlu `import React` kecuali pakai `React.Something` eksplisit |
| MUI | **v9.0.1** | System props (`mb`, `fontWeight`, dll) **tidak bisa** sebagai direct prop — harus di `sx={{}}` |
| Zod | **v4** | `invalid_type_error` dihapus dari `z.number()` |
| TanStack Query | v5 | |
| React Router | v6 | |
| Zustand | v5 | |

---

## 4. Aturan MUI v9 (PENTING — melanggar ini = TypeScript error)

```tsx
// ❌ SALAH (MUI v5/v6 pattern)
<Typography fontWeight={700} mb={2}>
<Stack justifyContent="space-between" gap={2}>
<Box flex={1} mt={2}>
<Grid item xs={12} sm={6}>
<TextField inputProps={{ min: 0 }} />
<TextField InputProps={{ endAdornment: ... }} />
<Menu PaperProps={{ sx: { mt: 1 } }} />
<ListItemText primaryTypographyProps={{ fontWeight: 600 }} />

// ✅ BENAR (MUI v9)
<Typography sx={{ fontWeight: 700, mb: 2 }}>
<Stack sx={{ justifyContent: 'space-between', gap: 2 }}>
<Box sx={{ flex: 1, mt: 2 }}>
<Grid size={{ xs: 12, sm: 6 }}>
<TextField slotProps={{ htmlInput: { min: 0 } }} />
<TextField slotProps={{ input: { endAdornment: ... } }} />
<Menu slotProps={{ paper: { sx: { mt: 1 } } }} />
<ListItemText slotProps={{ primary: { style: { fontWeight: 600 } } }} />
```

---

## 5. Pola API & Data Fetching

- Semua server state via **TanStack Query** — jangan simpan response API di useState.
- Query key: `[domain, tenantId, ...params]`
- Mutasi selalu panggil `queryClient.invalidateQueries` on success.
- Error message: gunakan `extractErrorMessage(err)` dari `src/api/client.ts`.

```ts
// Contoh pola
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['products', activeTenantId, page, search],
  queryFn: () => productsApi.list({ tenant_id: activeTenantId!, page, limit: 15, search }),
  enabled: activeTenantId !== null,
});
```

---

## 6. Auth & Permission

- Access token disimpan **in-memory only** di `authStore` — tidak pernah ke localStorage.
- `DUMMY_MODE` di `src/mocks/dummyAuth.ts`: set `true` untuk demo tanpa API, `false` untuk produksi.
- Permission check via `usePermissions().can('feature:action')`.
- Role hierarchy: `admin` > `outlet_manager`.

---

## 7. Coding Style

### Penggunaan Warna

Selalu gunakan **import langsung** dari `src/theme/colors.ts` — jangan pakai `useTheme()` hook hanya untuk mengambil warna.

```tsx
// ✅ BENAR — import langsung
import { colors } from '@/theme/colors';

<Box sx={{ backgroundColor: colors.brand[50], color: colors.base[900] }} />
<Box sx={{ borderColor: colors.border[200] }} />
<Typography sx={{ color: colors.woodTone[500] }} />

// ❌ SALAH — hook hanya untuk warna
const theme = useTheme();
<Box sx={{ backgroundColor: theme.palette.primary.main }} />
```

Referensi key yang tersedia:

| Key | Contoh akses |
|---|---|
| Brand/Primary | `colors.brand[500]` |
| Base | `colors.base[900]` |
| Border | `colors.border[200]` |
| Secondary | `colors.secondary[500]` |
| Accent | `colors.accent[500]` |
| Wood Tone | `colors.woodTone[500]` |
| Highlight | `colors.highlight[500]` |
| Error | `colors.error[500]` |

> `useTheme()` hanya boleh dipakai jika membutuhkan breakpoint (`theme.breakpoints`) atau nilai theme non-warna lainnya.

---

### Penanganan Tanggal & Waktu (WAJIB)

Selalu gunakan **dayjs dengan plugin UTC** untuk semua operasi tanggal — baik untuk parsing, perbandingan, maupun formatting. Tujuannya agar tampilan dan logika berbasis waktu server, tidak bergeser mengikuti timezone browser pengguna.

**Setup (satu kali per file yang menggunakan dayjs):**

```ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
```

**Aturan penggunaan:**

```ts
// ✅ BENAR — parse ISO string dari server dalam UTC
dayjs.utc('2026-01-01T00:00:00Z').format('DD MMM HH:mm')  // → "01 Jan 00:00"
dayjs.utc('2026-01-01T00:00:00Z').isBefore(dayjs.utc())   // perbandingan dalam UTC

// ❌ SALAH — parse tanpa UTC (bergeser ke timezone browser)
dayjs('2026-01-01T00:00:00Z').format('DD MMM HH:mm')  // hasilnya berbeda tiap timezone
new Date('2026-01-01T00:00:00Z').toLocaleDateString()  // bergantung locale browser
```

**Format tampilan standar:**

| Kebutuhan | Format | Contoh |
|---|---|---|
| Tanggal + jam | `DD MMM HH:mm` | `01 Jan 00:00` |
| Tanggal saja | `DD MMM YYYY` | `01 Jan 2026` |
| Tanggal pendek | `DD MMM` | `01 Jan` |
| ISO untuk API | `.toISOString()` atau `.format()` | `2026-01-01T00:00:00Z` |

**Helper function yang konsisten dipakai (contoh dari VouchersPage):**

```ts
/** Parse ISO string dalam UTC — selalu mencerminkan waktu server */
function parseDate(isoString: string) {
    return dayjs.utc(isoString);
}
```

> Jangan gunakan `dayjs()` tanpa `.utc()` untuk data yang berasal dari API/server.
> `dayjs()` tanpa plugin UTC hanya boleh untuk keperluan UI lokal yang tidak bergantung pada data server.

---

## 8. Playwright Testing — WAJIB di Setiap Fitur

**Aturan:** Setiap fitur baru yang dikerjakan — baik karena diminta user maupun karena timbul sebagai dependensi implementasi — WAJIB disertai Playwright test.

### Kapan membuat test baru
- Setiap kali membuat atau memodifikasi page baru → tambahkan test render + no-crash
- Setiap form baru → tambahkan test validasi (required fields, batas min/max, format)
- Setiap dialog/modal baru → tambahkan test open, close, submit kosong
- Setiap RBAC/permission baru → tambahkan test tiap role yang relevan

### Struktur file test
```
tests/
├── helpers/auth.ts      — fixture authedPage, login(), collectErrors()
├── auth.spec.ts         — login, auth guard, logout
├── navigation.spec.ts   — semua halaman load tanpa error, sidebar per role
├── products.spec.ts     — form validation Products
├── vouchers.spec.ts     — form validation Vouchers
└── features.spec.ts     — Timers, Templates, Transactions, Accounts
```

Tambahkan `test.describe` baru ke `tests/features.spec.ts` jika fiturnya kecil,
atau buat file `tests/<feature>.spec.ts` tersendiri jika fiturnya besar (≥ 5 test case).

### Template test minimal
```ts
import { test, expect } from './helpers/auth';

test.describe('NamaFitur Page', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/app/route-fitur');
    await page.waitForTimeout(500);
  });

  test('halaman berhasil dirender', async ({ authedPage: page }) => {
    await expect(page.getByText('Judul Halaman')).toBeVisible();
  });

  test('submit form kosong menampilkan validasi', async ({ authedPage: page }) => {
    await page.getByRole('button', { name: /simpan/i }).click();
    await expect(page.getByText(/wajib diisi/i)).toBeVisible();
  });
});
```

### Setelah membuat test
1. Tambahkan entry ke `PRD.md` Section 14.12 dengan status `[x]`
2. Jalankan verifikasi: `npx playwright test <file> --reporter=line`

### Cara jalankan
```bash
npx playwright test                  # semua test headless
npx playwright test --ui             # visual mode
npx playwright test features         # satu file saja
npx playwright show-report           # laporan HTML
```

---

## 9. Jangan lakukan ini

- Jangan simpan token di `localStorage` atau `sessionStorage`.
- Jangan tambahkan fitur di luar scope yang diminta.
- Jangan buat file dokumentasi/markdown baru kecuali diminta eksplisit.
- Jangan pakai system props MUI di luar `sx` (lihat aturan v9 di atas).
- Jangan pakai `invalid_type_error` pada `z.number()` (Zod v4).
- Jangan kerjakan fitur tanpa test Playwright — pastikan selalu ada minimal test render dan validasi.
