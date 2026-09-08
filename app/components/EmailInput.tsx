"use client";

import { useState } from "react";
import {
  validateCustomEmail,
  buildEmailAddress,
  EMAIL_DOMAIN,
} from "../lib/email-utils";

type Mode = "generate" | "custom";

interface EmailInputProps {
  currentEmail: string;
  onGenerate: () => void;
  onCustomSubmit: (email: string) => void;
  onCopy: () => void;
  isAdmin: boolean;
}

export default function EmailInput({
  currentEmail,
  onGenerate,
  onCustomSubmit,
  onCopy,
  isAdmin,
}: EmailInputProps) {
  const [mode, setMode] = useState<Mode>(isAdmin ? "generate" : "custom");
  const [customUsername, setCustomUsername] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCustomSubmit = () => {
    const error = validateCustomEmail(customUsername);
    if (error) {
      setValidationError(error);
      return;
    }
    if (customUsername.length === 0) {
      setValidationError("Masukkan username email");
      return;
    }
    setValidationError(null);
    const fullEmail = buildEmailAddress(customUsername);
    onCustomSubmit(fullEmail);
  };

  const handleUsernameChange = (value: string) => {
    // Force lowercase dan strip whitespace
    const cleaned = value.toLowerCase().replace(/\s/g, "");
    setCustomUsername(cleaned);
    if (cleaned.length > 0) {
      setValidationError(validateCustomEmail(cleaned));
    } else {
      setValidationError(null);
    }
  };

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCustomSubmit();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-7 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      {/* Blue accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 opacity-60" />

      {/* Header */}
      <div className="flex items-start gap-3.5 mb-6">
        <div className="flex shrink-0 items-center justify-center w-11 h-11 rounded-xl bg-blue-600/15 text-blue-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-white leading-tight">Whise Mail</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Terima OTP dari emailmu</p>
        </div>
      </div>

      {/* Mode tabs — Random hanya untuk admin */}
      {isAdmin && (
        <div className="flex gap-1 p-1 bg-black rounded-lg mb-5">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-[13px] font-semibold transition-all cursor-pointer ${
              mode === "generate"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
            onClick={() => setMode("generate")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Random
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-[13px] font-semibold transition-all cursor-pointer ${
              mode === "custom"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
            onClick={() => setMode("custom")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Custom
          </button>
        </div>
      )}

      {/* Active email display */}
      {currentEmail && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-black border border-white/10 rounded-xl mb-4 overflow-hidden sm:flex-nowrap flex-wrap">
          <div className="shrink-0 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded bg-blue-600/15 text-blue-600 border border-indigo-500/20">
            AKTIF
          </div>
          <span className="flex-1 min-w-0 font-mono text-sm font-semibold text-white truncate">
            {currentEmail}
          </span>
          <button
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              copied
                ? "border-emerald-400! text-emerald-400! bg-emerald-400/10!"
                : "border-white/15 bg-[#0a0a0a] text-zinc-400 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Tersalin!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Salin
              </>
            )}
          </button>
        </div>
      )}

      {/* Mode content */}
      {mode === "generate" ? (
        <div className="flex flex-col gap-2.5">
          <button
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 cursor-pointer transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:translate-y-0"
            onClick={onGenerate}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Generate Email Baru
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2 sm:flex-row flex-col">
            <div className="flex-1 flex items-center bg-[#121214] border border-white/10 rounded-xl overflow-hidden transition-all focus-within:border-blue-600 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]">
              <input
                type="text"
                value={customUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="email kamu"
                className={`flex-1 min-w-0 px-3.5 py-3 bg-transparent border-none outline-none text-sm font-mono font-medium text-white placeholder:text-zinc-500 ${
                  validationError ? "text-red-400" : ""
                }`}
                maxLength={30}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="pr-3.5 text-sm font-mono font-medium text-zinc-500 shrink-0">
                @{EMAIL_DOMAIN}
              </span>
            </div>
            <button
              className="shrink-0 px-5 py-3 rounded-xl text-[13px] font-bold text-white bg-blue-600 cursor-pointer transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleCustomSubmit}
              disabled={!!validationError || customUsername.length === 0}
            >
              Gunakan
            </button>
          </div>
          {validationError && (
            <p className="text-xs text-red-400 pl-0.5">{validationError}</p>
          )}
          <p className="text-[11px] text-zinc-500 pl-0.5">
            Masukkan Email Tanpa &apos;@&apos; , lalu klik gunakan.
          </p>
        </div>
      )}
    </div>
  );
}
