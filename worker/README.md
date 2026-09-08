# Temp Mail Catcher — Cloudflare Email Worker

Cloudflare Worker yang menerima email masuk via **Email Routing**, 
mem-parse isinya menggunakan `postal-mime`, lalu menyimpannya ke **Supabase**.

## Cara Kerja

1. Cloudflare Email Routing menangkap semua email ke `*@whise.fun`
2. Email diteruskan ke worker ini via `email()` handler
3. Worker mem-parse: subject, body (text + HTML), CC, Reply-To, headers, attachments
4. Email dikategorikan otomatis (OTP, Notification, Newsletter, Spam, Other)
5. Data di-INSERT ke tabel `incoming_emails` di Supabase via REST API

## Setup

```bash
npm install
```

### Set Secret

```bash
npx wrangler secret put SUPABASE_SERVICE_KEY
# Paste service_role key dari Supabase Dashboard → Settings → API
```

`SUPABASE_URL` sudah dikonfigurasi di `wrangler.jsonc`.

## Development

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Test

```bash
npm test
```
