# Temp Mail App — Disposable Email Service

> **Email sekali pakai instan** menggunakan domain `@whise.fun`.  
> Terima OTP, verifikasi akun, atau bypass paywall — tanpa mengotori inbox pribadimu.

## Arsitektur

```
temp-mail-app/
├── app/                    # Next.js 16 App Router (Frontend + SSR)
│   ├── components/         # React components (EmailInput, InboxList, EmailViewer, dll)
│   ├── lib/                # Supabase client, email utilities, hooks
│   ├── partner/            # Halaman login admin (Clerk)
│   ├── layout.tsx          # Root layout + security headers
│   └── page.tsx            # Halaman utama — inbox temp mail
├── worker/                 # Cloudflare Worker (Email Catcher)
│   ├── src/index.ts        # Email handler — parse & insert ke Supabase
│   ├── test/               # Vitest tests
│   ├── wrangler.jsonc      # Konfigurasi Cloudflare Worker
│   └── package.json
├── build-cpanel.js         # Script build untuk deploy ke cPanel
├── upload-cpanel/          # Output build cPanel (gitignored)
├── next.config.ts          # Next.js config + CSP + standalone output
├── open-next.config.ts     # OpenNext config untuk deploy ke Cloudflare Pages
├── wrangler.jsonc           # Konfigurasi deploy Next.js ke Cloudflare Pages
└── package.json
```

### Alur Data

```
[Email masuk ke @whise.fun]
        │
        ▼
[Cloudflare Email Routing]
        │
        ▼
[worker/src/index.ts]        ← Cloudflare Worker: parse email + kategorisasi
        │                       (postal-mime → extract body, cc, headers, attachments)
        ▼
[Supabase — tabel incoming_emails]   ← INSERT via REST API
        │
        ▼
[Next.js Frontend]           ← Real-time listener via Supabase Realtime (postgres_changes)
        │
        ▼
[User melihat email di browser]
```

---

## Prerequisites

| Tool | Versi Minimum | Cek Instalasi |
|------|--------------|---------------|
| Node.js | ≥ 22.x | `node --version` |
| npm | ≥ 10.x | `npm --version` |
| Wrangler CLI | ≥ 4.x | `npx wrangler --version` |
| Git | Any | `git --version` |

### Akun yang Dibutuhkan

1. **Supabase** — Database & Realtime
2. **Cloudflare** — Email Routing + Workers + Pages (opsional)
3. **Clerk** — Autentikasi admin (opsional, hanya untuk fitur admin)
4. **Domain** — Domain yang sudah dikonfigurasi di Cloudflare (untuk Email Routing)

---

## Setup Database (Supabase)

### 1. Buat Tabel `incoming_emails`

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

-- Index untuk query per-recipient
CREATE INDEX idx_incoming_emails_recipient ON incoming_emails (recipient);

-- Index untuk cleanup berdasarkan waktu
CREATE INDEX idx_incoming_emails_received_at ON incoming_emails (received_at);
```

### 2. (Opsional) Tabel `admin_generated_emails`

```sql
CREATE TABLE admin_generated_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  generated_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Enable Realtime

Di Supabase Dashboard:
1. Buka **Database → Replication**
2. Aktifkan Realtime untuk tabel `incoming_emails`
3. Pastikan event `INSERT` dicentang

### 4. Row Level Security (RLS)

```sql
-- Aktifkan RLS
ALTER TABLE incoming_emails ENABLE ROW LEVEL SECURITY;

-- Policy: siapapun bisa SELECT (email temp bersifat publik)
CREATE POLICY "Public read" ON incoming_emails
  FOR SELECT USING (true);

-- Policy: hanya service_role yang bisa INSERT (dari Worker)
CREATE POLICY "Service insert" ON incoming_emails
  FOR INSERT WITH CHECK (true);

-- Policy: siapapun bisa DELETE email mereka
CREATE POLICY "Public delete" ON incoming_emails
  FOR DELETE USING (true);
```

---

## Setup Cloudflare Email Routing

### 1. Tambahkan Domain ke Cloudflare

Pastikan domain (contoh: `whise.fun`) sudah aktif di Cloudflare Dashboard.

### 2. Aktifkan Email Routing

1. Buka **Cloudflare Dashboard → Email → Email Routing**
2. Aktifkan Email Routing untuk domain
3. Buat **Catch-all rule**:
   - Action: **Send to a Worker**
   - Worker: `temp-mail-catcher` (nama worker di `worker/wrangler.jsonc`)

### 3. Konfigurasi DNS

Cloudflare akan otomatis menambahkan MX records yang diperlukan.  
Pastikan records berikut ada:

```
MX    @    route1.mx.cloudflare.net    Priority: 69
MX    @    route2.mx.cloudflare.net    Priority: 12
MX    @    route3.mx.cloudflare.net    Priority: 34
TXT   @    v=spf1 include:_spf.mx.cloudflare.net ~all
```

---

## Instalasi & Development

### 1. Clone Repository

```bash
git clone https://github.com/voseu/temp-mail-app.git
cd temp-mail-app
```

### 2. Setup Environment Variables

#### Web (Next.js)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
```

> **Catatan:** Supabase Anon Key aman diekspos ke client — ia dibatasi oleh RLS policies.

#### Worker (Email Catcher)

```bash
# Set secret via Wrangler (TIDAK disimpan di file)
cd worker
npx wrangler secret put SUPABASE_SERVICE_KEY
# Paste service_role key dari Supabase Dashboard → Settings → API
```

`SUPABASE_URL` sudah didefinisikan di `worker/wrangler.jsonc` → `vars`.

### 3. Install Dependencies

```bash
# Root (Next.js)
npm install

# Worker
cd worker
npm install
cd ..
```

### 4. Jalankan Development Server

```bash
# Terminal 1: Next.js dev server
npm run dev
# Buka http://localhost:3000

# Terminal 2: Worker dev (opsional, untuk test email handler)
cd worker
npm run dev
```

---

## Deploy

### Opsi A: Deploy ke Cloudflare (Recommended)

#### Deploy Worker (Email Catcher)

```bash
cd worker
npx wrangler deploy
```

#### Deploy Web (Next.js → Cloudflare Pages via OpenNext)

```bash
# Build & deploy
npm run deploy
```

### Opsi B: Deploy ke cPanel (Shared Hosting)

#### 1. Build untuk cPanel

```bash
npm run build:cpanel
```

Ini akan:
- Menjalankan `next build` (output: standalone)
- Menyalin `.next/standalone`, `public`, `.next/static` ke folder `upload-cpanel/`
- Menyalin `.env.local` → `upload-cpanel/.env`

#### 2. Upload ke cPanel

1. Buka cPanel → **Setup Node.js App**
2. Buat aplikasi baru:
   - **Node.js version**: 22.x
   - **Application mode**: Production
   - **Application root**: `whimail` (atau nama folder lain)
   - **Application startup file**: `server.js`
3. Upload **seluruh isi** folder `upload-cpanel/` ke root aplikasi via File Manager
4. Set environment variables di cPanel (atau via `.htaccess`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   ```
5. Restart aplikasi: `touch tmp/restart.txt`

#### 3. Konfigurasi Passenger (`.htaccess`)

File `.htaccess` di `public_html` subdomain harus berisi:

```apache
PassengerAppRoot "/home/username/whimail"
PassengerBaseURI "/"
PassengerNodejs "/home/username/nodevenv/whimail/22/bin/node"
PassengerAppType node
PassengerStartupFile omkegas/server.js
```

> **Catatan**: Path `nodevenv` dan `omkegas` disesuaikan dengan konfigurasi cPanel kamu.  
> `omkegas/` adalah folder tempat file standalone Next.js disimpan di dalam app root.

---

## Fitur

### Untuk Semua User (Tanpa Login)
- ✅ Input email custom `username@whise.fun`
- ✅ Terima email real-time via Supabase Realtime
- ✅ Baca email (text + HTML rendered dengan aman)
- ✅ Filter berdasarkan kategori (OTP, Newsletter, Notification, Spam, Lainnya)
- ✅ Hapus email individual
- ✅ Copy alamat email ke clipboard
- ✅ Auto-extract kode OTP dari body email

### Untuk Admin (Login via Clerk)
- 🔐 Generate email berdasarkan identitas Clerk
- 🔐 Riwayat email yang di-generate (tersimpan di localStorage + database)
- 🔐 Ekspor riwayat ke CSV
- 🔐 Email admin di-track agar tidak di-auto-cleanup

### Email Catcher (Worker)
- 📧 Parse email lengkap: subject, body (text + HTML), CC, Reply-To, Message-ID
- 📧 Ekstrak metadata attachment (filename, MIME type, size)
- 📧 Raw headers preservation
- 📧 Kategorisasi otomatis: OTP, Notification, Newsletter, Spam, Other
- 📧 Trusted domain whitelist (mencegah false-positive spam)

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Supabase (PostgreSQL + Realtime) |
| Email Parsing | Cloudflare Worker + `postal-mime` |
| Email Routing | Cloudflare Email Routing (catch-all → Worker) |
| Hosting (Primary) | Cloudflare Pages via `@opennextjs/cloudflare` |
| Hosting (Fallback) | cPanel + Phusion Passenger (Node.js standalone) |

---

## Struktur Domain

| Subdomain | Fungsi |
|-----------|--------|
| `whisemail.whise.fun` | Frontend temp mail (Next.js) |
| `*@whise.fun` | Catch-all email → Cloudflare Worker |
| `clerk.whisemail.whise.fun` | Clerk auth proxy |

---

## Troubleshooting

### Email tidak masuk ke inbox

1. Pastikan Cloudflare Email Routing aktif dan catch-all rule mengarah ke worker `temp-mail-catcher`
2. Cek worker logs: `cd worker && npx wrangler tail`
3. Pastikan `SUPABASE_SERVICE_KEY` sudah diset: `cd worker && npx wrangler secret list`
4. Pastikan tabel `incoming_emails` ada dan RLS policies benar

### Realtime tidak update

1. Pastikan Realtime diaktifkan di Supabase Dashboard untuk tabel `incoming_emails`
2. Cek browser console untuk error koneksi WebSocket
3. Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar

### Build cPanel gagal

1. Pastikan `output: "standalone"` ada di `next.config.ts`
2. Pastikan Node.js ≥ 22 di server cPanel
3. Cek `stderr.log` di root aplikasi cPanel

### Error "Server is not running" di cPanel

1. SSH ke server: `ssh -i ~/.ssh/cpanel_key user@host`
2. Restart aplikasi: `touch /home/username/whimail/tmp/restart.txt`
3. Cek log: `tail -f /home/username/whimail/stderr.log`

---

## License

MIT
