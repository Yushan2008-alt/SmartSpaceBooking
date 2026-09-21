# Smart Space Booking — REST API Backend

Backend REST API untuk Sistem Reservasi Coworking Space & Workstation (Uji Kompetensi Keahlian RPL 2026/2027 Paket B).

Dibangun menggunakan **NestJS**, **Prisma ORM**, **PostgreSQL (Supabase)**, dan **Cloudinary**.

---

## 🚀 Tech Stack
- **Runtime & Framework:** Node.js (>= 18), [NestJS](https://nestjs.com/) v11
- **Database Layer:** PostgreSQL hosted on [Supabase](https://supabase.com/), [Prisma ORM](https://www.prisma.io/) v6
- **Media Storage:** Dual Storage Abstraction (Local Disk Storage untuk development lokal & [Cloudinary](https://cloudinary.com/) untuk deployment/cloud)
- **Authentication & Security:** JSON Web Tokens (JWT), Bcrypt hashing, Role-Based Access Control (`member`, `admin_space`)
- **API Documentation:** OpenAPI 3.0 via [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)
- **Deployment Target:** [Vercel Serverless Functions](https://vercel.com/)

---

## 📁 Struktur Direktori Utama
```text
src/
├── app.controller.ts            # Root & Health check
├── app.module.ts                # Root module
├── main.ts                      # Bootstrap server, static assets, & Swagger
├── common/                      # Interceptor envelope global, exception filter, decorators, guards
├── modules/
│   ├── auth/                    # Register member/admin & login
│   ├── spaces/                  # Katalog space & cek ketersediaan (overlap detection)
│   ├── diskon/                  # Promo aktif & validasi potongan kupon
│   ├── reservasi/               # Checkout pemesanan, e-ticket, & state machine
│   ├── admin/                   # Profil lokasi, manajemen member, space, diskon, reservasi, check-in/out
│   ├── reports/                 # Laporan pendapatan bulanan & breakdown per tipe
│   └── upload/                  # Upload berkas gambar dengan Dual Storage Abstraction
└── prisma/                      # Prisma service & database module
```

---

## ⚙️ Persyaratan Sistem & Instalasi

### 1. Prasyarat
- Node.js versi 18.x atau 20.x / 22.x
- npm versi 9.x atau lebih baru

### 2. Instalasi Dependensi
```bash
# Clone repository
git clone https://github.com/Yushan2008-alt/SmartSpaceBooking.git
cd SmartSpaceBooking

# Install dependencies
npm install
```

---

## 🔑 Konfigurasi Environment Variables (`.env`)

Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi konfigurasi berikut sesuai environment Anda:

| Variabel | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string PostgreSQL Supabase | `postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `PORT` | Port server lokal | `3000` |
| `JWT_SECRET_USER` | Secret key untuk signing JWT Token | `smart_space_user_super_secret_jwt_key_2026` |
| `STORAGE_TYPE` | Driver upload (`local` / `cloudinary`) | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name akun Cloudinary | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | API Key akun Cloudinary | `your_api_key` |
| `CLOUDINARY_API_SECRET` | API Secret akun Cloudinary | `your_api_secret` |

> **Catatan Dual Storage:** Pada mode lokal (`NODE_ENV=local` atau `STORAGE_TYPE=local`), file disimpan ke folder lokal `uploads/<kategori>/<file>` dan dapat diakses statis via `http://localhost:3000/uploads/...`. Di environment cloud/Vercel (`NODE_ENV=production`), sistem otomatis beralih menggunakan Cloudinary Storage.

---

## 🗄️ Sinkronisasi Basis Data & Seeding Awal

### 1. Sinkronisasi Schema Prisma
Untuk menerapkan skema database ke database PostgreSQL Supabase:
```bash
npx prisma db push
```

Atau bila menjalankan migrasi:
```bash
npx prisma migrate deploy
```

### 2. Jalankan Seeding Data Awal
Inisialisasi akun demo dan data bawaan:
```bash
npx ts-node prisma/seed.ts
```

#### 👤 Kredensial Bawaan Seeding:
- **Admin Coworking Space:**
  - Username: `admin_moklet`
  - Password: `Admin123!`
  - Role: `admin_space`
  - Nama Coworking: `Moklet Hub Coworking Space`
- **Member (Pelanggan):**
  - Username: `johndoe`
  - Password: `Secret123!`
  - Role: `member`
- **Kode Promo Bawaan:**
  - Kode: `DISKONHEMAT20` (Diskon 20%, Aktif sepanjang tahun 2026)

---

## ▶️ Menjalankan Aplikasi

### Mode Development (Lokal)
```bash
npm run start:dev
```
Server akan aktif di: **`http://localhost:3000`**

### Mode Production (Build & Start)
```bash
npm run build
npm run start:prod
```

### Akses Dokumentasi Swagger UI
Buka browser dan navigasi ke:
- **Lokal:** `http://localhost:3000/docs`
- **OpenAPI JSON Spec:** `http://localhost:3000/docs-json`

---

## ☁️ Deployment ke Vercel (Production)

Proyek ini telah dikonfigurasi menggunakan file [`vercel.json`](./vercel.json) untuk berjalan secara serverless di Vercel:

1. **Push Perubahan ke GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete Smart Space Booking REST API"
   git push origin main
   ```
2. **Setup Proyek di Vercel Dashboard:**
   - Import repository `Yushan2008-alt/SmartSpaceBooking`.
   - Pada **Environment Variables**, tambahkan:
     - `DATABASE_URL`
     - `JWT_SECRET_USER`
     - `STORAGE_TYPE` = `cloudinary`
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
3. Vercel akan otomatis menjalankan `npm run build` (`prisma generate && nest build`) dan men-deploy API secara global.
4. Akses Swagger di URL hosting: `https://<nama-proyek-anda>.vercel.app/docs`.

---

## 📮 Postman Collection

File Postman Collection v2.1 telah disertakan di root repository:
- **File:** [`SmartSpaceBooking.postman_collection.json`](./SmartSpaceBooking.postman_collection.json)

### Cara Import ke Postman:
1. Buka Postman -> Klik tombol **Import**.
2. Pilih file `SmartSpaceBooking.postman_collection.json`.
3. Variabel `baseUrl` default diatur ke `http://localhost:3000` (atau ganti ke domain Vercel Anda).
4. Lakukan request `POST /api/auth/login` (Admin/Member) untuk mengisi token secara otomatis.

---

## 📋 Ringkasan Katalog Endpoint

| Modul | Method | Endpoint | Keterangan |
| :--- | :---: | :--- | :--- |
| **Root & Health** | `GET` | `/` | Informasi status API & panduan |
| | `GET` | `/health` | Health check server |
| **Auth** | `POST`| `/api/auth/register/member` | Registrasi akun pelanggan/member |
| | `POST`| `/api/auth/register/admin-space` | Registrasi pengelola/admin space |
| | `POST`| `/api/auth/login` | Login universal (mengembalikan token JWT) |
| | `GET` | `/api/auth/profile` | Profil akun yang sedang login |
| **Spaces** | `GET` | `/api/spaces/types` | Daftar tipe space (Desk, Meeting, Office) |
| | `GET` | `/api/spaces/availability` | Cek overlap jadwal ketersediaan space |
| | `GET` | `/api/spaces` | Katalog space (filter `?tipe`, `?search`) |
| | `GET` | `/api/spaces/:id` | Detail data space |
| **Diskon** | `GET` | `/api/diskon/active` | Daftar promo aktif hari ini |
| | `POST`| `/api/diskon/check` | Validasi kode promo & hitung potongan harga |
| | `GET` | `/api/diskon/:id` | Detail promo diskon |
| **Reservasi (Member)** | `POST`| `/api/reservasi` | Checkout pemesanan space |
| | `GET` | `/api/reservasi/my` | Daftar reservasi aktif milik saya |
| | `GET` | `/api/reservasi/my/history` | Riwayat transaksi (`?month`, `?year`, total belanja) |
| | `GET` | `/api/reservasi/:id/e-ticket`| Nota digital & string QR code |
| | `GET` | `/api/reservasi/:id` | Detail transaksi reservasi |
| | `PATCH`| `/api/reservasi/:id/cancel`| Pembatalan pemesanan |
| **Admin Profil** | `GET` | `/api/admin/profile` | Profil lokasi coworking admin |
| | `PUT` | `/api/admin/profile` | Update informasi lokasi & pengelola |
| **Admin Member** | `GET` | `/api/admin/members` | Daftar seluruh member |
| | `POST`| `/api/admin/members` | Tambah member baru dari admin |
| | `GET` | `/api/admin/members/:id` | Detail member |
| | `PUT` | `/api/admin/members/:id` | Update data member & reset password |
| | `DELETE`| `/api/admin/members/:id`| Hapus member |
| **Admin Spaces** | `GET` | `/api/admin/spaces` | Daftar space milik admin |
| | `POST`| `/api/admin/spaces` | Tambah ruangan/meja workstation |
| | `GET` | `/api/admin/spaces/:id` | Detail space |
| | `PUT` | `/api/admin/spaces/:id` | Update fasilitas / harga space |
| | `DELETE`| `/api/admin/spaces/:id`| Hapus space |
| **Admin Diskon** | `GET` | `/api/admin/diskon` | Daftar semua event promo |
| | `POST`| `/api/admin/diskon` | Buat promo diskon baru |
| | `GET` | `/api/admin/diskon/:id` | Detail diskon |
| | `PUT` | `/api/admin/diskon/:id` | Update promo diskon |
| | `DELETE`| `/api/admin/diskon/:id`| Hapus promo diskon |
| **Admin Reservasi** | `GET` | `/api/admin/reservasi` | Filter reservasi (`?month`, `?year`, `?status`, `?tanggal`) |
| | `PATCH`| `/api/admin/reservasi/:id/status`| Update status reservasi (State Machine) |
| | `POST`| `/api/admin/reservasi/:id/check-in` | Check-in member di lokasi (`disetujui` $\rightarrow$ `aktif`) |
| | `POST`| `/api/admin/reservasi/:id/check-out`| Check-out member (`aktif` $\rightarrow$ `selesai`) |
| **Reports** | `GET` | `/api/admin/reports/monthly` | Rekapitulasi pendapatan & breakdown per tipe |
| | `GET` | `/api/admin/reports/income` | Ringkasan income bulanan |
| **Upload** | `POST`| `/api/upload/image` | Upload berkas gambar umum |
| | `POST`| `/api/upload/spaces` | Upload foto space/ruangan |
| | `POST`| `/api/upload/members` | Upload foto profil pelanggan |

---

## 📄 Lisensi
UNLICENSED — Proyek Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak 2026/2027.
