import type { NextConfig } from "next";

// ============================================
// Content-Security-Policy (CSP)
// Strict tetapi kompatibel dengan Clerk, Supabase, dan Google Fonts.
//
// Catatan: Clerk membutuhkan 'unsafe-inline' di script-src & style-src
// karena inject script/style secara dinamis dari SDK-nya.
// Ini trade-off yang tidak bisa dihindari tanpa mengganti auth provider.
// ============================================
const cspDirectives = [
  // Default: blokir semua kecuali yang di-whitelist
  "default-src 'self'",

  // Scripts: self + Clerk JS SDK + Cloudflare Turnstile (CAPTCHA)
  "script-src 'self' 'unsafe-inline' https://clerk.whisemail.whise.fun https://*.clerk.accounts.dev https://challenges.cloudflare.com",

  // Styles: self + inline (Clerk inject inline styles) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Images: self + data URI (Clerk avatars, inline SVG) + Clerk CDN
  "img-src 'self' data: blob: https://img.clerk.com https://img.clerkstage.dev https://*.clerk.accounts.dev",

  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com data:",

  // API/WebSocket connections: self + Supabase (REST + Realtime WS) + Clerk + Turnstile
  "connect-src 'self' https://vnbntllrjiebdbrzhiqj.supabase.co wss://vnbntllrjiebdbrzhiqj.supabase.co https://clerk.whisemail.whise.fun https://*.clerk.accounts.dev https://api.clerk.com https://challenges.cloudflare.com",

  // Frames: hanya Clerk (untuk OAuth popup) + Cloudflare challenges
  "frame-src https://clerk.whisemail.whise.fun https://*.clerk.accounts.dev https://accounts.dev https://challenges.cloudflare.com",

  // Workers: self (untuk Next.js service worker jika ada)
  "worker-src 'self' blob:",

  // Object/media: blokir total
  "object-src 'none'",
  "media-src 'none'",

  // Base URI: hanya self (mencegah base tag injection)
  "base-uri 'self'",

  // Form action: hanya self (mencegah form redirect ke domain lain)
  "form-action 'self' https://clerk.whisemail.whise.fun https://*.clerk.accounts.dev",

  // Frame ancestors: none (setara X-Frame-Options: DENY)
  "frame-ancestors 'none'",

  // Upgrade insecure requests
  "upgrade-insecure-requests",
];

const ContentSecurityPolicy = cspDirectives.join("; ");

// ============================================
// Security Headers
// ============================================
const securityHeaders = [
  // 1. CSP — proteksi utama terhadap XSS dan injection
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },

  // 2. HSTS — paksa HTTPS, 2 tahun, termasuk subdomain, preload-ready
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // 3. X-Frame-Options — blokir embedding (backup untuk CSP frame-ancestors)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // 4. X-Content-Type-Options — cegah MIME sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // 5. Referrer-Policy — kirim origin saja saat cross-origin
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // 6. Permissions-Policy — disable semua browser API yang tidak dipakai
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // 7. X-XSS-Protection — set 0 (modern best practice: rely on CSP)
  // Browser baru sudah deprecated fitur ini, tapi header ini menghindari
  // false positive dari XSS auditor lama.
  {
    key: "X-XSS-Protection",
    value: "0",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Hapus header x-powered-by: Next.js (info disclosure)
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Terapkan ke semua route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
