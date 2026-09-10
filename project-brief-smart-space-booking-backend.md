# Project Brief: Smart Space Booking — Backend API (UKK RPL Paket B)

*(Coworking Space & Workstation Reservation System — REST API)*

---

## 1. Project Vision

Membangun **REST API backend** untuk sistem reservasi coworking space & workstation ("Smart Space Booking"), sebagai pemenuhan tugas Uji Kompetensi Keahlian (UKK) RPL Paket B — SMK Telkom Malang, Tahun Pelajaran 2026/2027, kategori **Backend**.

Positioning: ini bukan produk komersial, melainkan **deliverable ujian kompetensi** yang harus 100% mengikuti Kontrak API resmi yang ditetapkan panitia (Bagian III dokumen soal), karena API ini berpotensi dikonsumsi oleh peserta lain di kategori Frontend/Mobile dan dinilai langsung oleh penguji via Postman/Swagger.

Scope: backend-only. Tidak ada tampilan (UI) yang dibangun — fokus penuh pada endpoint, business logic, integritas data, dan dokumentasi API.

---

## 2. Core Principles

1. **Kepatuhan kontrak, bukan interpretasi bebas.** Struktur endpoint, nama field DTO, format response, dan status code harus persis mengikuti Bagian III dokumen soal — bukan versi "yang menurut saya lebih baik". Deviasi hanya boleh terjadi di level detail teknis internal (skema tabel, penamaan variabel internal) yang tidak terekspos ke response API.
2. **Isolasi data per App Maker (multi-tenancy).** Setiap entitas utama (member, space, diskon, reservasi) terikat ke `maker_id` dari `x-maker-key`. Tidak boleh ada kebocoran data antar tenant meskipun database sama.
3. **Dua lapis autentikasi yang terpisah.** Token App Maker (`/api/maker/*`) dan token User dengan role `member`/`admin_space` (`/api/auth/*` dst.) tidak boleh saling tertukar guard/middleware-nya.
4. **Integritas kalkulasi transaksi.** `jam_selesai`, `total_harga_awal`, `potongan_diskon`, `total_bayar` adalah hasil kalkulasi server — tidak pernah dipercaya dari input klien secara langsung.
5. **Response format seragam, tanpa pengecualian.** Semua 50 endpoint mengembalikan struktur sukses/error yang sama persis — diterapkan lewat mekanisme global (interceptor + exception filter), bukan manual per controller.

---

## 3. Core Concept: Struktur Role & Modul

### Role / Consumer Header
- **App Maker** — identitas siswa peserta ujian, diautentikasi via `x-maker-key` (dan opsional token dari `/api/maker/login` untuk endpoint profil/statistik). Menentukan isolasi data.
- **Member** — role user pemesan ruangan, JWT dengan `role: "member"`.
- **Admin Space** — role user pengelola lokasi coworking, JWT dengan `role: "admin_space"`.

### Modul Backend
| Modul | Endpoint Group |
|---|---|
| Root & Health | `/`, `/health` |
| Multi-Tenancy (App Maker) | `/api/maker/*` |
| Autentikasi User | `/api/auth/*` |
| Katalog & Ketersediaan Space | `/api/spaces/*` |
| Diskon & Promo | `/api/diskon/*` |
| Reservasi (Member) | `/api/reservasi/*` (non-admin) |
| Profil Lokasi (Admin) | `/api/admin/profile` |
| Manajemen Member (Admin) | `/api/admin/members/*` |
| Manajemen Space (Admin) | `/api/admin/spaces/*` |
| Manajemen Diskon (Admin) | `/api/admin/diskon/*` |
| Transaksi & Check-in/out (Admin) | `/api/admin/reservasi/*` |
| Laporan Pendapatan (Admin) | `/api/admin/reports/*` |
| Upload Media | `/api/upload/*` |

Modul-modul ini saling terhubung: Reservasi bergantung pada Space (ketersediaan) dan Diskon (kalkulasi harga); Reservasi men-generate data untuk Reports; Check-in/out mengubah status Reservasi yang sama.

---

## 4. Target Consumer

- **Tim Penguji UKK** — menjalankan endpoint via Postman/Insomnia atau Swagger UI untuk menilai kesesuaian dengan kontrak.
- **Peserta kategori Frontend/Mobile (potensial)** — jika terjadi sesi integrasi lintas kategori, API ini menjadi sumber data mereka.
- **Diri sendiri (developer)** — untuk verifikasi end-to-end sebelum submit.

Bukan untuk: end-user asli (member/admin space sungguhan) — ini simulasi ujian, bukan produk produksi untuk pengguna publik.

---

## 5. Feature Breakdown (Ringkasan per Modul)

### 5.1 Root & Health
- Status API & health check, publik, tanpa auth.

### 5.2 Multi-Tenancy — App Maker
- Register & login siswa → generate `app_key` unik (`mk_xxx`).
- `GET /me` (profil), `GET /stats` (statistik agregat tenant sendiri), `GET /list` (publik, daftar semua App Maker — dipakai panitia).

### 5.3 Autentikasi User
- Register Member & Admin Space (masing-masing punya DTO & tabel profil terpisah, terhubung ke `users`).
- Login universal (`/api/auth/login`) mengembalikan JWT + payload role-aware (`member` object atau `space_owner` object, salah satu `null`).
- `GET /profile` — cek identitas dari token aktif.

### 5.4 Katalog & Ketersediaan Space
- Daftar tipe space (statis: desk/meeting_room/private_office).
- Cek ketersediaan by tanggal+jam+durasi → **wajib deteksi overlap** dengan reservasi lain yang belum `dibatalkan`.
- List & detail space, filter `?tipe` & `?search`.

### 5.5 Diskon & Promo
- List diskon aktif (filter berdasarkan tanggal berlaku).
- Cek validitas kode promo + hitung potongan (dipakai saat checkout).

### 5.6 Reservasi (Member)
- Create reservasi: hitung `jam_selesai`, validasi ketersediaan, terapkan diskon (by `id_diskon` atau `kode_promo`), generate `kode_booking` unik.
- List reservasi milik sendiri, histori by bulan/tahun (dengan agregat `total_pengeluaran`).
- Detail, e-ticket (termasuk `qr_code_payload`), cancel (hanya bisa dibatalkan sebelum status `aktif`/`selesai` — perlu aturan state machine).

### 5.7–5.11 Panel Admin
- CRUD profil lokasi, member, space, diskon.
- Kelola reservasi: filter lengkap (`month`, `year`, `status`, `id_space`, `tanggal`), ubah status (dengan validasi transisi), check-in (→ `aktif`), check-out (→ `selesai`).

### 5.12 Laporan
- Rekap bulanan: total transaksi, jam terpakai, estimasi vs realisasi pendapatan, breakdown per tipe space.
- Endpoint alias `/reports/income` (versi ringkas).

### 5.13 Upload Media
- 3 endpoint terpisah (general/spaces/members) dengan folder tujuan berbeda, konsisten dengan pola URL publik `http://localhost:3000/uploads/<kategori>/<file>`.

---

## 6. Role & Permission Matrix

| Modul | App Maker (header key) | Member | Admin Space |
|---|---|---|---|
| Root/Health | Publik | Publik | Publik |
| Maker profil/stats | Bearer Token Maker | — | — |
| Register/Login User | Butuh `x-maker-key` | — | — |
| Katalog Space, Diskon Aktif | Butuh `x-maker-key` | View | View |
| Reservasi (create/my/cancel) | Isolasi tenant | Full (miliknya) | — |
| E-ticket & Detail Reservasi | Isolasi tenant | View (miliknya) | View (semua tenant sendiri) |
| Admin Profile/Members/Spaces/Diskon (CRUD) | Isolasi tenant | — | Full |
| Konfirmasi Status, Check-in/out | Isolasi tenant | — | Full |
| Reports | Isolasi tenant | — | Full |
| Upload | Butuh `x-maker-key` | Ya | Ya |

---

## 7. Flow Project

**Flow Setup Tenant (App Maker)**
1. Register di `/api/maker/register` → simpan `app_key`.
2. Sertakan `x-maker-key` di semua request berikutnya.

**Flow Onboarding User**
1. Register sebagai Member atau Admin Space.
2. Login → dapat JWT dengan `role` di payload.

**Flow Reservasi (Member)**
1. Lihat katalog space → cek ketersediaan tanggal/jam.
2. (Opsional) cek kode promo via `/api/diskon/check`.
3. Create reservasi → server hitung `jam_selesai` & `total_bayar`.
4. Pantau status (`belum_dikonfirm → disetujui → aktif → selesai`, atau `dibatalkan`).
5. Cetak e-ticket setelah `disetujui`.

**Flow Operasional (Admin Space)**
1. Lihat semua reservasi masuk (filter status/bulan).
2. Konfirmasi (`disetujui`/`dibatalkan`).
3. Saat tamu datang → check-in (`aktif`).
4. Saat selesai → check-out (`selesai`).
5. Review rekap pendapatan bulanan.

---

## 8. Data Model (ERD Ringkas)

Mengikuti ERD dari dokumen soal (boleh disesuaikan tanpa mengurangi fitur):

- **users** (`id`, `username`, `password`, `role: admin_space|member`) — 1:1 ke `member` atau `space_owner`.
- **member** (profil pemesan: `nama_member`, `instansi`, `alamat`, `telp`, `foto`) — 1:N ke `reservasi`.
- **space_owner** (profil admin: `nama_coworking`, `nama_pemilik`, `telp`) — 1:N ke `space`.
- **space** (`nama_space`, `harga_per_jam`, `tipe`, `kapasitas`, `deskripsi`, `foto`) — 1:N ke `detail_reservasi`.
- **diskon** (`nama_diskon`, `persentase_diskon`, `tanggal_awal`, `tanggal_akhir`) — opsional relasi ke `detail_reservasi`.
- **reservasi** (`tanggal_reservasi`, `jam_mulai`, `durasi_jam`, `status`) — 1:N ke `detail_reservasi`.
- **detail_reservasi** (junction: `id_reservasi`, `id_space`, `id_diskon`, `total_harga`).

**Penyesuaian wajib untuk multi-tenancy:** tambahkan kolom `maker_id` (FK ke tabel App Maker) di setiap tabel utama (`users`, `space`, `diskon`, `reservasi`, dst.) — ini tidak digambar di ERD dokumen soal tapi wajib secara fungsional karena kontrak mensyaratkan isolasi data per `x-maker-key`.

---

## 9. Platform & Technical Scope

**Tech Stack (dikonfirmasi):**
- Backend framework: **NestJS**
- ORM: **Prisma**
- Database: **PostgreSQL**
- Autentikasi: JWT (dua strategi terpisah — Maker JWT & User JWT dengan `role` di payload), password hashing via bcrypt.
- Dokumentasi API: **Swagger** (auto-generate via `@nestjs/swagger`, expose di `/docs` sesuai contoh response root endpoint) **+ export ke Postman Collection**.
- File upload: local disk storage (`/uploads/spaces`, `/uploads/members`, `/uploads/general`) diserve sebagai static file, sesuai pola URL di kontrak.

**Deployment target:** Lokal (untuk sesi ujian, base URL `http://localhost:3000`) **dan** deploy ke hosting untuk keperluan demo/backup.

**Environment/config:** `.env` untuk `DATABASE_URL`, `JWT_SECRET` (bisa 2 secret terpisah untuk Maker vs User token), `PORT=3000` agar konsisten dengan contoh URL di kontrak.

---

## 10. Out of Scope (V1 — Backend Category)

- Tampilan/UI apapun (halaman web, mobile, atau desain Figma) — di luar tanggung jawab kategori Backend.
- Payment gateway sungguhan — kontrak hanya butuh field `total_bayar` tercatat, tidak ada proses pembayaran online riil.
- Real-time notification (email/push/WA) — tidak diminta kontrak.
- Generate QR Code sebagai gambar — kontrak hanya mensyaratkan `qr_code_payload` berupa string (lihat Catatan Terbuka).
- Automated testing (unit/e2e test suite) — tidak menjadi syarat deliverable resmi.

---

## 11. Success Criteria / Definition of Done

- Seluruh **50 endpoint** di Bagian III berfungsi dan responsnya cocok field-by-field dengan contoh di dokumen soal (termasuk status code sukses & error).
- Isolasi multi-tenant teruji: 2 `app_key` berbeda tidak saling melihat data satu sama lain.
- Business logic kritikal berfungsi benar: overlap check ketersediaan, kalkulasi diskon, state machine status reservasi, agregasi laporan bulanan.
- Swagger UI dapat diakses dan mencerminkan seluruh endpoint; Postman Collection berhasil di-export dan seluruh request di dalamnya berhasil dijalankan (hijau semua).
- Migration/schema Prisma reproducible dari nol (`prisma migrate deploy` bersih di environment baru).
- README lengkap: cara install, `.env` yang dibutuhkan, cara run migration & seed, base URL lokal vs hosting.
- (Jika deploy) instance hosting dapat diakses dan berperilaku identik dengan versi lokal.

---

## 12. Lampiran A — Ringkasan Endpoint API (Kontrak API Bagian III)

URL API Panitia (acuan format, base URL project sendiri menyesuaikan): `https://learn.smktelkom-mlg.sch.id/coworking/`

| No | Endpoint | Method | Role & Deskripsi Singkat |
|---|---|---|---|
| 1 | `/` | GET | Publik: Status API & Petunjuk Penggunaan |
| 2 | `/health` | GET | Publik: Health Check Server |
| 3 | `/api/maker/register` | POST | Publik: Registrasi Akun Siswa (Mendapatkan App Key Unik) |
| 4 | `/api/maker/login` | POST | Publik: Login Akun Siswa Pengembang Frontend |
| 5 | `/api/maker/me` | GET | App Maker: Lihat Profil & App Key Siswa Saat Ini |
| 6 | `/api/maker/stats` | GET | App Maker: Statistik Keseluruhan Data Siswa |
| 7 | `/api/maker/list` | GET | Guru/Penguji: Daftar Semua Siswa / App Maker Terdaftar |
| 8 | `/api/auth/register/member` | POST | Publik: Registrasi Akun Member / Pelanggan Baru |
| 9 | `/api/auth/register/admin-space` | POST | Publik: Registrasi Pengelola Lokasi / Admin Coworking Space |
| 10 | `/api/auth/login` | POST | Publik: Login Akun User (Member atau Admin Space), mengembalikan JWT Token |
| 11 | `/api/auth/profile` | GET | Bearer User: Cek Profil & Hak Akses Pengguna yang Sedang Login |
| 12 | `/api/spaces/types` | GET | Publik/User: Daftar Tipe Space (Personal Desk, Meeting Room, Private Office) |
| 13 | `/api/spaces/availability` | GET | Publik/User: Cek Ketersediaan Space Berdasarkan Tanggal & Jam |
| 14 | `/api/spaces` | GET | Publik/User: Lihat Semua Space Coworking (Filter `?tipe` & `?search`) |
| 15 | `/api/spaces/{id}` | GET | Publik/User: Lihat Detail Space Coworking Berdasarkan ID |
| 16 | `/api/diskon/active` | GET | Publik/User: Daftar Promo / Diskon yang Sedang Aktif |
| 17 | `/api/diskon/check` | POST | Publik/User: Periksa Validitas & Hitung Potongan Kode Promo |
| 18 | `/api/diskon/{id}` | GET | Publik/User: Lihat Detail Diskon Berdasarkan ID |
| 19 | `/api/reservasi` | POST | Member: Buat Pemesanan Space Baru (+ Kode Promo & Perhitungan Otomatis) |
| 20 | `/api/reservasi/my` | GET | Member: Lihat Status Semua Pemesanan Milik Sendiri |
| 21 | `/api/reservasi/my/history` | GET | Member: Lihat Histori Pemesanan Berdasarkan Bulan & Tahun (`month`, `year`) |
| 22 | `/api/reservasi/{id}/e-ticket` | GET | Member/Admin: Cetak E-Ticket / Bukti Nota Digital Reservasi |
| 23 | `/api/reservasi/{id}` | GET | Member/Admin: Lihat Detail Reservasi Berdasarkan ID |
| 24 | `/api/reservasi/{id}/cancel` | PATCH | Member: Batalkan Pemesanan Space |
| 25 | `/api/admin/profile` | GET | Admin Space: Lihat Data Profil Lokasi Coworking Space |
| 26 | `/api/admin/profile` | PUT | Admin Space: Update Data Profil Lokasi Coworking Space |
| 27 | `/api/admin/members` | GET | Admin Space: Daftar Semua Member / Pelanggan Coworking |
| 28 | `/api/admin/members` | POST | Admin Space: Tambah Data Member Baru (Upload Foto) |
| 29 | `/api/admin/members/{id}` | GET | Admin Space: Detail Data Member Berdasarkan ID |
| 30 | `/api/admin/members/{id}` | PUT | Admin Space: Update Data Member / Pelanggan |
| 31 | `/api/admin/members/{id}` | DELETE | Admin Space: Hapus Data Member / Pelanggan |
| 32 | `/api/admin/spaces` | GET | Admin Space: Daftar Semua Ruangan & Meja Milik Admin |
| 33 | `/api/admin/spaces` | POST | Admin Space: Tambah Ruangan / Meja Space Baru Beserta Fasilitas & Foto |
| 34 | `/api/admin/spaces/{id}` | GET | Admin Space: Detail Data Space Berdasarkan ID |
| 35 | `/api/admin/spaces/{id}` | PUT | Admin Space: Update Data Ruangan & Fasilitas Space |
| 36 | `/api/admin/spaces/{id}` | DELETE | Admin Space: Hapus Data Ruangan / Meja Space |
| 37 | `/api/admin/diskon` | GET | Admin Space: Daftar Semua Kode Promo / Diskon Event |
| 38 | `/api/admin/diskon` | POST | Admin Space: Tambah Kode Promo / Event Diskon Baru |
| 39 | `/api/admin/diskon/{id}` | GET | Admin Space: Detail Data Diskon Berdasarkan ID |
| 40 | `/api/admin/diskon/{id}` | PUT | Admin Space: Update Data Kode Promo & Periode Diskon |
| 41 | `/api/admin/diskon/{id}` | DELETE | Admin Space: Hapus Kode Promo / Diskon |
| 42 | `/api/admin/reservasi` | GET | Admin Space: Lihat Seluruh Reservasi Coworking (`?month`, `?year`, `?status`, `?id_space`, `?tanggal`) |
| 43 | `/api/admin/reservasi/{id}/status` | PATCH | Admin Space: Konfirmasi & Ubah Status Pemesanan (disetujui, dibatalkan, dll) |
| 44 | `/api/admin/reservasi/{id}/check-in` | POST | Admin Space: Check-In Pelanggan (Status Berubah ke Aktif/Digunakan) |
| 45 | `/api/admin/reservasi/{id}/check-out` | POST | Admin Space: Check-Out Pelanggan (Status Berubah ke Selesai) |
| 46 | `/api/admin/reports/monthly` | GET | Admin Space: Rekapitulasi Estimasi & Realisasi Pendapatan Per Bulan (`?month`, `?year`) |
| 47 | `/api/admin/reports/income` | GET | Admin Space: Alias Rekapitulasi Pendapatan Bulanan |
| 48 | `/api/upload/image` | POST | User/Admin: Upload Berkas Gambar Umum (Multipart Form Data) |
| 49 | `/api/upload/spaces` | POST | Admin Space: Upload Foto Ruangan / Meja Space |
| 50 | `/api/upload/members` | POST | User/Admin: Upload Foto Profil Member / Pelanggan |

---

## 13. Lampiran B — Ketentuan Global & Format Umum Response API

**1. Mekanisme Multi-Tenancy (Header `x-maker-key` / `x-app-key`)**
Untuk memastikan data antar siswa tidak bercampur selama pengerjaan UKK Frontend, peserta wajib mendaftarkan akun di `POST /api/maker/register` untuk mendapatkan `app_key` (contoh: `mk_xxxxxxxxxxxx`). Header `x-maker-key: <app_key>` (atau `x-app-key`) **wajib** disertakan pada setiap request HTTP dari Frontend. Semua data (Member, Space, Diskon, Reservasi) secara otomatis terisolasi aman untuk akun masing-masing.

**2. Autentikasi Pengguna & Role Access (JWT Bearer Token)**
Endpoint yang memerlukan autentikasi login wajib menyertakan header `Authorization: Bearer <access_token>` yang didapat setelah login berhasil di `POST /api/auth/login`. Terdapat 2 role pengguna:
- `member` — pelanggan yang memesan space & melihat histori.
- `admin_space` — pengelola lokasi coworking yang mengelola member, space, diskon, reservasi, check-in/out, dan laporan pendapatan.

**3. Struktur Baku Standar Response JSON**

Format Sukses:
```json
{
  "status": true,
  "statusCode": 200,
  "message": "keterangan sukses",
  "data": { },
  "timestamp": "ISO 8601"
}
```

Format Error:
```json
{
  "status": false,
  "statusCode": 400,
  "message": "keterangan error",
  "error": "NamaError",
  "timestamp": "ISO 8601"
}
```

**4. Standar Format Tanggal, Jam & Tipe Data**
- Tanggal: ISO 8601, `YYYY-MM-DD` (contoh `2026-08-30`) atau full ISO string (`2026-08-01T00:00:00.000Z`).
- Jam: `HH:mm` 24-jam (contoh `09:00`, `13:30`).
- Durasi: satuan jam, integer/number (minimal 1 jam).
- Nilai moneter/harga sewa: Rupiah (IDR), tipe integer/number.

**5. Penyimpanan & URL Akses Foto/Media**
Berkas foto ruangan dan member disimpan di folder backend dan diakses langsung secara publik via URL:
- Foto Space: `http://localhost:3000/uploads/spaces/<nama_file.jpg>`
- Foto Member: `http://localhost:3000/uploads/members/<nama_file.jpg>`
- Media Umum: `http://localhost:3000/uploads/general/<nama_file.jpg>`

---

## 14. Lampiran C — Spesifikasi Skema Model Data & DTO (Data Transfer Object)

Nama field, tipe data, dan aturan validasi berikut menjadi acuan untuk interface TypeScript, DTO class-validator, dan Prisma schema.

**1. RegisterMakerDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| name | string | Wajib | Budi Santoso | Nama lengkap siswa peserta ujian |
| username | string | Wajib | budisantoso | Username unik login App Maker |
| email | string | Wajib | budi@smk.sch.id | Email unik siswa untuk login & verifikasi |
| password | string | Wajib | Password123! | Min. 6 karakter |

**2. LoginMakerDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| usernameOrEmail | string | Wajib | budisantoso | Username atau email siswa terdaftar |
| password | string | Wajib | Password123! | Kata sandi akun App Maker |

**3. RegisterMemberDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| username | string | Wajib | johndoe | Username unik login member |
| password | string | Wajib | Secret123! | Min. 6 karakter |
| nama_member | string | Wajib | John Doe | Nama lengkap pelanggan |
| instansi | string | Wajib | Universitas Indonesia / PT Maju | Asal instansi/kampus/perusahaan |
| alamat | string | Wajib | Jl. Sudirman No. 123, Jakarta | Alamat domisili lengkap |
| telp | string | Wajib | 081234567890 | Nomor telepon aktif/WhatsApp |
| foto | string | Opsional | member_john.jpg | Nama file hasil upload |

**4. RegisterAdminSpaceDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| username | string | Wajib | admin_space1 | Username unik login admin lokasi |
| password | string | Wajib | Admin123! | Min. 6 karakter |
| nama_coworking | string | Wajib | Moklet Hub Coworking | Nama/branding lokasi coworking |
| nama_pemilik | string | Wajib | Ahmad Bidin | Nama penanggung jawab operasional |
| telp | string | Wajib | 081298765432 | Nomor kontak/call center pengelola |

**5. LoginDto** *(Member maupun Admin Space)*
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| username | string | Wajib | johndoe | Username pengguna terdaftar |
| password | string | Wajib | Secret123! | Kata sandi akun pengguna |

**6. CheckPromoDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_diskon | string | Wajib | DISKONHEMAT20 | Kode unik promo dari form checkout |

**7. CreateReservasiDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| id_space | number | Wajib | 1 | ID space/meja/ruangan yang dipesan |
| tanggal_reservasi | string | Wajib | 2026-08-30 | Format `YYYY-MM-DD` |
| jam_mulai | string | Wajib | 09:00 | Format `HH:mm` 24-jam |
| durasi_jam | number | Wajib | 3 | Min. 1 jam |
| id_diskon | number | Opsional | 1 | ID promo dari katalog |
| kode_promo | string | Opsional | DISKONHEMAT20 | Kode promo alternatif input manual |

**8. UpdateCoworkingProfileDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_coworking | string | Wajib | Moklet Hub Coworking Space | Nama/brand lokasi |
| nama_pemilik | string | Wajib | Ahmad Bidin, S.Kom | Nama penanggung jawab |
| telp | string | Wajib | 081298765432 | Nomor telepon resmi |

**9. CreateMemberAdminDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| username | string | Wajib | user_budi | Username unik login member |
| password | string | Wajib | Secret123! | Password awal akun member |
| nama_member | string | Wajib | Budi Raharjo | Nama lengkap member baru |
| instansi | string | Wajib | SMK Telkom Malang | Asal instansi/organisasi |
| alamat | string | Wajib | Jl. Danau Ranau No. 1, Malang | Alamat lengkap |
| telp | string | Wajib | 085712345678 | Nomor telepon aktif |
| foto | string | Opsional | budi_raharjo.jpg | Nama file foto profil |

**10. UpdateMemberAdminDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_member | string | Opsional | Budi Raharjo, S.T. | Nama lengkap diperbarui |
| instansi | string | Opsional | PT Teknologi Hebat | Instansi/organisasi baru |
| alamat | string | Opsional | Jl. Danau Ranau No. 2, Malang | Alamat domisili baru |
| telp | string | Opsional | 085712345678 | Nomor kontak baru |
| password | string | Opsional | NewSecret123! | Reset password baru |
| foto | string | Opsional | budi_new.jpg | File foto baru jika diganti |

**11. CreateSpaceDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_space | string | Wajib | Personal Desk Alpha 01 | Nama spesifik space/ruangan/meja |
| harga_per_jam | number | Wajib | 25000 | Tarif sewa per jam (IDR) |
| tipe | string | Wajib | desk | `desk` / `meeting_room` / `private_office` |
| kapasitas | number | Wajib | 1 | Kapasitas maksimal orang |
| deskripsi | string | Wajib | WiFi 100Mbps, stopkontak, coffee | Rincian fasilitas |
| foto | string | Opsional | desk_alpha_01.jpg | Nama file foto hasil upload |

**12. UpdateSpaceDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_space | string | Opsional | Personal Desk Alpha 01 (Updated) | Nama baru |
| harga_per_jam | number | Opsional | 30000 | Tarif sewa baru |
| tipe | string | Opsional | desk | `desk` / `meeting_room` / `private_office` |
| kapasitas | number | Opsional | 2 | Kapasitas baru |
| deskripsi | string | Opsional | Fasilitas upgrade monitor 27 inch 4K | Perubahan deskripsi |
| foto | string | Opsional | desk_alpha_new.jpg | File foto baru |

**13. CreateDiskonDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_diskon | string | Wajib | PROMOAGUSTUS | Kode unik (huruf kapital/angka, tanpa spasi) |
| persentase_diskon | number | Wajib | 20 | Persentase potongan (1–100) |
| tanggal_awal | string | Wajib | 2026-08-01T00:00:00Z | ISO 8601 |
| tanggal_akhir | string | Wajib | 2026-08-31T23:59:59Z | ISO 8601 |

**14. UpdateDiskonDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| nama_diskon | string | Opsional | PROMOAGUSTUS2026 | Kode promo diperbarui |
| persentase_diskon | number | Opsional | 25 | Persentase baru |
| tanggal_awal | string | Opsional | 2026-08-01T00:00:00Z | Waktu awal baru |
| tanggal_akhir | string | Opsional | 2026-09-15T23:59:59Z | Waktu akhir baru |

**15. UpdateReservasiStatusDto**
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| status | string | Wajib | disetujui | `belum_dikonfirm` / `disetujui` / `aktif` / `selesai` / `dibatalkan` |

**16. Reservasi & Payment Entity** *(struktur objek reservasi lengkap)*
| Field | Tipe | Aturan | Contoh | Keterangan |
|---|---|---|---|---|
| id | number | Wajib | 12 | ID unik transaksi reservasi |
| kode_booking | string | Wajib | BOOK-20260830-0012 | Kode unik tiket booking |
| id_member | number | Wajib | 6 | ID member pemesan |
| id_space | number | Wajib | 1 | ID space yang dipesan |
| id_diskon | number | Opsional | 1 | Null jika tanpa promo |
| tanggal_reservasi | string | Wajib | 2026-08-30 | `YYYY-MM-DD` |
| jam_mulai | string | Wajib | 09:00 | Jam mulai pemakaian |
| jam_selesai | string | Wajib | 12:00 | Hasil kalkulasi otomatis |
| durasi_jam | number | Wajib | 3 | Total durasi sewa |
| harga_per_jam | number | Wajib | 20000 | Tarif dasar saat transaksi |
| total_harga_awal | number | Wajib | 60000 | Tarif kotor sebelum diskon |
| potongan_diskon | number | Wajib | 12000 | Nominal potongan |
| total_bayar | number | Wajib | 48000 | Tagihan bersih yang harus dibayar |
| status | string | Wajib | belum_dikonfirm | `belum_dikonfirm`/`disetujui`/`aktif`/`selesai`/`dibatalkan` |

---

## 15. Catatan Terbuka

- **Platform hosting** untuk deployment saya akan menggunakan vercel + supabase, maksudnya gimana? nah deployment backend codenya saya pakai vercel. kemudian deployment dbnya atau database, saya menggunakan supabase.
- **Persistensi file upload saat deploy**: Menggunakan cloudinary untuk storage filenya.
- **`qr_code_payload`**: kontrak hanya mencontohkan string (`"VERIFY-RESERVASI-12-mk_..."`), cukup string ini saja.
- **Batas waktu pengerjaan ujian** 7 Hari
- **Auth secret strategy**: Maker JWT dan User JWT dipisah untuk keamanan & kejelasan scope token.
- **Validasi status transition** untuk reservasi, belum_dikonfirm -> disetujui -> aktif (check-in) -> selesai (check-out). Pembatalan (dibatalkan) hanya bisa dari status belum_dikonfirm atau disetujui. 


---

*Referensi: Dokumen Soal UKK RPL 2026/2027 Paket B (SMK Telkom Malang) — Bagian I, II, III & Lampiran B; format struktur brief mengacu pada dokumen "Project Brief: Sistem Manajemen Internal PAC IPNU IPPNU Lawang".*
