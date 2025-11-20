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

| Platform          | Status                      |
| ----------------- | --------------------------- |
| **Railway**       | Recomended                  |
| **Render**        | Easy to Deploy              |
| **Vercel**        | Need Serverless Adaptationn |
| **Fly.io**        | Good Performance            |
| **Docker**        | Production Ready            |


👑 Admin Access

Untuk keamanan, role admin diatur langsung melalui Supabase Dashboard.

🎯 Project Goal

Proyek ini dibuat untuk mendukung transformasi digital sekolah dengan menghadirkan:

✔ Pemilu OSIS & MPK yang modern

✔ Lebih aman dan terhindar dari manipulasi

✔ Melatih siswa menggunakan teknologi digital

✔ Dokumentasi & hasil yang transparan


📜 License

bebas digunakan untuk kebutuhan sekolah lain dengan sepengetahuan dan perizinan developer asli

Jika kamu ingin, saya bisa membuat:

---------------------------------------------------------


Merancang arsitektur kode backend agar terlihat profesional dan mudah dikelola (maintainable) adalah kunci. Profesionalisme dalam kode backend terutama dinilai dari struktur, modularitas, dan pemisahan tanggung jawab (Separation of Concerns).Berikut adalah tahapan detail untuk merapikan dan menyusun arsitektur kode backend Anda, khususnya jika Anda menggunakan Node.js dan Express:1. 🏗️ Struktur Proyek Berbasis Layer (Layered Architecture)Arsitektur profesional memisahkan logika aplikasi menjadi lapisan (layers) yang jelas. Ini adalah dasar dari prinsip Separation of Concerns.A. Folder Root yang BersihJagalah folder root tetap rapi dan hanya berisi:package.json & package-lock.json: Dependencies proyek..env & .env.example: Variabel lingkungan (pastikan .env ada di .gitignore!)..gitignore: File yang dikecualikan dari repository.server.js atau index.js: File entry point utama yang hanya bertugas menjalankan server.src/ atau app/: Semua logika aplikasi berada di dalam folder ini.B. Struktur di dalam src/ (Contoh Struktur MVC atau Domain)Di dalam src/, pisahkan kode Anda menjadi folder-folder berdasarkan tanggung jawab:FolderTanggung Jawab (Layer)Contoh Isiroutes/Routing LayerMendefinisikan endpoint dan memanggil Controller yang sesuai.controllers/Controller LayerMenerima permintaan (req), memanggil Service (Business Logic), dan mengirim respons (res).services/Business Logic LayerBerisi semua aturan bisnis inti (validasi, perhitungan, orkestrasi data). Tidak tahu menahu tentang req dan res.models/Data Modeling LayerDefinisi struktur data (misalnya schema Mongoose atau model Sequelize).db/Data Access LayerBerisi file koneksi database utama dan fungsi-fungsi DAO (Data Access Object) atau repository yang berinteraksi langsung dengan DB.middleware/Cross-Cutting ConcernsFungsi-fungsi yang diulang (Autentikasi, Rate Limiting, CORS).utils/UtilitiesFungsi-fungsi pembantu umum yang tidak spesifik pada logika bisnis (format tanggal, hasher password, error formatter).2. 🧱 Pemisahan Tanggung Jawab (Separation of Concerns)Ini adalah inti dari arsitektur profesional. Setiap file dan layer harus memiliki satu pekerjaan yang jelas.A. Controller Minimalis (Thin Controllers)Hindari Logika Bisnis: Controller tidak boleh mengandung logika bisnis, perhitungan, atau query database.Tugasnya: Controller hanya boleh memanggil method dari Service dan menangani respons/error HTTP.Bad (Controller Boros): Controller melakukan validasi, lalu memanggil User.create().Good (Controller Minimalis): Controller memanggil userService.createUser(data) dan menunggu hasilnya.B. Logic di Layer ServicesLayer services/ adalah jantung aplikasi Anda.Semua validasi data kompleks, manipulasi, dan orkestrasi antara database dan API eksternal harus ada di sini.Service harus dapat diuji secara independen dari HTTP (req/res).C. Abstraksi Data (Repository Pattern)Layer db/ atau repositories/ bertanggung jawab untuk berbicara langsung dengan database.Service tidak boleh langsung memanggil model seperti User.find(). Sebaliknya, Service memanggil: userRepository.findAllUsers().Keuntungan: Jika Anda ingin beralih dari PostgreSQL ke MongoDB, Anda hanya perlu memodifikasi repository, dan Service Layer Anda tidak perlu tahu tentang perubahan tersebut.3. 🛡️ Penanganan Error yang KonsistenAplikasi profesional memiliki penanganan error yang terpusat dan mudah diprediksi.A. Centralized Error HandlingBuat middleware penanganan error tunggal (di src/middleware/errorHandler.js) yang ditempatkan di akhir semua middleware dan route Express.Semua route dan service yang mengalami error harus menggunakan next(error) atau melempar error dengan kode status HTTP yang tepat.B. Custom Error ClassesBuat class error kustom (misalnya NotFoundError, UnauthorizedError) untuk memberikan konteks error yang jelas.JavaScript// Contoh Custom Error (di src/utils/errors.js)
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 404; // Custom status code
    }
}
// Di Controller/Service, gunakan: throw new NotFoundError('User not found');
4. 🗂️ Pengelolaan KonfigurasiVariabel Lingkungan: Gunakan process.env untuk semua konfigurasi (port, kunci API, URL database).Konfigurasi Terpusat: Buat file konfigurasi tunggal (misalnya src/config/index.js) yang memuat dan memvalidasi semua variabel lingkungan yang dibutuhkan saat aplikasi dimulai. Ini menjaga kode inti Anda bebas dari logika pengambilan variabel lingkungan.Menerapkan struktur berlapis dan pemisahan tanggung jawab ini akan membuat backend Anda mudah dibaca, diuji, dan ditingkatkan, yang merupakan ciri utama dari codebase yang profesional.