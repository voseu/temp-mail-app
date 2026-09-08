"use client";

import type { Email, EmailCategory } from "../lib/supabase";
import {
  formatTimeAgo,
  extractOTPCode,
  getCategoryLabel,
  getCategoryClass,
  categorizeEmail,
} from "../lib/email-utils";

const FILTER_TABS: { key: EmailCategory | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "otp", label: "OTP" },
  { key: "notification", label: "Notifikasi" },
  { key: "newsletter", label: "Newsletter" },
  { key: "spam", label: "Spam" },
  { key: "other", label: "Lainnya" },
];

interface InboxListProps {
  emails: Email[];
  isChecking: boolean;
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  onRefresh: () => void;
  activeFilter: EmailCategory | "all";
  onFilterChange: (filter: EmailCategory | "all") => void;
}

export default function InboxList({
  emails,
  isChecking,
  selectedEmailId,
  onSelectEmail,
  onRefresh,
  activeFilter,
  onFilterChange,
}: InboxListProps) {
  const filteredEmails = emails.filter((email) => {
    if (activeFilter === "all") return true;
    const cat = email.category || categorizeEmail(email.subject, email.sender, email.text_content);
    return cat === activeFilter;
  });

  const categoryCounts = emails.reduce<Record<string, number>>((acc, email) => {
    const cat = email.category || categorizeEmail(email.subject, email.sender, email.text_content);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white m-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            Kotak Masuk
          </h2>
          {emails.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-600 border border-indigo-500/20">
              {emails.length}
            </span>
          )}
        </div>
        <button
          className={`flex items-center gap-1.5 px-3.5 py-2 border border-white/10 rounded-lg text-xs font-semibold bg-[#0a0a0a] text-zinc-400 cursor-pointer transition-all hover:border-white/15 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed ${
            isChecking ? "opacity-70" : ""
          }`}
          onClick={onRefresh}
          disabled={isChecking}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={isChecking ? "animate-spin" : ""}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {isChecking ? "Mengecek..." : "Refresh"}
        </button>
      </div>

      {/* Filter tabs */}
      {emails.length > 0 && (
        <div className="flex gap-1 p-1 bg-black rounded-lg overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === "all" ? emails.length : categoryCounts[tab.key] || 0;
            if (tab.key !== "all" && count === 0) return null;

            return (
              <button
                key={tab.key}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                  activeFilter === tab.key
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-500 hover:text-zinc-400 hover:bg-[#0a0a0a]"
                }`}
                onClick={() => onFilterChange(tab.key)}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-px rounded-full ${
                    activeFilter === tab.key
                      ? "bg-black text-white"
                      : "bg-blue-600/15 text-blue-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Email list or empty state */}
      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-[#0a0a0a] border border-dashed border-white/10 rounded-3xl text-center">
          <div className="text-zinc-500 mb-4 opacity-40 animate-[float_3s_ease-in-out_infinite]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-zinc-400 mb-1.5">Belum ada email masuk</p>
          <p className="text-[13px] text-zinc-500 max-w-[300px]">
            Email yang dikirim ke alamatmu akan muncul di sini secara real-time
          </p>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-[#0a0a0a] border border-dashed border-white/10 rounded-3xl text-center">
          <div className="text-zinc-500 mb-4 opacity-40 animate-[float_3s_ease-in-out_infinite]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-zinc-400 mb-1.5">Tidak ada email di kategori ini</p>
          <p className="text-[13px] text-zinc-500 max-w-[300px]">
            Coba filter lain atau lihat semua email
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredEmails.map((email) => {
            const otpCode = email.text_content ? extractOTPCode(email.text_content) : null;
            const isSelected = selectedEmailId === email.id;
            const cat = email.category || categorizeEmail(email.subject, email.sender, email.text_content);
            const hasAttachments = email.attachments_meta && email.attachments_meta.length > 0;

            return (
              <button
                key={email.id}
                className={`group flex items-center gap-3.5 px-4.5 py-4 bg-[#0a0a0a] border rounded-2xl cursor-pointer text-left w-full transition-all hover:bg-[#121214] hover:border-white/15 hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.4)] ${
                  isSelected
                    ? "border-blue-600 shadow-[0_0_24px_rgba(37,99,235,0.15)]"
                    : "border-white/10"
                }`}
                onClick={() => onSelectEmail(email)}
              >
                {/* Avatar */}
                <div className="hidden sm:flex shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-blue-600/15 text-blue-600 font-bold text-base">
                  {email.sender?.[0]?.toUpperCase() || "?"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[13px] font-semibold text-white truncate">
                      {email.sender || "Unknown"}
                    </span>
                    <span className="text-[11px] text-zinc-500 shrink-0">
                      {formatTimeAgo(email.received_at)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-400 m-0 truncate">
                    {email.subject || "(Tanpa subjek)"}
                  </p>
                  <p className="text-xs text-zinc-500 m-0 truncate">
                    {email.text_content?.slice(0, 100) || "Konten HTML — klik untuk melihat"}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${getCategoryClass(cat)}`}>
                      {getCategoryLabel(cat)}
                    </span>

                    {otpCode && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono text-pink-400 bg-pink-400/10 border border-pink-400/25 w-fit">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        OTP: {otpCode}
                      </div>
                    )}

                    {hasAttachments && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-500 bg-[#121214] border border-white/10">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        {email.attachments_meta!.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
