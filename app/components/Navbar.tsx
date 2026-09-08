"use client";

import { UserButton, Show } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[700px] z-50 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
      <div className="px-5 py-2.5 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2 no-underline">
          <span
            className="font-bold text-lg tracking-wide text-white"
            style={{ fontFamily: "'Akkolotm', sans-serif" }}
          >
            WHISEMAIL
          </span>
        </a>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real-time
          </span>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </nav>
  );
}
