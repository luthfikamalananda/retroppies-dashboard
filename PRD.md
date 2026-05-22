# PRD — Photobooth Franchise Dashboard (Multi-tenant)

**Last updated:** 2026-05-16  
**Owner:** Frontend (Anda)  
**Backend:** Golang REST API (existing)  
**Target users:** Franchise owner/admin, Cafe/outlet (monitoring + limited management)  
**Project type:** Web dashboard (desktop-first), SPA

---

## 0) Ringkasan
Dashboard ini digunakan untuk mengelola dan memantau operasional aplikasi photobooth yang akan di-franchise-kan. Setiap tenant (franchise) dapat melakukan kustomisasi (product, template, voucher, timer) serta monitoring transaksi dan pengelolaan akun/role.

**Catatan penting:** sistem bersifat **multi-tenant** dan access control harus **dienforce oleh backend**. Frontend menerapkan RBAC untuk UX (menyembunyikan menu/aksi) namun tidak menjadi sumber keamanan.

---

## 1) Goals & Non-Goals

### Goals
- User dapat login dan mengakses dashboard sesuai tenant/outlet dan role.
- User dapat melihat ringkasan bisnis (summary + revenue/transaction analysis).
- User dapat mengelola:
  - Product (CRUD)
  - Template gambar (CRUD)
  - Waktu/Timer (edit timer)
  - Voucher (CRUD)
- User dapat melihat laporan transaksi (read-only).
- User dapat melakukan management account/role (sesuai izin backend).

### Non-Goals (untuk saat ini)
- Realtime via WebSocket (cukup via REST + manual refresh).
- Editor template (hanya upload PNG transparan).
- Analytics advanced (prediksi/forecasting) kecuali disediakan backend.
- Offline mode.

---

## 2) Persona & Hak Akses (high-level)
> Final permission mengikuti backend. Berikut asumsi awal agar desain UI jelas.

- **Franchise Owner / Admin**
  - Full: dashboard summary, CRUD product/template/timer/voucher, read report, manage accounts/roles.
- **Cafe / Outlet Manager**
  - Read: summary, report transactions (mungkin terbatas outlet sendiri)
  - Manage: bisa terbatas (mis. voucher only) tergantung kebijakan bisnis.

---

## 3) Assumptions & Dependencies
### Assumptions
- Backend menyediakan endpoint login dan otorisasi per tenant/outlet.
- Data transaksi besar → backend mendukung pagination & filtering.
- Template berupa file PNG dengan transparansi.

### Dependencies (yang perlu disepakati dengan backend)
- Mekanisme auth token:
  - Prefer: **access token short-lived + refresh token via HttpOnly cookie**.
- Endpoint untuk:
  - Summary metrics & analytics
  - Product CRUD
  - Template CRUD + upload
  - Timer read + update timer values
  - Voucher CRUD
  - Transactions report (list + filters + detail)
  - Account/role management (list/create/update, tergantung kebijakan)

---

## 4) Success Metrics
- Time-to-onboard tenant baru < X menit (setup product/template/voucher).
- P0 error rate rendah (login, transaksi report, CRUD utama).
- UX performance:
  - halaman transaksi dengan pagination tetap responsif.
- Security:
  - tidak ada kebocoran data antar tenant/outlet (diverifikasi backend).

---

## 5) Tech Stack (Recommended)
### Frontend
- React + Vite (SPA)
- MUI (Material UI)
- React Router
- TanStack Query (server state)
- Zustand (client/UI state: auth, active tenant/outlet, UI prefs)
- React Hook Form + Zod (form state + validation)
- dayjs (tanggal)

### State & Data Rules
- **Zustand:** auth/session (in-memory), active tenant/outlet, UI preferences, permissions map.
- **TanStack Query:** semua data dari API (products, templates, vouchers, transactions, summary).
- Logout → `queryClient.clear()` untuk mencegah cached data tenant lama muncul.

---

## 6) Security & Auth Requirements
### Recommended Auth Flow (Opsi A)
- Access token disimpan **in-memory** (Zustand, tanpa persist).
- Refresh token di **HttpOnly Secure cookie**.
- Pada app start: panggil `/auth/refresh` untuk bootstrap session.
- API client:
  - attach Authorization header
  - handle 401 → refresh (single-flight) → retry 1x → gagal → logout.

### Must-have security practices
- Tidak menyimpan access token di localStorage jika bisa refresh cookie.
- Tidak menyimpan data sensitif tenant lintas session.
- Hindari `dangerouslySetInnerHTML`.
- Validasi upload file template (type/size/dimensions).
- Pertimbangkan CSP di deployment.

---

## 7) Information Architecture (Pages & Navigation)
### Public
- `/login`

### Protected (requires auth)
- `/app/dashboard` — Summary + charts
- `/app/products` — Product CRUD
- `/app/templates` — Template CRUD (upload PNG)
- `/app/timers` — Timer settings (edit values only)
- `/app/vouchers` — Voucher CRUD
- `/app/transactions` — Report transactions (read-only)
- `/app/accounts` — Management account/role

### Common Layout
- Sidebar (modules)
- Topbar:
  - active tenant/outlet switcher (if multi-access)
  - user menu (profile/logout)
- Breadcrumbs (optional)

---

## 8) Data Model (Frontend View)
> Detail field mengikuti backend, ini baseline untuk UI.

### Product
- `product_code` (string, unique)
- `product_name` (string)
- `price` (number)

### Template
- `image` (PNG file) + metadata
- (opsional) `title/name`, `status`, `created_at`

### Timer (Waktu)
- `datetime` (reference time atau schedule; tergantung backend)
- `payment_timer` (number/duration)
- `photo_session_timer` (number/duration)
- Data pembayaran & sesi foto di-fetch dari backend, **CRUD hanya update timer**

### Voucher
- `voucher_code` (string, unique)
- `voucher_title` (string)
- `discount` (number / percentage? clarify)
- `product_type` (enum/string)
- `period` (start/end date)
- `usage_limit` (number)
- `usage_count` (number, read-only)
- `status` (active/inactive)

### Transaction (Report)
- `transaction_id`
- `date_time`
- `status` (success/failed)
- `amount/revenue`
- `product`
- `payment_method` (if available)
- `outlet/cafe`
- Detail fields as provided

### Account/Role
- `user_id`
- `name/email`
- `tenant/outlet mapping`
- `role`
- Status (active/inactive) if exists

---

## 9) Functional Requirements (By Feature)

## 9.1 Login
### User stories
- Sebagai user, saya bisa login menggunakan akun dari backend.
- Sebagai user, saya tetap login setelah refresh halaman (selama refresh cookie valid).

### Acceptance criteria
- Form login: username/email + password.
- Error state jelas (401 invalid credentials, 5xx server error).
- Setelah login sukses → redirect ke `/app/dashboard`.
- Protected routes tidak bisa diakses tanpa auth.

### UI/UX notes
- Loading button saat submit.
- "Show password" toggle (optional).

---

## 9.2 Dashboard Page (Summary, Revenue Analysis, Transaction Analysis)
### Components
- Summary cards:
  - Total transaksi
  - Transaksi berhasil
  - Transaksi gagal
- Revenue analysis (chart + filter range tanggal)
- Transaction analysis (chart status/time series)

### Acceptance criteria
- Default date range (mis. last 7/30 days).
- Bisa ubah range tanggal (date picker).
- Loading/error states konsisten.

### Non-functional
- Gunakan caching TanStack Query dengan query key termasuk date range + active scope.

---

## 9.3 CRUD Product
### List
- DataGrid/Table: code, name, price, actions (edit/delete)
- Search/filter minimal: by code/name

### Create/Edit
- Form:
  - product_code (required)
  - product_name (required)
  - price (required, numeric, >= 0)
- Validation: RHF + Zod
- Submit → invalidate product list query

### Delete
- Konfirmasi dialog
- Soft delete jika backend mendukung; jika tidak, hard delete.

### Acceptance criteria
- CRUD berhasil memantulkan perubahan di list tanpa refresh manual.
- Error message dari backend ditampilkan.

---

## 9.4 CRUD Template (Upload PNG)
### List
- Thumbnail grid/list + actions (delete/disable)
- (Optional) search by name

### Upload
- Hanya PNG
- Validasi:
  - `image/png`
  - max size (tentukan, mis. 10MB)
  - optional: dimensi minimal/maksimal (per requirement photobooth)
- Preview sebelum submit
- Progress indicator

### Acceptance criteria
- Upload sukses → template muncul di list
- Delete/disable sesuai API

---

## 9.5 CRUD Waktu (Timer)
> "CRUD hanya mengubah timer" berarti UI fokus pada **update timer settings**.

### View
- Menampilkan:
  - timer pembayaran (duration)
  - timer sesi foto (duration)
  - referensi datetime dari backend (read-only) bila perlu

### Edit
- User dapat mengubah nilai timer
- Validasi:
  - angka, minimal 0, batas maksimum (mis. 600 detik) sesuai business rules
- Simpan → invalidate timer query

### Acceptance criteria
- Perubahan timer tersimpan dan tampil konsisten setelah reload.
- Field non-editable tidak bisa ditamper di UI.

---

## 9.6 CRUD Voucher
### List
- columns: code, title, discount, product type, period, usage limit, usage count, status, actions
- filters: status, period

### Create/Edit
- voucher_code (required)
- voucher_title (required)
- discount (required, valid range)
- product_type (required)
- period (start/end required)
- usage_limit (>=0)
- status (active/inactive)

### Acceptance criteria
- usage_count bersifat read-only.
- Validasi period: end >= start.
- Perubahan langsung tercermin di list.

---

## 9.7 Read Report Transactions
### List
- Server-side pagination
- Filter:
  - date range
  - status (success/failed)
  - product/outlet (jika ada)
- Sort: by date (default desc)

### Detail
- Klik row → drawer/modal/detail page
- Menampilkan field penting (id, time, amount, status, product, etc.)

### Acceptance criteria
- Pagination tidak mem-fetch semua transaksi sekaligus.
- Filter mengubah query key dan me-refetch.
- Error state tidak membuat UI blank.

---

## 9.8 Management Account / Role
> Detail CRUD tergantung kebijakan backend; jika backend hanya menyediakan read + assign role, ikuti itu.

### Baseline (minimum)
- List users + role + tenant/outlet mapping
- Search/filter
- (Optional) update role jika API mendukung dan user punya permission

### Acceptance criteria
- Jika user tidak punya permission, menu/aksi disembunyikan.
- Update role (jika ada) memunculkan audit feedback (success toast).

---

## 10) UI/UX Standards
- Konsisten:
  - Loading: skeleton/spinner standar
  - Error: alert banner + retry button
  - Success: snackbar/toast
- Konfirmasi destructive action (delete/disable).
- Empty states informatif (mis. "Belum ada voucher").

---

## 11) Observability & Quality
- Error boundary global
- Logging error (Sentry recommended)
- Linting:
  - ESLint + Prettier
- Testing minimal:
  - auth guard behavior
  - critical forms validation (product, voucher, template)

---

## 12) What Better Thing To Do (Recommendations)
1) Gunakan **TanStack Query** untuk seluruh data API (cache + invalidation).
2) Gunakan **Zustand** untuk auth/session & active scope (tanpa persist token).
3) Terapkan **refresh token cookie** bila memungkinkan.
4) Pastikan **server-side pagination** untuk transaksi.
5) Buat komponen reusable:
   - `DataTable`, `FilterBar`, `ConfirmDialog`, `FileUploadField`
6) RBAC di UI berbasis permission helper (`can()`), tetapi backend tetap enforce.
7) Dokumentasikan environment variables dan endpoint mapping.

---

## 13) What Not To Do (Anti-patterns)
1) Jangan fetch semua transaksi tanpa pagination.
2) Jangan simpan token di localStorage jika refresh cookie tersedia.
3) Jangan simpan server state (lists) di Zustand sebagai cache utama.
4) Jangan hardcode base URL / tenant id; selalu dari config dan backend.
5) Jangan mengandalkan UI untuk keamanan tenant isolation.

---

# 14) Progress Tracking (Checklist)
> **Sumber kebenaran tunggal** untuk tracking progress implementasi.
> Update `[ ]` → `[x]` setiap fitur selesai. Jangan duplikat di file lain.

## 14.1 Project Setup
- [x] Init React + Vite
- [x] Setup MUI theme + layout (AppShell)
- [x] Setup React Router (public/protected)
- [x] Setup Zustand stores (auth, scope, ui)
- [x] Setup TanStack Query + QueryClientProvider
- [x] Setup API client (auth header, 401 refresh flow, error mapping)
- [x] Setup env config (API_BASE_URL, etc.)

## 14.2 Authentication
- [x] Login page UI
- [x] Login API integration (+ DUMMY_MODE di `src/mocks/dummyAuth.ts`)
- [x] Bootstrap auth (refresh on app start, skip saat DUMMY_MODE)
- [x] ProtectedRoute + redirect rules
- [x] Logout flow + clear query cache
- [x] Zustand authStore menggunakan `LoginResponse` langsung (tanpa `AuthUser` terpisah)
- [x] `usePermissions` membaca `permissions[]` dari `LoginResponse` (backend-authoritative)
- [x] `scopeStore.activeTenantId` bertipe `number` (sesuai `LoginResponse.tenantId`)

## 14.3 Dashboard Summary
- [x] Summary cards (total/success/failed)
- [x] Revenue analysis chart + date range filter
- [x] Transaction analysis chart + date range filter
- [x] Loading/error/empty states

## 14.4 Products (CRUD)
- [x] Product list table (server pagination)
- [x] Create product modal
- [x] Edit product modal
- [x] Delete product confirm dialog
- [x] Zod validations + error display
- [x] Query invalidation rules
- [x] TenantSelector di header (isSuperAdmin) + kolom Tenant conditional
- [x] ProductFormDialog: foto produk upload File (FormData multipart) + preview + LinearProgress
- [x] ProductFormDialog: TenantSelector hanya untuk superAdmin; non-superAdmin auto-fill tenantId dari activeTenantId
- [x] ProductFormDialog: validasi foto required (muncul setelah submit), border merah saat error, TenantSelector outline merah saat error
- [x] Breadcrumb + layout header identik TimersPage

## 14.5 Templates (CRUD)
- [x] Template list (grid + thumbnail)
- [x] Upload template form + preview
- [x] PNG validation (type/size, max 10MB)
- [x] Delete/disable template
- [x] Progress + error handling
- [x] Edit template (ganti foto) — tombol Edit per kartu, upload file baru via `templatesApi.update`
- [x] Delete template — tombol Hapus per kartu, konfirmasi via `ConfirmDialog`
- [x] Upload preview as Dialog — preview gambar besar, filename/size, LinearProgress, aksi "Pilih File Lain" / "Batal" / "Upload"
- [x] Flow pemilihan layout sebelum masuk ke template:
  - [x] `src/api/layouts.api.ts` — `layoutsApi.list()` POST `/layout/get`
  - [x] `LayoutsPage` (`/app/layouts`) — grid kartu layout; "Choose Layout" navigates ke `/app/layouts/:layoutId/templates`
  - [x] `TemplatesPage` membaca `layoutId` dari `useParams`; breadcrumb Home → Template & Layout → Layout → Your Layout
  - [x] Route: `/app/layouts` + `/app/layouts/:layoutId/templates` (route `/app/templates` dihapus)
  - [x] Sidebar path diupdate ke `/app/layouts`
  - [x] `templates.api.ts` signatures: `upload(tenantId, layoutId, file, onProgress?)`, `update(id, tenantId, layoutId, file, onProgress?)`, `delete(id: number)`

## 14.6 Timers (Edit timer)
- [x] Timer settings page layout
- [x] Fetch timer settings from backend
- [x] Edit payment timer
- [x] Edit photo session timer
- [x] Save & invalidate query
- [x] Validation bounds (0–600 detik)

## 14.7 Vouchers (CRUD)
- [x] Voucher list DataGrid
- [x] Create voucher form (period picker, status)
- [x] Edit voucher form
- [x] Delete/disable voucher
- [x] Validation (period, discount range, required fields)
- [x] usage_count read-only

## 14.8 Transactions Report (Read-only)
- [x] Transactions list DataGrid (server pagination)
- [x] Filters: date range, status
- [x] Transaction detail drawer
- [ ] Export CSV (pending — tergantung backend endpoint)

## 14.9 Account / Role Management
- [x] Users list (read) + search + pagination
- [x] Role assignment UI (RoleEditDialog)
- [x] Permission-based navigation & actions (`usePermissions`)

## 14.10 Polish & Release
- [x] Global error boundary
- [x] Toast/snackbar conventions (GlobalSnackbar + uiStore)
- [x] Loading skeletons
- [x] Basic tests (auth guard + critical forms)
- [ ] CI (optional)
- [ ] Deployment config (staging/prod)

## 14.11 UI Slicing (Figma → Code)
> Fase implementasi desain visual berdasarkan referensi Figma/screenshot.
> Color tokens sudah terdefinisi di `src/theme/colors.ts`.
> Typography variants: `titleLg/Md/Sm`, `bodyXl/Lg/Md/Sm/Xs`.

- [x] Color palette & typography system setup
- [x] Login Page — split layout (poster kiri + form kanan)
- [x] Dashboard Page — Summary title, Today's Overview card, Revenue & Transaction chart dengan period tabs + date range + product filter
- [x] AppShell — background-light bg, padding
- [x] Sidebar — header-logo.png, Dashboard/Settings group labels, active item brand[100] + brand[500] text, nav item icons
- [x] Topbar — header-button.svg toggle, user avatar + name + dropdown arrow
- [x] Products Page — Breadcrumb, header layout identik TimersPage (TenantSelector + Search + Tambah Produk), tabel dengan kolom Tenant conditional (isSuperAdmin), Skeleton, permission gates, custom pagination footer
- [x] Templates Page — layout card grid + edit/delete/upload dialog + flow layout→template selesai (lihat 14.5)
- [x] Layouts Page — grid kartu pemilihan layout sebelum masuk ke halaman template
- [x] Timers Page — rewrite menjadi tabel CRUD rules (struktur identik VouchersPage)
- [x] Vouchers Page
- [x] Transactions Page — Breadcrumb, header layout identik TimersPage (TenantSelector + DateRange + Status filter + Search), tabel dengan Skeleton, custom pagination footer, detail Drawer
- [ ] Accounts Page

## 14.12 Playwright Tests
> Semua tes dijalankan dengan `@playwright/test` + Chromium.
> Dev server harus aktif terlebih dahulu: `npm run dev` di port 5173.
> Jalankan: `npx playwright test` (headless) atau `npx playwright test --ui` (visual).

- [x] Install `@playwright/test` + Chromium browser
- [x] `playwright.config.ts` — baseURL, HTML report, screenshot/video on failure
- [x] `tests/helpers/auth.ts` — fixture `authedPage`, helper `login()`, `collectErrors()` — diupdate ke `LoginResponse` shape (`username` field, `input[name="username"]` selector)
- [x] `VITE_DUMMY_MODE` env var — `DUMMY_MODE` kini baca dari `import.meta.env.VITE_DUMMY_MODE` (set `true` di `.env` untuk test/demo, `false` untuk produksi)
- [x] `tests/auth.spec.ts` — login sukses/gagal, auth guard (5 route), logout
- [x] `tests/navigation.spec.ts` — semua halaman load tanpa JS error, sidebar per role
- [x] `tests/products.spec.ts` — form validation (required, negative price, search)
- [x] `tests/vouchers.spec.ts` — form validation (required, period, discount bounds)
- [x] `tests/templates.spec.ts` — render, breadcrumb, upload validation (PNG only, preview, cancel), sidebar nav

- [x] Sidebar — Settings User group baru (Tenant, User, Role, Permission) dengan ikon masing-masing
- [x] Sidebar — Settings User group collapsible (`NavGroupCollapsible` dengan chevron expand/collapse, default expanded)
> **Cara menambah test baru:**
> - Buat file `tests/<feature>.spec.ts` atau tambahkan `test.describe` ke `tests/features.spec.ts`
> - Import `test, expect` dari `./helpers/auth`
> - Gunakan fixture `authedPage` untuk halaman yang butuh login

## 14.13 Settings User (Tenant / User / Role / Permission)
> Halaman baru di bawah grup "Settings User" pada sidebar.
> Semua halaman mengikuti struktur identik VouchersPage: tabel + pagination + debounced search + form dialog + confirm delete.

### Tenant
- [x] API: `tenantsApi` (list/create/update/delete) via `/tenant/*`
- [x] TenantsPage — kolom: #, Tenant Code, Tenant Name, Address, Action
- [x] TenantFormDialog — fields: code, name, address (Zod validation)
- [x] ConfirmDialog hapus tenant
- [x] Breadcrumb: Home → Settings User → Data Tenant

### User
- [x] API: `usersApi` (list/create/update/delete) via `/user/*`
- [x] UsersPage — kolom: #, Username, Email, Role (chip), Tenant, Action
- [x] UserFormDialog — fields: username, email, password (create only), role dropdown, tenant_id
- [x] ConfirmDialog hapus user
- [x] Breadcrumb: Home → Settings User → User

### Role
- [x] API: `rolesApi` (list/create/update/delete) via `/role/*`
- [x] RolesPage — kolom: #, Role Name, Description, Diperbarui, Action
- [x] RoleFormDialog — fields: name, description (Zod validation)
- [x] ConfirmDialog hapus role
- [x] Breadcrumb: Home → Settings User → Role

### Permission
- [x] API: `permissionsApi` (list/create/update/delete) via `/permission/*`
- [x] PermissionsPage — kolom: #, Permission (monospace), Description, Diperbarui, Action
- [x] PermissionFormDialog — fields: name, description (Zod validation)
- [x] ConfirmDialog hapus permission
- [x] Breadcrumb: Home → Settings User → Permission

### Role Permission Assignment (Pengaturan Task Role)
- [x] API: `permissionsApi.getByRole(roleId)` — POST `/role-permissions/get` → IDs permission yg sudah di-assign ke role
- [x] API: `permissionsApi.assign(payload)` — POST `/role-permissions/replace` → simpan assignment
- [x] `ResultRolePermission.permissions` ditype sebagai `ResultPermissions[]` (bukan `any[]`); inisialisasi checkbox via `p.id`
- [x] RolePermissionsPage (`/app/roles/:id/permissions`) — halaman fullpage assign permission ke role
  - [x] Breadcrumb: Home → Settings User → Role → Pengaturan Task Role
  - [x] Header: tombol back + judul "Pengaturan Task Role" + tombol "Save & Close"
  - [x] Info role name di bawah header
  - [x] Tabel: # | Modul | Task (checkbox grid per modul, grouped by prefix ":" pada nama permission)
  - [x] Inisialisasi checkbox dari data `getByRole`; simpan via `assign` → navigate back
- [x] RolesPage — Settings icon navigate ke `/app/roles/:id/permissions`
- [x] Route baru: `roles/:id/permissions`

## 14.14 Responsive Design (Mobile / Tablet)
> Semua halaman accessible di smartphone dan tablet. Breakpoints: xs (0px), sm (600px), md (900px).

- [x] `uiStore` — tambah `sidebarMobileOpen`, `openMobileSidebar`, `closeMobileSidebar`
- [x] `Sidebar` — `variant="temporary"` (overlay) pada mobile, `permanent` pada desktop; menutup otomatis saat nav diklik
- [x] `Topbar` — full width pada mobile; hamburger membuka overlay sidebar; username hidden pada xs
- [x] `AppShell` — responsive content padding (`xs: 2, md: 3`)
- [x] `DashboardPage` — summary metrics stack vertikal pada mobile, divider horizontal hidden
- [x] `ProductsPage` / `AccountsPage` — header row responsive, search bar full-width pada mobile
- [x] `TransactionsPage` — header responsive, filter wrap, detail drawer full-width pada mobile
- [x] `VouchersPage` / `TimersPage` / `TenantsPage` / `RolesPage` / `UsersPage` / `PermissionsPage` — search bar full-width pada mobile
- [x] `RolePermissionsPage` — header responsive, tombol "Save & Close" full-width pada mobile
- [x] `LayoutsPage` / `TemplatesPage` / `LoginPage` — sudah responsive (Grid, hidden panel)

## 14.15 Permission-based Access Control per Page
> Setiap page wajib membaca `can()` dari `usePermissions()` di top-level komponen.
> Pola: tombol Create/Edit/Delete disembunyikan jika permission tidak ada; kolom Action dihilangkan jika semua action-nya tidak ada.
> Naming convention mengikuti backend: `resource:action` (read / create / update / delete).

### Dashboard
- [ ] `DashboardPage` — tidak ada aksi write; tidak perlu gate (read-only public bagi semua role terauth)

### Products
- [x] `ProductsPage` — gate tombol "Tambah Produk" dengan `products:create`
- [x] `ProductsPage` — gate tombol Edit per row dengan `products:update`
- [x] `ProductsPage` — gate tombol Delete per row dengan `products:delete`

### Layouts & Templates
- [x] `LayoutsPage` — gate tombol "Choose Layout" / akses ke template dengan `templates:read` (atau `layouts:read`)
- [x] `TemplatesPage` — gate tombol Upload/Tambah dengan `templates:create`
- [x] `TemplatesPage` — gate tombol Edit per kartu dengan `templates:update`
- [x] `TemplatesPage` — gate tombol Hapus per kartu dengan `templates:delete`

### Timers
- [x] `TimersPage` — gate tombol "Tambah Rule" dengan `rules:create`
- [x] `TimersPage` — gate tombol Edit per row dengan `rules:update`
- [x] `TimersPage` — gate tombol Delete per row dengan `rules:delete`

### Vouchers
- [x] `VouchersPage` — gate tombol "Tambah Voucher" dengan `vouchers:create`
- [x] `VouchersPage` — gate tombol Edit per row dengan `vouchers:update`
- [x] `VouchersPage` — gate tombol Delete per row dengan `vouchers:delete`

### Transactions
- [x] `TransactionsPage` — read-only; tidak ada aksi write; tidak perlu gate tambahan

### Accounts
- [ ] `AccountsPage` — gate tombol Edit (role assignment) dengan `accounts:update`

### Settings User — Tenant
- [x] `TenantsPage` — gate tombol "Tambah Tenant" dengan `tenants:create`
- [x] `TenantsPage` — gate tombol Edit per row dengan `tenants:update`
- [x] `TenantsPage` — gate tombol Delete per row dengan `tenants:delete`

### Settings User — User
- TIDAK ADA CREATE UPDATE DAN DELETE UNTUK `UsersPage.tsx`

### Settings User — Role
- [x] `RolesPage` — gate tombol "Tambah Role" dengan `roles:create`
- [x] `RolesPage` — gate tombol Edit per row dengan `roles:update`
- [x] `RolesPage` — gate tombol Delete per row dengan `roles:delete`
- [x] `RolesPage` — gate ikon Settings (navigate ke RolePermissionsPage) dengan `roles:update`

### Settings User — Permission
- PERMISSION PAGE SEMENTARA DI HIDDEN `PermissionsPage.tsx`

### Role Permission Assignment
- [ ] `RolePermissionsPage` — gate tombol "Save & Close" dengan `roles:update`

## 14.16 Tenant Selector (Superadmin)
> Hanya tampil jika `user.isSuperadmin === true` (tenantId: -99 dari backend).
> Memungkinkan superadmin memilih tenant aktif yang akan mempengaruhi data di seluruh halaman.

- [x] Komponen `TenantSelector` (`src/components/common/TenantSelector.tsx`)
  - [x] Fetch tenants via `tenantsApi.list({ tenant_id: 0, ... })` — keyword-searchable (server-side), limit 100
  - [x] MUI Autocomplete single-select; stores hasil pilihan ke `scopeStore.activeTenantId`
  - [x] Tidak tampil (`return null`) jika user bukan superadmin
- [x] Integrasi di `Topbar` — selector muncul di semua page secara otomatis (sebelum user avatar)
- [x] Fix `usePermissions.ts` — `role` expression dilengkapi (`? 'superadmin' : 'user'`)

## 14.17 Integrasi TenantSelector ke Setiap Halaman
> TenantSelector sudah tampil di Topbar dan menyimpan pilihan ke `scopeStore.activeTenantId`.
> Namun setiap halaman masih menggunakan `user?.tenantId` (dari authStore) secara langsung.
> Task ini: ganti semua `user?.tenantId` → baca dari `scopeStore` agar berubah reaktif saat superadmin memilih tenant.
>
> **Pola yang benar:**
> - Non-superadmin: `activeTenantId` diinisialisasi dari `user.tenantId` saat login (di authStore / App.tsx)
> - Superadmin: `activeTenantId` berubah sesuai pilihan TenantSelector
> - Setiap page: `const { activeTenantId } = useScopeStore();` — tidak perlu baca `useAuthStore` untuk `tenantId`

### Prerequisite
- [x] `scopeStore` / login flow — saat login sukses, panggil `setScope(user.tenantId)` agar `activeTenantId` terisi otomatis untuk user non-superadmin

### Pages & Features
- [x] `DashboardPage` — menggunakan `activeTenantId`, `enabled: !!activeTenantId` (blocking query saat belum pilih tenant — behavior yang benar)
- [x] `ProductsPage` — menggunakan `activeTenantId`, `queryFn` pass `tenantId: activeTenantId` ke API
- [x] `AccountsPage` — menggunakan `activeTenantId` di query key (accounts tidak perlu tenant filter per API)
- [x] `TransactionsPage` — menggunakan `activeTenantId`, pass `tenantId: activeTenantId` ke API
- [x] `VouchersPage` — sudah ganti ke `activeTenantId` dari scopeStore
- [x] `TimersPage` — sudah ganti ke `activeTenantId` dari scopeStore
- [x] `TenantsPage` — tidak ada tenant scoping (global admin page; tidak perlu perubahan)
- [ ] `LayoutsPage` — masih `user?.tenantId` → ganti ke `activeTenantId` dari scopeStore
- [x] `TemplatesPage` — sudah ganti ke `activeTenantId` di query + upload/update mutation
- [x] `UsersPage` — menggunakan `activeTenantId`, pass `tenantId: activeTenantId` ke API
- [x] `RolesPage` — tidak ada tenant_id di query (roles bersifat global; tidak perlu perubahan)
- [x] `RolePermissionsPage` — tidak ada tenant_id; tidak perlu perubahan

### Features / Dialogs
- [ ] `VoucherFormDialog` — masih `user?.tenantId` di mutation → ganti ke `activeTenantId` (pass sebagai prop atau baca dari store)
- [ ] `TimerFormDialog` — masih `user?.tenantId` di mutation → ganti ke `activeTenantId`

---

## 15) Open Questions (Need Decisions)
- [ ] Auth mechanism final: refresh cookie available?
- [ ] Multi-tenant scope: tenant/outlet switcher needed?
- [ ] Voucher discount type: fixed amount vs percentage?
- [ ] Template image constraints: max size & required dimensions?
- [ ] Transactions export: backend endpoint available?
