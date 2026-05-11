---
agent: agent
description: 'Buat halaman baru lengkap sesuai pola codebase Retroppies'
---

Buat halaman baru untuk fitur **${input:featureName}** dengan spesifikasi berikut:

## Konteks Wajib
Baca dulu file-file ini sebelum menulis kode:
- [PRD.md](../../PRD.md) — pastikan fitur sesuai spec dan update checklist Section 14
- [ProductsPage.tsx](../../src/pages/ProductsPage.tsx) — gunakan sebagai pola halaman CRUD dengan tabel
- [ProductFormDialog.tsx](../../src/features/products/ProductFormDialog.tsx) — gunakan sebagai pola form dialog
- [products.api.ts](../../src/api/products.api.ts) — gunakan sebagai pola API module

## Yang harus dibuat
1. `src/api/${input:featureName}.api.ts` — API module (list, create, update, delete)
2. `src/pages/${input:PageName}Page.tsx` — halaman utama
3. `src/features/${input:featureName}/${input:PageName}FormDialog.tsx` — form dialog (jika CRUD)

## Aturan wajib
- MUI v9: semua layout props di dalam `sx={{}}` — jangan pakai shorthand props langsung
- Grid: gunakan `<Grid size={{ xs: 12, sm: 6 }}>` bukan `<Grid item xs={12}>`
- TextField: gunakan `slotProps={{ htmlInput: { min: 0 } }}` bukan `inputProps`
- Zod v4: jangan pakai `invalid_type_error` di `z.number()`
- Semua server state via TanStack Query — jangan simpan API response di `useState`
- Query key format: `['${input:featureName}', activeTenantId, ...params]`
- Selalu `queryClient.invalidateQueries` on mutation success
- Tambahkan route ke `src/routes/AppRoutes.tsx`
- Tambahkan menu item ke `src/components/layout/Sidebar.tsx`
- Update checklist di `PRD.md` Section 14 setelah selesai
