import type { EmailCategory } from "./supabase";

const DOMAIN = "whise.fun";

/**
 * Generate alamat email random yang unik.
 * Format: whise[timestamp_base36][random_5char]@whise.fun
 */
export function generateRandomEmail(): string {
  const timeStamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `whise${timeStamp}${randomStr}@${DOMAIN}`;
}

/**
 * Sanitize string agar hanya mengandung karakter valid untuk email prefix.
 * Hanya huruf kecil, angka, titik, underscore, dan dash.
 */
function sanitizePrefix(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

/**
 * Generate random suffix untuk memastikan keunikan email.
 * Menggabungkan timestamp base36 + random 4 karakter.
 * Contoh output: "mq4k7x2b"
 */
function randomSuffix(): string {
  const ts = Date.now().toString(36);      // ~8 chars, unik per milidetik
  const rand = Math.random().toString(36).substring(2, 6); // 4 chars random
  return ts + rand;
}

/**
 * Generate email berdasarkan identitas Clerk user.
 *
 * Logika:
 * - Case A (username): 5 huruf pertama + random suffix → @whise.fun
 *   Contoh: username "whisemart" → "whisemq4k7x2b@whise.fun"
 *
 * - Case B (email): 5 huruf pertama prefix email + random suffix → @whise.fun
 *   Contoh: email "azzilmi089@gmail.com" → "azzilqr9f3k1w@whise.fun"
 *
 * - Fallback: random email @whise.fun
 */
export function generateIdentityEmail(identity: {
  username: string | null;
  primaryEmail: string | null;
}): string {
  // Case A: user punya username Clerk
  if (identity.username) {
    const sanitized = sanitizePrefix(identity.username);
    if (sanitized.length === 0) {
      return generateRandomEmail();
    }
    const prefix = sanitized.slice(0, 5);
    return `${prefix}${randomSuffix()}@${DOMAIN}`;
  }

  // Case B: user punya primary email
  if (identity.primaryEmail) {
    const atIndex = identity.primaryEmail.indexOf("@");
    if (atIndex > 0) {
      const emailPrefix = identity.primaryEmail.slice(0, atIndex);
      const sanitized = sanitizePrefix(emailPrefix);
      if (sanitized.length === 0) {
        return generateRandomEmail();
      }
      const prefix = sanitized.slice(0, 5);
      return `${prefix}${randomSuffix()}@${DOMAIN}`;
    }
  }

  // Fallback: random
  return generateRandomEmail();
}

/**
 * Validasi username untuk email kustom.
 * Rules: min 3 char, hanya a-z, 0-9, titik, underscore, dash.
 * Returns error message atau null jika valid.
 */
export function validateCustomEmail(username: string): string | null {
  if (username.length === 0) return null; // empty = belum diisi, bukan error
  if (username.length < 3) return "Minimal 3 karakter";
  if (username.length > 30) return "Maksimal 30 karakter";
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return "Hanya huruf kecil, angka, titik, underscore, dan dash";
  }
  if (username.startsWith(".") || username.endsWith(".")) {
    return "Tidak boleh diawali/diakhiri dengan titik";
  }
  return null;
}

/**
 * Buat full email address dari username.
 */
export function buildEmailAddress(username: string): string {
  return `${username}@${DOMAIN}`;
}

/**
 * Ekstrak kode OTP dari teks email.
 * Mencari pola angka 4-8 digit yang berdiri sendiri.
 */
export function extractOTPCode(text: string): string | null {
  // Cari pola angka 4-8 digit yang berdiri sendiri (bounded by non-digit)
  const match = text.match(/(?<!\d)\d{4,8}(?!\d)/);
  return match ? match[0] : null;
}

/**
 * Format timestamp ke relative time ("2 menit lalu", "baru saja", dll).
 */
export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 30) return "Baru saja";
  if (diffSec < 60) return `${diffSec} detik lalu`;
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Kategorisasi email berdasarkan subject, sender, dan konten.
 * Logika heuristik — bukan ML. Cukup akurat untuk use case temp mail.
 */
export function categorizeEmail(
  subject: string,
  sender: string,
  textContent: string | null
): EmailCategory {
  const subj = (subject || "").toLowerCase();
  const from = (sender || "").toLowerCase();
  const body = (textContent || "").toLowerCase();

  // OTP: kata kunci verifikasi + ada kode angka
  const otpKeywords = [
    "verification", "verifikasi", "verify", "otp", "kode",
    "code", "confirm", "konfirmasi", "one-time", "login code",
    "security code", "auth", "2fa", "two-factor", "pin"
  ];
  const hasOtpKeyword = otpKeywords.some(
    (k) => subj.includes(k) || body.includes(k)
  );
  const hasCode = /(?<!\d)\d{4,8}(?!\d)/.test(body);
  if (hasOtpKeyword && hasCode) return "otp";
  if (hasOtpKeyword) return "otp";

  // Newsletter: unsubscribe link atau kata kunci
  const newsletterKeywords = [
    "newsletter", "unsubscribe", "berhenti berlangganan",
    "email preferences", "manage subscription", "weekly digest",
    "monthly update", "bulletin"
  ];
  if (newsletterKeywords.some((k) => subj.includes(k) || body.includes(k))) {
    return "newsletter";
  }

  // Spam: indikator spam klasik
  const spamKeywords = [
    "congratulations", "you won", "winner", "lottery", "prize",
    "free money", "click here now", "act now", "limited time",
    "viagra", "casino", "bitcoin profit", "earn money fast",
    "nigerian prince", "wire transfer"
  ];
  if (spamKeywords.some((k) => subj.includes(k) || body.includes(k))) {
    return "spam";
  }

  // Notification: alert, notifikasi, update
  const notifKeywords = [
    "notification", "notifikasi", "alert", "peringatan",
    "password reset", "reset password", "welcome", "selamat datang",
    "account", "akun", "sign in", "masuk", "activity", "aktivitas"
  ];
  if (notifKeywords.some((k) => subj.includes(k) || body.includes(k))) {
    return "notification";
  }

  return "other";
}

/**
 * Label tampilan untuk setiap kategori email.
 */
export function getCategoryLabel(category: EmailCategory | null): string {
  switch (category) {
    case "otp": return "OTP";
    case "newsletter": return "Newsletter";
    case "spam": return "Spam";
    case "notification": return "Notifikasi";
    default: return "Lainnya";
  }
}

/**
 * Tailwind classes untuk badge setiap kategori email.
 */
export function getCategoryClass(category: EmailCategory | null): string {
  switch (category) {
    case "otp": return "text-pink-400 bg-pink-400/10 border-pink-400/25";
    case "newsletter": return "text-blue-400 bg-blue-400/10 border-blue-400/25";
    case "spam": return "text-red-400 bg-red-400/10 border-red-400/25";
    case "notification": return "text-amber-400 bg-amber-400/10 border-amber-400/25";
    default: return "text-zinc-500 bg-zinc-800 border-white/10";
  }
}

/**
 * Format ukuran file ke human-readable.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export const EMAIL_DOMAIN = DOMAIN;
