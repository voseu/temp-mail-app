import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AttachmentMeta = {
  filename: string;
  mimeType: string;
  size: number;
};

export type EmailCategory = "otp" | "newsletter" | "notification" | "spam" | "other";

export type Email = {
  id: string;
  recipient: string;
  sender: string;
  subject: string;
  text_content: string | null;
  html_content: string | null;
  received_at: string;
  // Kolom baru untuk enhanced viewing
  cc: string | null;
  reply_to: string | null;
  message_id: string | null;
  raw_headers: string | null;
  attachments_meta: AttachmentMeta[] | null;
  category: EmailCategory | null;
};
