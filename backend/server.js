const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { SignJWT, jwtVerify } = require('jose');
require('dotenv').config({ path: '../config.env' });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sobat-stemanika-jwt-secret-key';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'sobat-stemanika-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sobat_stemanika'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.log('Continuing without database connection for testing...');
        return;
    }
    console.log('Connected to MySQL database');
    createTables();
});

function createTables() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nis VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            nama VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            role ENUM('admin', 'siswa', 'guest') DEFAULT 'guest',
            jurusan VARCHAR(50),
            kelas VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createSchoolInfoTable = `
        CREATE TABLE IF NOT EXISTS school_info (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_sekolah VARCHAR(100) NOT NULL,
            alamat TEXT,
            telepon VARCHAR(20),
            email VARCHAR(100),
            website VARCHAR(100),
            deskripsi TEXT,
            jurusan TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

    const createEskulTable = `
        CREATE TABLE IF NOT EXISTS eskul (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_eskul VARCHAR(100) NOT NULL,
            deskripsi TEXT,
            logo VARCHAR(255),
            kontak_center VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createEskulPilihanTable = `
        CREATE TABLE IF NOT EXISTS eskul_pilihan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            eskul_id INT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (eskul_id) REFERENCES eskul(id) ON DELETE CASCADE
        )
    `;

    const createKandidatTable = `
        CREATE TABLE IF NOT EXISTS kandidat (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100) NOT NULL,
            nis VARCHAR(20) NOT NULL,
            posisi ENUM('ketos', 'waketos') NOT NULL,
            visi TEXT,
            misi TEXT,
            foto VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createPemilihanTable = `
        CREATE TABLE IF NOT EXISTS pemilihan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            kandidat_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (kandidat_id) REFERENCES kandidat(id) ON DELETE CASCADE
        )
    `;

    const createJadwalTable = `
        CREATE TABLE IF NOT EXISTS jadwal (
            id INT AUTO_INCREMENT PRIMARY KEY,
            hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu') NOT NULL,
            jam_mulai TIME NOT NULL,
            jam_selesai TIME NOT NULL,
            mata_pelajaran VARCHAR(100) NOT NULL,
            guru VARCHAR(100),
            kelas VARCHAR(10),
            jurusan VARCHAR(50),
            gambar VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createUjianTable = `
        CREATE TABLE IF NOT EXISTS ujian (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_ujian VARCHAR(100) NOT NULL,
            link_ujian TEXT NOT NULL,
            deskripsi TEXT,
            tanggal_mulai DATETIME,
            tanggal_selesai DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createUsersTable);
    db.query(createSchoolInfoTable);
    db.query(createEskulTable);
    db.query(createEskulPilihanTable);
    db.query(createKandidatTable);
    db.query(createPemilihanTable);
    db.query(createJadwalTable);
    db.query(createUjianTable);

    const defaultPassword = bcrypt.hashSync('123456', 10);
    const insertAdmin = `
        INSERT IGNORE INTO users (nis, password, nama, role)
        VALUES ('admin', '${defaultPassword}', 'Administrator', 'admin')
    `;
    db.query(insertAdmin);

    const insertSchoolInfo = `
        INSERT IGNORE INTO school_info (nama_sekolah, alamat, telepon, email, website, deskripsi, jurusan)
        VALUES ('Sobat Stemanika', 'Jl. Pendidikan No. 123', '021-1234567', 'info@stemanika.sch.id', 'www.stemanika.sch.id', 'Sekolah Menengah Kejuruan yang berkomitmen untuk menghasilkan lulusan berkualitas', 'RPL, TKJ, TSM, TKR, TKL, DPIB, TPM')
    `;
    db.query(insertSchoolInfo);
}

// Ensure uploads directory exists relative to project root backend-independent
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve uploads statically for file access without frontend
app.use('/uploads', express.static(uploadsDir));

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

app.post('/api/register', async (req, res) => {
    const { nis, password, nama, email, jurusan, kelas } = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const query = `
            INSERT INTO users (nis, password, nama, email, role, jurusan, kelas)
            VALUES (?, ?, ?, ?, 'siswa', ?, ?)
        `;

        db.query(query, [nis, hashedPassword, nama, email, jurusan, kelas], async (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'NIS sudah terdaftar' });
                }
                return res.status(500).json({ error: 'Error registering user' });
            }

            const user = { id: result.insertId, nis, nama, role: 'siswa' };
            const token = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(new TextEncoder().encode(JWT_SECRET));

            res.json({ message: 'Registration successful', token, user });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { nis, password } = req.body;
    db.query('SELECT * FROM users WHERE nis = ?', [nis], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ error: 'NIS tidak ditemukan' });
        const user = results[0];
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) return res.status(401).json({ error: 'Password salah' });

        const tokenUser = { id: user.id, nis: user.nis, nama: user.nama, role: user.role };
        const token = await new SignJWT(tokenUser).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('24h').sign(new TextEncoder().encode(JWT_SECRET));

        res.json({ message: 'Login successful', token, user: tokenUser });
    });
});

app.get('/api/user', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

app.get('/api/school-info', (req, res) => {
    const query = 'SELECT * FROM school_info ORDER BY id DESC LIMIT 1';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0] || {});
    });
});

// Create new school info (admin)
app.post('/api/school-info', authenticateToken, requireAdmin, (req, res) => {
    const { nama_sekolah, alamat, telepon, email, website, deskripsi, jurusan } = req.body;
    const query = `
        INSERT INTO school_info (nama_sekolah, alamat, telepon, email, website, deskripsi, jurusan)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [nama_sekolah, alamat, telepon, email, website, deskripsi, jurusan], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'School info created successfully', id: result.insertId });
    });
});

app.put('/api/school-info', authenticateToken, requireAdmin, (req, res) => {
    const { nama_sekolah, alamat, telepon, email, website, deskripsi, jurusan } = req.body;
    const query = `
        UPDATE school_info SET
        nama_sekolah = ?, alamat = ?, telepon = ?, email = ?,
        website = ?, deskripsi = ?, jurusan = ?
        WHERE id = (SELECT id FROM (SELECT id FROM school_info ORDER BY id DESC LIMIT 1) AS temp)
    `;
    db.query(query, [nama_sekolah, alamat, telepon, email, website, deskripsi, jurusan], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'School info updated successfully' });
    });
});

// Delete latest school info (admin)
app.delete('/api/school-info', authenticateToken, requireAdmin, (req, res) => {
    const query = `
        DELETE FROM school_info
        WHERE id = (SELECT id FROM (SELECT id FROM school_info ORDER BY id DESC LIMIT 1) AS temp)
    `;
    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'No data to delete' });
        res.json({ message: 'School info deleted successfully' });
    });
});

app.get('/api/eskul', (req, res) => {
    const query = 'SELECT * FROM eskul ORDER BY nama_eskul';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/eskul', authenticateToken, requireAdmin, upload.single('logo'), (req, res) => {
    const { nama_eskul, deskripsi, kontak_center } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    const query = 'INSERT INTO eskul (nama_eskul, deskripsi, logo, kontak_center) VALUES (?, ?, ?, ?)';
    db.query(query, [nama_eskul, deskripsi, logo, kontak_center], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Extracurricular added successfully', id: result.insertId });
    });
});

app.put('/api/eskul/:id', authenticateToken, requireAdmin, upload.single('logo'), (req, res) => {
    const { id } = req.params;
    const { nama_eskul, deskripsi, kontak_center } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : req.body.logo;

    const query = 'UPDATE eskul SET nama_eskul = ?, deskripsi = ?, logo = ?, kontak_center = ? WHERE id = ?';
    db.query(query, [nama_eskul, deskripsi, logo, kontak_center, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Extracurricular updated successfully' });
    });
});

app.delete('/api/eskul/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM eskul WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Extracurricular deleted successfully' });
    });
});

app.post('/api/eskul/pilih', authenticateToken, (req, res) => {
    const { eskul_id } = req.body;
    const user_id = req.user.id;

    const checkQuery = 'SELECT * FROM eskul_pilihan WHERE user_id = ? AND eskul_id = ?';
    db.query(checkQuery, [user_id, eskul_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Anda sudah memilih eskul ini' });
        }

        const insertQuery = 'INSERT INTO eskul_pilihan (user_id, eskul_id) VALUES (?, ?)';
        db.query(insertQuery, [user_id, eskul_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Extracurricular choice saved successfully' });
        });
    });
});

app.get('/api/eskul/pilihan', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    const query = `
        SELECT ep.*, e.nama_eskul, e.deskripsi, e.logo
        FROM eskul_pilihan ep
        JOIN eskul e ON ep.eskul_id = e.id
        WHERE ep.user_id = ?
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Hapus pilihan eskul tertentu untuk user saat ini
app.delete('/api/eskul/pilihan/:id', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { id } = req.params; // id dari tabel eskul_pilihan
    const query = 'DELETE FROM eskul_pilihan WHERE id = ? AND user_id = ?';
    db.query(query, [id, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
        res.json({ message: 'Pilihan eskul dihapus' });
    });
});

app.get('/api/kandidat', (req, res) => {
    const query = 'SELECT * FROM kandidat ORDER BY posisi, nama';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/kandidat', authenticateToken, requireAdmin, upload.single('foto'), (req, res) => {
    const { nama, nis, posisi, visi, misi } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : null;

    const query = 'INSERT INTO kandidat (nama, nis, posisi, visi, misi, foto) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [nama, nis, posisi, visi, misi, foto], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Candidate added successfully', id: result.insertId });
    });
});

// Update kandidat
app.put('/api/kandidat/:id', authenticateToken, requireAdmin, upload.single('foto'), (req, res) => {
    const { id } = req.params;
    const { nama, nis, posisi, visi, misi } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : req.body.foto;
    const query = 'UPDATE kandidat SET nama = ?, nis = ?, posisi = ?, visi = ?, misi = ?, foto = ? WHERE id = ?';
    db.query(query, [nama, nis, posisi, visi, misi, foto, id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Candidate updated successfully' });
    });
});

app.post('/api/pemilihan', authenticateToken, (req, res) => {
    const { kandidat_id } = req.body;
    const user_id = req.user.id;

    const checkQuery = 'SELECT * FROM pemilihan WHERE user_id = ?';
    db.query(checkQuery, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Anda sudah memilih' });
        }

        const insertQuery = 'INSERT INTO pemilihan (user_id, kandidat_id) VALUES (?, ?)';
        db.query(insertQuery, [user_id, kandidat_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Vote recorded successfully' });
        });
    });
});

app.get('/api/pemilihan/hasil', (req, res) => {
    const query = `
        SELECT k.*, COUNT(p.id) as jumlah_suara
        FROM kandidat k
        LEFT JOIN pemilihan p ON k.id = p.kandidat_id
        GROUP BY k.id
        ORDER BY k.posisi, jumlah_suara DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// List all votes (admin)
app.get('/api/pemilihan', authenticateToken, requireAdmin, (req, res) => {
    const query = `
        SELECT p.id, p.created_at, u.id AS user_id, u.nis, u.nama AS nama_user, k.id AS kandidat_id, k.nama AS nama_kandidat, k.posisi
        FROM pemilihan p
        JOIN users u ON p.user_id = u.id
        JOIN kandidat k ON p.kandidat_id = k.id
        ORDER BY p.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Revoke current user's vote
app.delete('/api/pemilihan', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const query = 'DELETE FROM pemilihan WHERE user_id = ?';
    db.query(query, [user_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tidak ada vote untuk dihapus' });
        res.json({ message: 'Vote dihapus' });
    });
});

app.delete('/api/kandidat/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM kandidat WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Candidate deleted successfully' });
    });
});

app.get('/api/jadwal/all', authenticateToken, requireAdmin, (req, res) => {
    const query = 'SELECT * FROM jadwal ORDER BY kelas, jurusan, hari, jam_mulai';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.get('/api/jadwal', (req, res) => {
    const { kelas, jurusan } = req.query;
    let query = 'SELECT * FROM jadwal';
    let params = [];
    if (kelas && jurusan) {
        query += ' WHERE kelas = ? AND jurusan = ?';
        params = [kelas, jurusan];
    }
    query += ' ORDER BY FIELD(hari, "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"), jam_mulai';
    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/jadwal', authenticateToken, requireAdmin, upload.single('jadwal_gambar'), (req, res) => {
    const { hari, jam_mulai, jam_selesai, mata_pelajaran, guru, kelas, jurusan } = req.body;
    const gambar = req.file ? `/uploads/${req.file.filename}` : null;
    const query = 'INSERT INTO jadwal (hari, jam_mulai, jam_selesai, mata_pelajaran, guru, kelas, jurusan, gambar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [hari, jam_mulai, jam_selesai, mata_pelajaran, guru, kelas, jurusan, gambar], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Schedule added successfully', id: result.insertId });
    });
});

app.put('/api/jadwal/:id', authenticateToken, requireAdmin, upload.single('jadwal_gambar'), (req, res) => {
    const { id } = req.params;
    const { hari, jam_mulai, jam_selesai, mata_pelajaran, guru, kelas, jurusan } = req.body;
    const gambar = req.file ? `/uploads/${req.file.filename}` : req.body.current_gambar;
    const query = 'UPDATE jadwal SET hari = ?, jam_mulai = ?, jam_selesai = ?, mata_pelajaran = ?, guru = ?, kelas = ?, jurusan = ?, gambar = ? WHERE id = ?';
    db.query(query, [hari, jam_mulai, jam_selesai, mata_pelajaran, guru, kelas, jurusan, gambar, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Schedule updated successfully' });
    });
});

app.delete('/api/jadwal/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM jadwal WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Schedule deleted successfully' });
    });
});

app.get('/api/ujian', (req, res) => {
    const query = 'SELECT * FROM ujian ORDER BY tanggal_mulai DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/ujian', authenticateToken, requireAdmin, (req, res) => {
    const { nama_ujian, link_ujian, deskripsi, tanggal_mulai, tanggal_selesai } = req.body;

    const query = 'INSERT INTO ujian (nama_ujian, link_ujian, deskripsi, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nama_ujian, link_ujian, deskripsi, tanggal_mulai, tanggal_selesai], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Exam link added successfully', id: result.insertId });
    });
});

app.put('/api/ujian/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nama_ujian, link_ujian, deskripsi, tanggal_mulai, tanggal_selesai } = req.body;

    const query = 'UPDATE ujian SET nama_ujian = ?, link_ujian = ?, deskripsi = ?, tanggal_mulai = ?, tanggal_selesai = ? WHERE id = ?';
    db.query(query, [nama_ujian, link_ujian, deskripsi, tanggal_mulai, tanggal_selesai, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Exam link updated successfully' });
    });
});

app.delete('/api/ujian/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM ujian WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Exam link deleted successfully' });
    });
});

app.get('/api/profile', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    const query = 'SELECT id, nis, nama, email, role, jurusan, kelas FROM users WHERE id = ?';
    db.query(query, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
    });
});

app.put('/api/profile', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { nama, email, jurusan, kelas } = req.body;

    const query = 'UPDATE users SET nama = ?, email = ?, jurusan = ?, kelas = ? WHERE id = ?';
    db.query(query, [nama, email, jurusan, kelas, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

app.delete('/api/profile', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Account deleted successfully' });
    });
});

app.get('/api/test-jwt', async (req, res) => {
    const token = await new SignJWT({ test: 'data', secret: JWT_SECRET }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(new TextEncoder().encode(JWT_SECRET));
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    res.json({
        message: 'JWT test endpoint',
        token: token,
        secret_used: JWT_SECRET,
        decoded: payload
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`JWT Secret: ${JWT_SECRET}`);
});