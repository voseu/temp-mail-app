"use client";

import { useState } from "react";
import type { Email } from "../lib/supabase";
import {
  formatTimeAgo,
  extractOTPCode,
  getCategoryLabel,
  getCategoryClass,
  formatFileSize,
  categorizeEmail,
} from "../lib/email-utils";

interface EmailViewerProps {
  email: Email;
  onBack: () => void;
  onDelete: (emailId: string) => void;
}

export default function EmailViewer({ email, onBack, onDelete }: EmailViewerProps) {
  const [viewMode, setViewMode] = useState<"html" | "text" | "source">(
    email.html_content ? "html" : "text"
  );
  const [otpCopied, setOtpCopied] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const otpCode = email.text_content ? extractOTPCode(email.text_content) : null;
  const category = email.category || categorizeEmail(email.subject, email.sender, email.text_content);

  const handleCopyOTP = () => {
    if (!otpCode) return;
    navigator.clipboard.writeText(otpCode);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    onDelete(email.id);
  };

  const renderHTMLContent = () => {
    if (!email.html_content) return null;
    const wrappedHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:16px;font-size:14px;line-height:1.6;color:#e2e8f0;background:transparent;word-wrap:break-word;overflow-wrap:break-word}img{max-width:100%;height:auto}a{color:#818cf8}table{max-width:100%}</style></head><body>${email.html_content}</body></html>`;

    return (
      <iframe
        srcDoc={wrappedHTML}
        sandbox=""
        className="w-full min-h-[400px] border-none rounded-lg bg-black"
        title="Email content"
      />
    );
  };

  const renderSourceView = () => {
    const parts: string[] = [];
    if (email.raw_headers) parts.push("=== RAW HEADERS ===\n" + email.raw_headers);
    parts.push("=== PARSED METADATA ===");
    parts.push(`Message-ID: ${email.message_id || "(tidak tersedia)"}`);
    parts.push(`From: ${email.sender}`);
    parts.push(`To: ${email.recipient}`);
    if (email.cc) parts.push(`CC: ${email.cc}`);
    if (email.reply_to) parts.push(`Reply-To: ${email.reply_to}`);
    parts.push(`Subject: ${email.subject || "(Tanpa subjek)"}`);
    parts.push(`Date: ${new Date(email.received_at).toISOString()}`);
    parts.push(`Category: ${getCategoryLabel(category)}`);
    if (email.attachments_meta && email.attachments_meta.length > 0) {
      parts.push("\n=== ATTACHMENTS ===");
      email.attachments_meta.forEach((att, i) => {
        parts.push(`[${i + 1}] ${att.filename} (${att.mimeType}, ${formatFileSize(att.size)})`);
      });
    }
    if (email.text_content) parts.push("\n=== TEXT CONTENT ===\n" + email.text_content);
    if (email.html_content) parts.push("\n=== HTML CONTENT ===\n" + email.html_content);

    return (
      <pre className="font-mono text-xs leading-relaxed text-zinc-500 whitespace-pre-wrap wrap-break-word m-0 bg-black p-4 rounded-lg border border-white/10 max-h-[600px] overflow-y-auto">
        {parts.join("\n")}
      </pre>
    );
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
      {/* Header bar */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/10 sm:flex-row flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 border border-white/10 rounded-lg text-[13px] font-semibold bg-[#121214] text-zinc-400 cursor-pointer transition-all hover:border-white/15 hover:text-white"
            onClick={onBack}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Kembali
          </button>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide border ${getCategoryClass(category)}`}>
            {getCategoryLabel(category)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {otpCode && (
            <button
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-[13px] font-bold font-mono cursor-pointer transition-all ${
                otpCopied
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/25"
                  : "border-pink-400/25 bg-pink-400/10 text-pink-400 hover:bg-pink-400/15"
              }`}
              onClick={handleCopyOTP}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {otpCopied ? "Tersalin!" : `Salin OTP: ${otpCode}`}
            </button>
          )}

          <button
            className={`flex items-center justify-center w-9 h-9 border border-white/10 rounded-lg bg-[#121214] text-zinc-500 cursor-pointer transition-all hover:border-red-400/40 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40 disabled:cursor-not-allowed ${
              isDeleting ? "animate-pulse" : ""
            }`}
            onClick={handleDelete}
            disabled={isDeleting}
            title="Hapus email"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-start gap-3.5 p-5 border-b border-white/10 sm:flex-row flex-col">
        <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600/15 text-blue-600 font-bold text-lg">
          {email.sender?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white m-0 mb-2 leading-snug">
            {email.subject || "(Tanpa subjek)"}
          </h2>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-400">
              <strong className="text-zinc-500 font-medium">Dari:</strong> {email.sender || "Unknown"}
            </span>
            <span className="text-xs text-zinc-400">
              <strong className="text-zinc-500 font-medium">Ke:</strong> {email.recipient}
            </span>
            {email.cc && (
              <span className="text-xs text-zinc-400">
                <strong className="text-zinc-500 font-medium">CC:</strong> {email.cc}
              </span>
            )}
            {email.reply_to && (
              <span className="text-xs text-zinc-400">
                <strong className="text-zinc-500 font-medium">Reply-To:</strong> {email.reply_to}
              </span>
            )}
            <span className="text-xs text-zinc-500 mt-0.5">
              {formatTimeAgo(email.received_at)} • {new Date(email.received_at).toLocaleString("id-ID")}
            </span>
            {email.message_id && (
              <span className="text-xs text-zinc-400">
                <strong className="text-zinc-500 font-medium">ID:</strong> {email.message_id}
              </span>
            )}
          </div>

          {/* Toggle headers */}
          <button
            className="inline-flex items-center gap-1.5 mt-2 py-1 border-none bg-transparent text-xs font-medium text-blue-600 cursor-pointer transition-colors hover:text-blue-500"
            onClick={() => setShowHeaders(!showHeaders)}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showHeaders ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {showHeaders ? "Sembunyikan detail" : "Tampilkan detail header"}
          </button>

          {/* Expanded headers */}
          {showHeaders && (
            <div className="mt-3 p-3 px-4 bg-black border border-white/10 rounded-lg flex flex-col gap-1.5 animate-[slideUp_0.2s_ease-out]">
              <div className="flex gap-2 text-xs leading-relaxed">
                <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">From:</span>
                <span className="text-zinc-400 break-all">{email.sender}</span>
              </div>
              <div className="flex gap-2 text-xs leading-relaxed">
                <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">To:</span>
                <span className="text-zinc-400 break-all">{email.recipient}</span>
              </div>
              {email.cc && (
                <div className="flex gap-2 text-xs leading-relaxed">
                  <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">CC:</span>
                  <span className="text-zinc-400 break-all">{email.cc}</span>
                </div>
              )}
              {email.reply_to && (
                <div className="flex gap-2 text-xs leading-relaxed">
                  <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">Reply-To:</span>
                  <span className="text-zinc-400 break-all">{email.reply_to}</span>
                </div>
              )}
              {email.message_id && (
                <div className="flex gap-2 text-xs leading-relaxed">
                  <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">Message-ID:</span>
                  <span className="text-zinc-400 font-mono text-[11px] break-all">{email.message_id}</span>
                </div>
              )}
              <div className="flex gap-2 text-xs leading-relaxed">
                <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">Received:</span>
                <span className="text-zinc-400">
                  {new Date(email.received_at).toLocaleString("id-ID", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex gap-2 text-xs leading-relaxed items-center">
                <span className="font-semibold text-zinc-500 min-w-[80px] shrink-0">Kategori:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${getCategoryClass(category)}`}>
                  {getCategoryLabel(category)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      {email.attachments_meta && email.attachments_meta.length > 0 && (
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-400 mb-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span>{email.attachments_meta.length} Lampiran</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {email.attachments_meta.map((att, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-black border border-white/10 rounded-lg transition-colors hover:border-white/15">
                <div className="shrink-0 text-zinc-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold text-white truncate">{att.filename}</span>
                  <span className="text-[11px] text-zinc-500">{att.mimeType} • {formatFileSize(att.size)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View mode tabs */}
      <div className="flex gap-0.5 px-5 py-2 border-b border-white/10">
        {email.html_content && (
          <button
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              viewMode === "html" ? "bg-[#121214] text-white" : "text-zinc-500 hover:text-zinc-400"
            }`}
            onClick={() => setViewMode("html")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            HTML
          </button>
        )}
        <button
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
            viewMode === "text" ? "bg-[#121214] text-white" : "text-zinc-500 hover:text-zinc-400"
          }`}
          onClick={() => setViewMode("text")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
          </svg>
          Teks
        </button>
        <button
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
            viewMode === "source" ? "bg-[#121214] text-white" : "text-zinc-500 hover:text-zinc-400"
          }`}
          onClick={() => setViewMode("source")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
            <polyline points="14 2 14 8 20 8" />
            <path d="m3 15 2 2 4-4" />
          </svg>
          Source
        </button>
      </div>

      {/* Body */}
      <div className="p-5 min-h-[200px]">
        {viewMode === "html" && email.html_content ? (
          renderHTMLContent()
        ) : viewMode === "source" ? (
          renderSourceView()
        ) : (
          <pre className="font-mono text-[13px] leading-relaxed text-zinc-400 whitespace-pre-wrap wrap-break-word m-0">
            {email.text_content || "Tidak ada konten teks."}
          </pre>
        )}
      </div>
    </div>
  );
}
