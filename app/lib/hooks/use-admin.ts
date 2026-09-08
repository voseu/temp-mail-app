"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../supabase";

/**
 * Hook untuk mengecek apakah user Clerk saat ini adalah admin.
 *
 * Logika:
 * 1. Ambil email primary dari Clerk user
 * 2. Cek apakah email tersebut ada di tabel `admin_whitelist` di Supabase
 * 3. Return { isAdmin, isChecking, user }
 *
 * Jika user belum login atau email tidak ada di whitelist → isAdmin = false
 */
export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    // Belum login → bukan admin
    if (!user) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    // Cek ke tabel admin_whitelist
    supabase
      .from("admin_whitelist")
      .select("id")
      .eq("email", email)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Gagal cek admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
        setIsChecking(false);
      });
  }, [user, isLoaded]);

  return { isAdmin, isChecking, user, isLoaded };
}
