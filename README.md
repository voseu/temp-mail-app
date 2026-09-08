# Temp Mail App - Disposable Email Service

> **Layanan email sekali pakai instan** berbasis Next.js dan Cloudflare Workers.  
> Solusi cepat untuk menerima OTP, verifikasi akun, atau bypass paywall tanpa memaparkan email utama Anda.

## Arsitektur

Aplikasi ini menggunakan struktur **Monorepo** yang membagi *frontend* dan *email router*:

```
temp-mail-app/
├── app/                    # Next.js 16 App Router (Frontend + SSR)
│   ├── components/         # Komponen React (EmailInput, InboxList, dll)
│   ├── lib/                # Konfigurasi Supabase & Email Utilities
│   ├── partner/            # Halaman login admin (Clerk)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Halaman utama (Inbox)
├── worker/                 # Cloudflare Worker (Email Catcher)
│   ├── src/index.ts        # Script pemrosesan email & insert ke Supabase
│   └── wrangler.jsonc      # Konfigurasi worker
├── next.config.ts          # Next.js config
├── open-next.config.ts     # OpenNext config (untuk Cloudflare Pages)
├── wrangler.jsonc          # Konfigurasi Cloudflare Pages
└── package.json
```

### Alur Data

```text
[Email dikirim ke *@domainkamu.com]
        │
        ▼
[Cloudflare Email Routing]
        │
        ▼
[worker/src/index.ts]        ← Cloudflare Worker: membedah email & kategorisasi otomatis
        │                       (postal-mime → extract body, subject, headers, dll)
        ▼
[Supabase (tabel incoming_emails)]   ← INSERT via REST API
        │
        ▼
[Next.js Frontend]           ← Menangkap data secara Real-Time via Supabase (postgres_changes)
        │
        ▼
[User melihat email masuk seketika]
```

---

## Persyaratan Sistem

| Tool | Versi Minimum | Perintah Cek |
|------|--------------|---------------|
| Node.js | ≥ 22.x | `node --version` |
| npm | ≥ 10.x | `npm --version` |
| Wrangler | ≥ 4.x | `npx wrangler --version` |
| Git | Any | `git --version` |

### Akun Layanan yang Dibutuhkan

1. **Supabase** — Sebagai Database PostgreSQL & Realtime Engine.
2. **Cloudflare** — Untuk DNS, Email Routing, Workers, dan Pages.
3. **Clerk** — Untuk Autentikasi Admin (opsional, jika fitur admin digunakan).
4. **Domain Aktif** — Domain milikmu yang sudah terhubung dengan Cloudflare.

---

## Setup Supabase (Database)

### 1. Eksekusi Skema SQL

Jalankan perintah SQL berikut di **Supabase SQL Editor**:

```sql
CREATE TABLE incoming_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT DEFAULT '',
  text_content TEXT,
  html_content TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  cc TEXT,
  reply_to TEXT,
  message_id TEXT,
  raw_headers TEXT,
  attachments_meta JSONB,
  category TEXT DEFAULT 'other'
);

CREATE INDEX idx_incoming_emails_recipient ON incoming_emails (recipient);
CREATE INDEX idx_incoming_emails_received_at ON incoming_emails (received_at);

-- Tabel opsional untuk riwayat pembuatan email admin
CREATE TABLE admin_generated_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  generated_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Aktifkan Realtime

1. Masuk ke **Supabase Dashboard → Database → Replication**.
2. Aktifkan *Realtime* untuk tabel `incoming_emails`.
3. Pastikan event `INSERT` dalam keadaan tercentang.

### 3. Konfigurasi RLS (Row Level Security)

```sql
ALTER TABLE incoming_emails ENABLE ROW LEVEL SECURITY;

-- Publik bisa membaca email
CREATE POLICY "Public read" ON incoming_emails FOR SELECT USING (true);

-- Hanya Worker (Service Role) yang bisa memasukkan data
CREATE POLICY "Service insert" ON incoming_emails FOR INSERT WITH CHECK (true);

-- Publik bisa menghapus email mereka sendiri
CREATE POLICY "Public delete" ON incoming_emails FOR DELETE USING (true);
```

---

## Setup Cloudflare Email Routing

1. Buka **Cloudflare Dashboard → Email → Email Routing**.
2. Aktifkan Email Routing untuk domainmu.
3. Masuk ke menu **Routing Rules**, dan buat **Catch-all rule**:
   - Action: **Send to a Worker**
   - Worker: Pilih nama worker milikmu (contoh: `temp-mail-catcher`).

Pastikan Record DNS bawaan Cloudflare (MX & TXT) untuk email sudah terbentuk dengan status hijau (*verified*).

---

## Instalasi & Panduan Development

### 1. Clone Repository

```bash
git clone https://github.com/voseu/temp-mail-app.git
cd temp-mail-app
```

### 2. Konfigurasi Environment Variables

#### Frontend Web (Next.js)

Salin `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi `.env.local` dengan kredensialmu:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

#### Email Catcher (Worker)

Masuk ke folder worker dan set rahasia via CLI (Jangan pernah menulis *Service Key* di file kode):

```bash
cd worker
npx wrangler secret put SUPABASE_SERVICE_KEY
# Masukkan service_role key dari Supabase (Dashboard → Settings → API)
```

Edit file `worker/wrangler.jsonc` dan sesuaikan nilai `SUPABASE_URL` milikmu.

### 3. Install Dependencies

```bash
# Install package root (Next.js Frontend)
npm install

# Install package Worker
cd worker
npm install
cd ..
```

### 4. Mulai Development Server

Jalankan perintah ini untuk mencoba *frontend* secara lokal:
```bash
npm run dev
# Aplikasi akan berjalan di http://localhost:3000
```

---

## Panduan Deployment (Cloudflare Pages)

Ini adalah metode *deploy* yang sangat disarankan karena Next.js di-render via Edge Network Cloudflare.

1. Deploy Worker (Penangkap Email):
   ```bash
   cd worker
   npx wrangler deploy
   cd ..
   ```

2. Deploy Frontend Web (via OpenNext):
   ```bash
   npm run deploy
   ```

---

## Fitur Utama

### Fitur Publik (Tanpa Login)
- Membuat alamat kustom `[namamu]@domainkamu.com`.
- *Inbox Real-time* (Email muncul seketika saat dikirim).
- Kategorisasi cerdas otomatis (OTP, Newsletter, Spam, dll).
- Ekstraksi kode OTP agar mudah disalin.
- Membaca isi pesan Text & HTML secara aman.
- Salin (*Copy*) alamat email ke *clipboard* dengan sekali klik.

### Fitur Admin (via Clerk Auth)
- *Generate* email *disposable* terkoneksi identitas rahasia.
- Pencatatan riwayat email buatan admin secara lokal & database.
- Ekspor seluruh riwayat alamat *disposable* ke file CSV.
- Proteksi penghapusan otomatis untuk email VIP admin.

---

## Penyelesaian Masalah (Troubleshooting)

**1. Email tidak kunjung muncul di Inbox?**
- Periksa status Cloudflare Email Routing: pastikan Catch-All Rule mengarah ke Worker yang benar.
- Periksa *log* Worker di Cloudflare: `cd worker && npx wrangler tail`.
- Pastikan Service Key `SUPABASE_SERVICE_KEY` tidak kedaluwarsa atau salah isi.

**2. Tampilan masuk, tapi data lama/stuck (Realtime gagal)?**
- Pastikan kamu sudah menghidupkan *Replication / Realtime* pada tabel `incoming_emails` di pengaturan database Supabase.
- Pastikan URL dan Anon Key Supabase di `.env.local` benar.

---

## Lisensi

**MIT License** — Silakan gunakan, ubah, dan distribusikan repositori ini secara bebas.
