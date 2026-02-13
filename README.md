
# Muslim Daily Quest (Gamified Ibadah Tracker)

Aplikasi web Single Page Application (SPA) dengan gaya **Mobile RPG** (terinspirasi dari *Solo Leveling* / *Mobile Legends*) untuk memantau ibadah harian (Sholat & Tilawah) dalam kelompok mentoring.

Aplikasi ini menggunakan arsitektur **Serverless** untuk mencegah overload server:
- **Frontend**: React + Vite (Dideploy ke Cloudflare Pages / Vercel / Netlify).
- **Backend**: Supabase (PostgreSQL).

---

## 🚀 Panduan Deployment (Cara Online)

Ikuti langkah ini untuk meng-online-kan aplikasi agar bisa diakses semua mentee.

### 1. Setup Database (Supabase)
Kita menggunakan Supabase sebagai database karena gratis, cepat, dan real-time.

1. Buka [supabase.com](https://supabase.com) dan buat Project baru.
2. Masuk ke menu **SQL Editor**.
3. Jalankan Script berikut untuk membuat tabel:

```sql
-- 1. Tabel Users
create table users (
  username text primary key,
  full_name text not null,
  password text not null,
  role text default 'mentee',
  "group" text,
  status text default 'active',
  avatar_seed text,
  character_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tabel Trackers (Save Data Game)
create table trackers (
  username text primary key references users(username) on delete cascade,
  data jsonb not null,
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Buka Akses Publik (Game Style Auth)
alter table users enable row level security;
alter table trackers enable row level security;

create policy "Public Access Users" on users for all using (true) with check (true);
create policy "Public Access Trackers" on trackers for all using (true) with check (true);
```

4. Pergi ke **Project Settings > API**.
5. Catat **Project URL** dan **anon public key**.

### 2. Deploy ke Cloudflare Pages (Rekomendasi)
Cloudflare Pages sangat cepat dan memiliki fitur SPA Fallback yang sudah kita siapkan di `vite.config.ts`.

1. Upload kode ini ke **GitHub**.
2. Buka dashboard **Cloudflare Pages**.
3. Buat Project baru -> Connect to Git -> Pilih Repo ini.
4. Setting Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
5. **Environment Variables** (Wajib Diisi di Dashboard Cloudflare):
   - `VITE_SUPABASE_URL`: (URL dari langkah 1)
   - `VITE_SUPABASE_ANON_KEY`: (Key dari langkah 1)
6. Klik **Deploy**.

---

## 🛠 Cara Menjalankan di Laptop (Development)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Buat file `.env` (copy dari `.env.example`) dan isi dengan kredensial Supabase Anda.

3. Jalankan server lokal:
   ```bash
   npm run dev
   ```

## 🎮 Akun Admin Default

Setelah deploy, sistem database kosong. Anda harus mendaftar atau membuat user manual di Database Supabase jika ingin langsung jadi admin, ATAU edit file `constants.ts` jika ingin mengubah kredensial backdoor admin.

Default Admin (Untuk Login Pertama):
- **Username**: `mentor_admin`
- **Password**: `istiqamah2026`

*Note: Pastikan username ini terdaftar di database Supabase atau gunakan fitur Register di aplikasi lalu ubah role-nya menjadi 'mentor' lewat SQL Editor Supabase.*
