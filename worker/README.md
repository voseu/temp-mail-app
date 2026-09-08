# Cloudflare Email Catcher (Worker)

Bagian dari Monorepo **Temp Mail App** oleh [voseu](https://github.com/voseu).

Ini adalah skrip **Cloudflare Worker** yang berdiri di garis depan untuk menangkap lalu lintas email masuk via fitur **Email Routing**. Skrip ini menggunakan *library* `postal-mime` untuk mengubah pesan mentah (*raw MIME*) menjadi objek JSON yang mudah dibaca, lalu melemparkannya ke **Supabase**.

## Alur Singkat

1. Email masuk ke alamat *@domainkamu.com*.
2. Cloudflare Routing mengarahkannya ke fungsi `email()` pada Worker ini.
3. Skrip membedah lampiran (attachments), *headers*, isi pesan, dan subjek.
4. Terdapat algoritma sederhana untuk mengenali email OTP, Notifikasi, atau Spam.
5. Email disimpan dengan bersih ke tabel database.

## Instalasi Dependensi

Pastikan Anda berada di direktori `worker/`, lalu jalankan:
```bash
npm install
```

## Konfigurasi Kunci Rahasia

Penyisipan ke Supabase menggunakan REST API dan membutuhkan hak istimewa *Service Role*. Kunci ini sangat rahasia, jangan menaruhnya di dalam kode. Setel menggunakan antarmuka Wrangler:

```bash
npx wrangler secret put SUPABASE_SERVICE_KEY
```
*(Tempelkan `service_role key` dari Supabase saat diminta)*

Pastikan juga variabel `SUPABASE_URL` di dalam file `wrangler.jsonc` sudah diganti dengan URL *Project* Supabase Anda yang sesungguhnya.

## Perintah Development & Deploy

Uji coba Worker:
```bash
npm run dev
```

Deploy Worker ke jaringan Cloudflare:
```bash
npx wrangler deploy
```
*(Jangan lupa kaitkan Worker yang berhasil di-deploy ke Email Routing Catch-all di Cloudflare Dashboard)*
