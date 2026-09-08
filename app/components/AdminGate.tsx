"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useIsAdmin } from "../lib/hooks/use-admin";

/**
 * Gate yang mendeteksi user login tapi BUKAN admin.
 * Tampilkan pesan penolakan → auto sign-out setelah countdown habis.
 */
export default function AdminGate() {
  const { isAdmin, isChecking, user, isLoaded } = useIsAdmin();
  const { signOut } = useClerk();
  const [countdown, setCountdown] = useState(4);

  const isRejected = isLoaded && !isChecking && !!user && !isAdmin;

  // Countdown timer — hanya menghitung mundur
  useEffect(() => {
    if (!isRejected) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRejected]);

  // Sign-out terpisah agar tidak dipanggil di dalam setState
  useEffect(() => {
    if (isRejected && countdown <= 0) {
      signOut({ redirectUrl: "/" });
    }
  }, [isRejected, countdown, signOut]);

  if (!isRejected) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 rounded-2xl border border-red-500/20 bg-zinc-950 p-8 text-center shadow-2xl shadow-red-500/5">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Akses Ditolak</h3>
        <p className="text-sm text-zinc-400 mb-1">
          <span className="font-medium text-zinc-300">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
        </p>
        <p className="text-sm text-zinc-500 mb-6">
          bukan partner terdaftar Whisemail.
        </p>

        <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-500">
            Otomatis keluar dalam{" "}
            <span className="font-bold text-red-400">{countdown}</span> detik
          </p>
        </div>

        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="mt-4 text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          Keluar sekarang
        </button>
      </div>
    </div>
  );
}
