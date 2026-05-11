---
agent: agent
description: 'Aktifkan integrasi API sungguhan — nonaktifkan DUMMY_MODE'
---

## Konteks Wajib
Baca dulu:
- [dummyAuth.ts](../../src/mocks/dummyAuth.ts) — lihat DUMMY_MODE saat ini
- [App.tsx](../../src/App.tsx) — lihat BootstrapAuth
- [LoginPage.tsx](../../src/pages/LoginPage.tsx) — lihat onSubmit
- [PRD.md](../../PRD.md) Section 6 — auth requirements

## Task
Ubah `DUMMY_MODE = false` di `src/mocks/dummyAuth.ts` untuk mengaktifkan integrasi API sungguhan.

Setelah itu verifikasi:
1. `BootstrapAuth` di `src/App.tsx` memanggil `authApi.refresh()` saat startup
2. `LoginPage.tsx` memanggil `authApi.login()` bukan `dummyLogin()`
3. Hilangkan info banner "Demo mode" dari login form (atau sembunyikan karena `DUMMY_MODE = false`)

Jangan ubah logika lain — cukup flip satu flag.
