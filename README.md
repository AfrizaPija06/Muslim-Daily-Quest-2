
# Muslim Daily Quest (Gamified Ibadah Tracker)

Aplikasi web Single Page Application (SPA) dengan gaya **Mobile RPG** (terinspirasi dari *Solo Leveling* / *Mobile Legends*) untuk memantau ibadah harian (Sholat & Tilawah) dalam kelompok mentoring.

Aplikasi ini menggunakan arsitektur **Serverless**:
- **Frontend**: React + Vite (Dideploy ke Cloudflare Pages).
- **Backend**: Google Firebase (Firestore & Authentication).

---

## 🚀 Panduan Deployment (Cara Online)

### 1. Setup Firebase
Kita menggunakan Firebase sebagai pengganti Supabase.

1. Buka [console.firebase.google.com](https://console.firebase.google.com) dan buat Project baru.
2. Masuk ke menu **Authentication**:
   - Klik "Get Started".
   - Aktifkan **Email/Password**.
3. Masuk ke menu **Firestore Database**:
   - Klik "Create Database".
   - Pilih Lokasi (rekomendasi: `asia-southeast2` atau default `nam5`).
   - Pilih mode **Start in test mode**.
   - Pergi ke tab **Rules**, ganti dengan rules berikut untuk keamanan:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId} {
           allow read: if request.auth != null;
           allow write: if request.auth != null && request.auth.uid == userId;
         }
         match /trackers/{userId} {
           allow read: if request.auth != null;
           allow write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
4. Pergi ke **Project Settings (ikon gear) > General**:
   - Scroll ke bawah, klik icon `</>` (Web).
   - Register app (beri nama bebas).
   - Salin konfigurasi `firebaseConfig`.

### 2. Deploy ke Cloudflare Pages
Domain aplikasi Anda tetap menggunakan Cloudflare Pages (`*.pages.dev`).

1. Push kode terbaru ke **GitHub**.
2. Buka dashboard **Cloudflare Pages**.
3. Pilih Project Anda -> **Settings** -> **Environment Variables**.
4. Masukkan variabel berikut (Ambil nilainya dari Config Firebase langkah 1):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ADMIN_USERNAME` (Isi: mentor_admin)
   - `VITE_ADMIN_PASSWORD` (Isi: istiqamah2026)
5. Redeploy (Retry Deployment).

---

## 🛠 Cara Menjalankan di Laptop (Development)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Buat file `.env` dan isi dengan kredensial Firebase Anda.

3. Jalankan server lokal:
   ```bash
   npm run dev
   ```

## 🎮 Akun Admin Default

Karena database baru masih kosong, Anda perlu mendaftar ulang akun admin melalui halaman Register aplikasi.

1. Buka Aplikasi (Localhost atau Link Cloudflare).
2. Klik **Register**.
3. Gunakan data berikut (Wajib sama dengan Environment Variables):
   - **Username**: `mentor_admin`
   - **Password**: `istiqamah2026`
   - **Nama**: Bebas (Misal: Kak Mentor)
4. Sistem akan mendeteksi ini sebagai admin dan membuka fitur dashboard.
