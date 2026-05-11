---
agent: agent
description: 'Tambahkan dummy data untuk halaman tertentu agar bisa di-preview tanpa API'
---

## Konteks Wajib
Baca dulu:
- [dummyAuth.ts](../../src/mocks/dummyAuth.ts) — lihat pola dummy yang sudah ada
- [PRD.md](../../PRD.md) Section 8 — data model untuk tiap fitur

## Task
Tambahkan dummy data untuk halaman **${input:pageName}** agar bisa di-preview tanpa backend.

### Yang perlu dilakukan
1. Buat atau tambahkan ke `src/mocks/dummy${input:pageName}.ts`:
   - Array data dummy sesuai tipe dari `src/api/${input:featureName}.api.ts`
   - Fungsi `dummy${input:pageName}Api` yang mengembalikan `Promise` (dengan delay 300ms)

2. Di `src/pages/${input:pageName}Page.tsx`, wrap query dengan kondisi `DUMMY_MODE`:
```ts
queryFn: () => DUMMY_MODE
  ? dummy${input:pageName}Api.list(...)
  : ${input:featureName}Api.list(...),
```

### Aturan
- Import `DUMMY_MODE` dari `src/mocks/dummyAuth.ts`
- Simulasi delay dengan `setTimeout` (300–500ms) agar loading state terlihat
- Data dummy minimal 3–5 item agar pagination/filter bisa diuji
- Jangan ubah tipe data — dummy harus match persis dengan interface di `api/*.ts`
