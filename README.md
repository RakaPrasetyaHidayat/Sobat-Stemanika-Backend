<p align="center">🎓 Sobat Stemanika — Official Election Backend</p>
<p align="center">Digital Voting System for OSIS & MPK Election — SMKN 1 Majalengka</p> <p align="center"> <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js" /> <img src="https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express" /> <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase" /> <img src="https://img.shields.io/badge/JWT-Secure-FFB000?style=for-the-badge&logo=jsonwebtokens" /> </p>
🔥 Overview

Sobat Stemanika adalah backend resmi untuk sistem pemilihan digital OSIS & MPK di SMKN 1 Majalengka.
Dibangun untuk menggantikan proses pemilu manual menjadi:

✔ Modern dan efisien

✔ Aman dan anti–manipulasi

✔ Satu siswa satu suara

✔ Menggunakan autentikasi Supabase

✔ Hasil real-time dan transparan

Backend ini menyediakan REST API yang digunakan website utama untuk menampilkan kandidat, menampilkan visi–misi, dan melakukan voting secara aman.

🚀 Key Features
🔐 1. Secure Student Authentication

Login menggunakan Supabase Auth

Role-based access (student/admin)

JWT untuk otorisasi server

🗳️ 2. One Student, One Vote

Validasi otomatis: siswa hanya bisa memilih sekali per kategori

Server menolak voting kedua (HTTP 409 Conflict)

Semua vote tercatat permanen dan terenkripsi

🧑‍🏫 3. Candidate Management (Admin Only)

Admin dapat:

Menambahkan kandidat

Menghapus kandidat

Mengedit info kandidat

Mengelola visi & misi (JSON)

Mengunggah foto kandidat

📊 4. Real-Time Voting Results

Sistem menyediakan endpoint publik untuk menampilkan:

Total suara per kandidat

Statistik pemilihan

Live count untuk dashboard sekolah

🏫 5. Public Extracurricular (Eskul) Directory

Siswa dapat melihat daftar ektrakurikuler melalui public API.

| Layer             | Technology          |
| ----------------- | ------------------- |
| **Runtime**       | Node.js             |
| **Framework**     | Express.js          |
| **Database**      | Supabase PostgreSQL |
| **Auth**          | Supabase Auth       |
| **Tokens**        | JWT                 |
| **Documentation** | Swagger             |

📁 Project Structure
server/
├── routes/         # Auth, candidates, votes, eskul
├── middleware/     # JWT check, admin check
├── services/       # Supabase + business logic
├── utils/          # Helpers
├── server.js       # Main entry point
├── swagger.js      # API docs (optional)
├── .env.example    # Environment variables
└── package.json

⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/RakaPrasetyaHidayat/Sobat-Stemanika-Backend.git
cd Sobat-Stemanika-Backend

2️⃣ Install Dependencies
npm install

3️⃣ Create .env File

Salin dari .env.example, kemudian isi:

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key

JWT_SECRET=your_random_secret
PORT=3000

4️⃣ Run Development Server
npm run dev


Server berjalan di:

http://localhost:3000

🌐 Deployment Options
Platform	Status
Railway	✔ Recommended
Render	✔ Easy to deploy
Fly.io	✔ Good performance
Vercel	⚠ Needs serverless adaptation
Docker	✔ Production ready
👑 Admin Access

Untuk keamanan, role admin diatur langsung melalui Supabase Dashboard atau melalui endpoint khusus dengan ADMIN_SECRET.

🎯 Project Goal

Proyek ini dibuat untuk mendukung transformasi digital sekolah dengan menghadirkan:

✔ Pemilu OSIS & MPK yang modern

✔ Lebih aman dan terhindar dari manipulasi

✔ Melatih siswa menggunakan teknologi digital

✔ Dokumentasi & hasil yang transparan


📜 License

bebas digunakan untuk kebutuhan sekolah lain dengan sepengetahuan dan perizinan developer asli

Jika kamu ingin, saya bisa membuat: