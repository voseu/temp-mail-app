import PostalMime from 'postal-mime';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

/**
 * Kategori email berdasarkan subject + body.
 * Heuristik sederhana — match di sisi Worker sebelum insert.
 */
function categorizeEmail(sender: string, subject: string, textContent: string): string {
  const subj = subject.toLowerCase();
  const body = textContent.toLowerCase();
  const from = sender.toLowerCase();

  // 1. Cek Trusted Domains (Whitelist dari label Spam)
  const trustedDomains = ['@canva.com', '@mail.canva.com', '@mail.account.canva.com', '@netflix.com', '@google.com', '@github.com', '@whise.fun', '@bluepoch.com','@re1999.bluepoch.com'];
  const isTrusted = trustedDomains.some(domain => from.includes(domain));

  // 2. Kategori Prioritas: OTP & Notification
  const otpKeywords = [
    'verification', 'verifikasi', 'verify', 'otp', 'kode',
    'code', 'confirm', 'konfirmasi', 'one-time', 'login code',
    'security code', 'auth', '2fa', 'two-factor', 'pin'
  ];
  if (otpKeywords.some(k => subj.includes(k) || body.includes(k))) return 'otp';

  const notifKeywords = [
    'notification', 'notifikasi', 'alert', 'peringatan',
    'password reset', 'reset password', 'welcome', 'selamat datang',
    'account', 'akun', 'sign in', 'activity'
  ];
  if (notifKeywords.some(k => subj.includes(k) || body.includes(k))) return 'notification';

  const newsletterKeywords = [
    'newsletter', 'unsubscribe', 'berhenti berlangganan',
    'email preferences', 'manage subscription', 'weekly digest'
  ];
  if (newsletterKeywords.some(k => subj.includes(k) || body.includes(k))) return 'newsletter';

  // 3. Cek Spam (HANYA jika BUKAN dari trusted domain)
  if (!isTrusted) {
    const spamKeywords = [
      'congratulations', 'you won', 'winner', 'lottery', 'prize',
      'free money', 'click here now', 'act now', 'limited time',
      'viagra', 'casino', 'bitcoin profit'
    ];
    if (spamKeywords.some(k => subj.includes(k) || body.includes(k))) return 'spam';
  }

  return 'other';
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    try {
      const parser = new PostalMime();
      const parsedEmail = await parser.parse(message.raw);

      // Ekstrak CC dari parsed headers
      const ccAddresses = (parsedEmail.cc || [])
        .map((addr: { address?: string; name?: string }) => addr.address || '')
        .filter(Boolean)
        .join(', ');

      // Ekstrak Reply-To
      const replyTo = (parsedEmail.replyTo || [])
        .map((addr: { address?: string; name?: string }) => addr.address || '')
        .filter(Boolean)
        .join(', ');

      // Ekstrak attachment metadata (tanpa content — hanya info)
      const attachmentsMeta = (parsedEmail.attachments || []).map(
        (att) => ({
          filename: att.filename || 'unnamed',
          mimeType: att.mimeType || 'application/octet-stream',
          size: att.content ? (typeof att.content === 'string' ? att.content.length : att.content.byteLength) : 0,
        })
      );

      // Bangun raw headers string dari parsed headers
      const rawHeaders = (parsedEmail.headers || [])
        .map((h: { key: string; value: string }) => `${h.key}: ${h.value}`)
        .join('\n');

      const textContent = parsedEmail.text || '';
      const subject = parsedEmail.subject || '';

      const payload = {
        recipient: message.to,
        sender: message.from,
        subject: subject,
        text_content: textContent,
        html_content: parsedEmail.html || '',
        received_at: new Date().toISOString(),
        cc: ccAddresses,
        reply_to: replyTo,
        message_id: parsedEmail.messageId || '',
        raw_headers: rawHeaders,
        attachments_meta: attachmentsMeta,
        category: categorizeEmail(message.from, subject, textContent),
      };

      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/incoming_emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        message.setReject(`Database rejection: ${await response.text()}`);
      }
    } catch (error: any) {
      message.setReject(`Worker crash: ${error.message}`);
    }
  }
};