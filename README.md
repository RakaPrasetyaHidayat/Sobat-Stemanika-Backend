🎓 Sobat Stemanika — Backend

Backend resmi untuk aplikasi pemilihan Ketua OSIS & MPK SMKN 1 Karawang (Sobat Stemanika).
Dibangun menggunakan Node.js + Express, Supabase Auth, dan Supabase Database.

Backend ini menyediakan REST API untuk autentikasi, kandidat, ekstrakurikuler, dan sistem voting dengan validasi satu suara per pemilihan per siswa.

🚀 Fitur Utama
🔐 Autentikasi

Login & register dengan Supabase Auth.

Mendukung JWT internal server (opsional) jika JWT_SECRET diset.

Semua endpoint dilindungi dengan Bearer Token.

🗳️ Voting System

Siswa hanya bisa memilih sekali untuk setiap jenis pemilihan.

Hasil vote dihitung real-time (grouped by kandidat_id).

👤 Role-Based Access

siswa → hanya bisa voting.

admin → mengelola kandidat.

📦 Integration

Database & Auth: Supabase

Backend: Express.js REST API

📁 Struktur Proyek
server/
│── routes/
│   ├── auth.js
│   ├── eskul.js
│   ├── kandidat.js
│   ├── vote.js
│── middleware/
│── services/
│── utils/
│── server.js
│── swagger.js (opsional, jika ingin dokumentasi)
.env
package.json

⚙️ Instalasi & Setup
1. Clone repo
git clone https://github.com/your-repo/sobat-stemanika-backend.git
cd sobat-stemanika-backend

2. Konfigurasi Environment

Copy .env.example → .env:

SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-or-anon-key
PORT=3000
JWT_SECRET=your-long-random-secret
ADMIN_SECRET=your-admin-secret

3. Install dependencies
npm install

4. Jalankan server

Mode development:

npm run dev


Mode production:

npm start


Server akan berjalan pada:

http://localhost:3000

📘 API Reference

Base URL: /api

🔐 Authentication
POST /api/auth/register

Mendaftarkan akun siswa.

Body:

{
  "email": "user@mail.com",
  "password": "secret",
  "nama": "Nama Siswa",
  "nisn": "123456",
  "nip": null
}


Response:

201 Created + user data

Notes:

Role selalu siswa (tidak bisa diubah melalui request).

POST /api/auth/login

Body:

{ "email": "user@mail.com", "password": "secret" }


Response:

{
  "token": "<server-jwt?>",
  "access_token": "<supabase-token>",
  "user": { ... }
}

GET /api/auth/me

Authorization required.

Header:

Authorization: Bearer <token>


Mengembalikan user yang sedang login.

🏫 Eskul (Publik)
GET /api/eskul

Mengambil seluruh daftar ekstrakurikuler.

🧑‍🏫 Kandidat

Admin only.

GET /api/kandidat

Publik.

POST /api/kandidat

Header:

Authorization: Bearer <ADMIN_TOKEN>


Body:

{
  "nama": "Calon Ketua",
  "visi": "Maju Bersama",
  "misi": ["Disiplin", "Kerja keras"],
  "foto_url": "https://..."
}

DELETE /api/kandidat/:id

Admin only.

🗳️ Voting
POST /api/vote

Role: siswa only.

Body:

{
  "pemilihan": "ketua_osis",
  "kandidat_id": 12
}


Aturan:

User hanya dapat memilih satu kali per kategori pemilihan.

Jika sudah pernah memilih → 409 Conflict.

GET /api/vote/me

Mengambil semua vote milik user login.

GET /api/vote/results?pemilihan=ketua_osis

Public endpoint.
Mengembalikan hasil vote dalam format agregat.

🗄️ Database Schema (Supabase)
Users (Auth + Profile)
Field	Type	Note
id	uuid	Auth user id
nama	text	required
nisn_nip	text	optional
role	text	siswa / admin
Kandidat
Field	Type
id	int
nama	text
visi	text
misi	json
foto_url	text
Votes
Field	Type
id	int
user_id	uuid
pemilihan	text
kandidat_id	int
created_at	timestamp
📦 Deployment
🚀 Jika Deploy ke Vercel

Vercel tidak cocok untuk Express full-server tanpa perubahan.

Opsi deploy:

1. Rewrite ke Serverless Functions (Direkomendasikan)

Pindah setiap route ke /api/*.js

Gunakan Web API style handler

2. Deploy dengan Docker (Enterprise)
3. Host di Railway / Render / Fly.io (Simple Node Server)

Paling mudah untuk Express.

Tips Vercel

Tambahkan SUPABASE_URL & SUPABASE_KEY di env Vercel

Pastikan tidak membuka long-running server

🛡️ Admin Creation (Manual)

Endpoint:

POST /api/auth/create-admin

Header:

x-admin-secret: <ADMIN_SECRET>


Body:

{
  "email": "admin@mail.com",
  "password": "secret",
  "nama": "Admin"
}


Used for creating admin securely.

🤝 Kontribusi

PR, issue, dan improvement sangat diterima.

📩 Kontak

Jika membutuhkan:

Konversi penuh ke serverless

Swagger Documentation

Dockerfile & CI/CD

Integrasi mobile / Flutter

Beritahu saja — saya bisa siapkan secara lengkap.