# Sobat Stemanika - Backend API (Express.js)

## Ringkasan
- Backend Node.js dengan Express.js dan MySQL.
- Seluruh file frontend telah dihapus. Repositori ini kini hanya berisi API backend.
- Upload file disimpan di folder `uploads/` pada root proyek (bukan lagi di `public/`).

## Teknologi
- **Backend**: Node.js, Express.js
- **Database**: MySQL (mysql2)
- **Auth**: JWT (jose) + middleware role admin
- **Upload**: Multer (disimpan ke `uploads/`)
- **Env**: dotenv (`config.env`)
- **CORS**: cors

## Struktur Proyek
- `backend/server.js` — Entry point API
- `uploads/` — Direktori file upload
- `database.sql` — Contoh schema dan seed opsional
- `config.env` — Konfigurasi environment

## Setup & Menjalankan
1. Install dependencies
   ```bash
   npm install
   ```
2. Konfigurasi environment di `config.env`
   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
   - PORT (opsional, default 3000)
   - SESSION_SECRET, JWT_SECRET (opsional, ada default)
3. Jalankan server
   ```bash
   npm run dev   # development
   npm start     # production
   ```
4. Database
   - Tabel dibuat otomatis saat server start.

## Auth
- JWT digunakan untuk melindungi endpoint tertentu.
- Header: `Authorization: Bearer <token>`
- Dapatkan token dari endpoint login/register (lihat di bawah).

## Endpoints CRUD

### Auth
- POST `/api/register` — Register siswa (returns token + user)
- POST `/api/login` — Login (returns token + user)
- GET `/api/user` — Info user dari token (protected)

### School Info (CRUD, admin)
- GET `/api/school-info` — Ambil info sekolah terbaru
- POST `/api/school-info` — Buat info sekolah baru (admin)
- PUT `/api/school-info` — Update info sekolah terbaru (admin)
- DELETE `/api/school-info` — Hapus info sekolah terbaru (admin)

Body (POST/PUT):
```json
{
  "nama_sekolah": "string",
  "alamat": "string",
  "telepon": "string",
  "email": "string",
  "website": "string",
  "deskripsi": "string",
  "jurusan": "string"
}
```

### Eskul (CRUD)
- GET `/api/eskul` — List eskul
- POST `/api/eskul` — Tambah (admin, multipart: `logo`)
- PUT `/api/eskul/:id` — Update (admin, multipart: `logo`)
- DELETE `/api/eskul/:id` — Hapus (admin)

### Pilihan Eskul (CRUD user)
- POST `/api/eskul/pilih` — Simpan pilihan user (protected)
- GET `/api/eskul/pilihan` — List pilihan user (protected)
- DELETE `/api/eskul/pilihan/:id` — Hapus satu pilihan user (protected)

### Kandidat (CRUD)
- GET `/api/kandidat` — List kandidat
- POST `/api/kandidat` — Tambah (admin, multipart: `foto`)
- PUT `/api/kandidat/:id` — Update (admin, multipart: `foto`)
- DELETE `/api/kandidat/:id` — Hapus (admin)

### Pemilihan (CRUD)
- POST `/api/pemilihan` — Vote kandidat (protected)
- GET `/api/pemilihan/hasil` — Rekap hasil voting
- GET `/api/pemilihan` — List semua vote (admin)
- DELETE `/api/pemilihan` — Hapus vote user saat ini (protected)

### Jadwal (CRUD)
- GET `/api/jadwal` — List jadwal (filter `kelas` & `jurusan` opsional)
- GET `/api/jadwal/all` — List semua jadwal (admin)
- POST `/api/jadwal` — Tambah (admin, multipart: `jadwal_gambar`)
- PUT `/api/jadwal/:id` — Update (admin, multipart: `jadwal_gambar`)
- DELETE `/api/jadwal/:id` — Hapus (admin)

### Ujian (CRUD)
- GET `/api/ujian` — List ujian
- POST `/api/ujian` — Tambah (admin)
- PUT `/api/ujian/:id` — Update (admin)
- DELETE `/api/ujian/:id` — Hapus (admin)

### Profile (CRUD user)
- GET `/api/profile` — Profil user (protected)
- PUT `/api/profile` — Update profil (protected)
- DELETE `/api/profile` — Hapus akun (protected)

## Uploads
- File disimpan ke `uploads/`.
- Diakses via URL `/uploads/<filename>`.

## Catatan Migrasi
- Folder `public/` dan seluruh frontend telah dihapus.
- Upload dipindahkan ke `uploads/` dan dilayani statis oleh backend (`/uploads`).

## Troubleshooting
- Pastikan MySQL berjalan dan kredensial di `config.env` benar.
- Jika JWT invalid: cek `Authorization` header dan `JWT_SECRET`.
- Pastikan folder `uploads/` memiliki izin tulis.

## Lisensi
MIT
