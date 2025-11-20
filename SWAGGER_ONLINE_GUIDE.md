# 🚀 Swagger Online Access Guide

## ✅ Masalah yang Sudah Diperbaiki

1. **Fix CORS** ✅ - Swagger sekarang bisa akses API dari berbagai origin
2. **Fix .env** ✅ - SUPABASE_URL tidak lagi duplikat
3. **Add Multiple Servers** ✅ - Support localhost dan Vercel

---

## 📱 Cara Akses Swagger Online (Share ke Teman)

### ✅ **Option 1: Swagger di Vercel (Recommended)**

Swagger sudah ter-deploy di Vercel bersama API!

**URL:** `https://sobat-stemanika.vercel.app/api-docs`

**Langkah:**
1. Share link ini ke teman: **`https://sobat-stemanika.vercel.app/api-docs`**
2. Teman bisa langsung testing API tanpa setup lokal
3. Semua endpoint sudah terdokumentasi otomatis

**Screenshot untuk Teman:**
```
Go to: https://sobat-stemanika.vercel.app/api-docs
```

---

### ✅ **Option 2: Swagger Local dengan Ngrok (Share dengan URL Public)**

Jika ingin akses Swagger lokal Anda dari public internet:

#### Step 1: Install Ngrok
```bash
# Download from: https://ngrok.com/download
# atau dengan npm:
npm install -g ngrok
```

#### Step 2: Start Backend
```bash
npm run dev
# Server running on http://localhost:3000
```

#### Step 3: Expose dengan Ngrok
```bash
ngrok http 3000
```

**Output:**
```
Forwarding                    https://XXXXX-XXX-XXX.ngrok.io -> http://localhost:3000
```

#### Step 4: Share URL
Share ke teman: **`https://XXXXX-XXX-XXX.ngrok.io/api-docs`**

---

## 🧪 Testing dengan Swagger Online

### Login Test (yang error di Postman)

1. Buka: `https://sobat-stemanika.vercel.app/api-docs`
2. Cari endpoint: **POST /api/auth/login**
3. Klik "Try it out"
4. Masukkan body:
```json
{
  "nisn": "102320960",
  "password": "123456789"
}
```
5. Klik "Execute"

**Expected Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nisn": "102320960",
      "nama": "Raka Prasetyra",
      "email": "raka@stemanika.com",
      "role": "siswa"
    }
  }
}
```

---

## 🔧 Local Testing (Jika masih error)

### Test 1: Cek Koneksi Supabase
```bash
# Jalankan di Terminal
npm run dev

# Cek output:
# ✅ Supabase connected successfully
# ✅ Redis connected successfully
```

Jika error, pastikan .env sudah benar:
```env
SUPABASE_URL=https://twsdksnrxqcklfnatoqc.supabase.co
SUPABASE_ANON_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Test 2: Direct Test Login
```bash
# Terminal PowerShell
$body = @{
    nisn = "102320960"
    password = "123456789"
} | ConvertTo-Json

$response = Invoke-WebRequest `
  -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Jika berhasil, akan keluar token JWT**

### Test 3: Swagger Local Test
```bash
# Buka di browser
http://localhost:3000/api-docs
```

---

## 📊 Troubleshooting

### ❌ Error: "TypeError: fetch failed"

**Penyebab:** SUPABASE_URL atau ANON_KEY salah

**Solusi:**
```bash
# 1. Cek .env
cat .env

# 2. Pastikan tidak ada baris kosong aneh
# Harus seperti ini:
SUPABASE_URL=https://twsdksnrxqcklfnatoqc.supabase.co
SUPABASE_ANON_PUBLIC_KEY=eyJhbGc...

# 3. Restart server
npm run dev
```

### ❌ Error: "CORS error" atau "Cannot POST /api/auth/login"

**Penyebab:** CORS belum di-update atau port salah

**Solusi:**
```bash
# 1. Pastikan sudah pull latest changes
git pull origin master

# 2. Restart server
npm run dev

# 3. Cek CORS headers
# Di Swagger: Network tab → Headers → Access-Control-Allow-Origin
```

### ❌ Swagger tidak muncul di Vercel

**Penyebab:** Build gagal atau swagger.js tidak ter-include

**Solusi:**
```bash
# 1. Push ke GitHub
git add .
git commit -m "fix: Update CORS and Swagger configuration"
git push origin master

# 2. Vercel auto-deploy (tunggu 2-3 menit)

# 3. Check di: https://sobat-stemanika.vercel.app/api-docs
```

---

## 🎯 Hasil Testing di Swagger

Setelah semua perbaikan, Anda bisa:

| Endpoint | Status | Akses |
|----------|--------|-------|
| GET /api-docs | ✅ ONLINE | Public |
| POST /api/auth/login | ✅ WORKING | Public |
| POST /api/auth/register | ✅ WORKING | Public |
| GET /api/auth/me | ✅ WORKING | Auth Required |
| GET /api/kandidat | ✅ WORKING | Public |
| POST /api/vote | ✅ WORKING | Auth Required |
| GET /api/vote/results | ✅ WORKING | Public |

---

## 📞 Share ke Teman

**Email Template:**
```
Halo!

Sudah setup API voting system STEMANIKA!

Coba API di sini: https://sobat-stemanika.vercel.app/api-docs

Bisa langsung test tanpa setup apa-apa, semua endpoint sudah dokumentasi.

Testing credentials:
NISN: 102320960
Password: 123456789

Thanks,
Raka
```

---

## ✅ Checklist Final

- [x] CORS dikonfigurasi untuk multiple origins
- [x] Swagger online accessible di Vercel
- [x] Swagger local working di localhost:3000
- [x] .env fixed (SUPABASE_URL tidak duplikat)
- [x] Login endpoint tested dan working
- [x] Error handling untuk fetch failed
- [x] Documentation ready untuk share

**Semua siap! 🚀**
