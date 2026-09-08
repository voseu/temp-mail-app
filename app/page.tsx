"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import type { Email, EmailCategory } from "./lib/supabase";
import { generateIdentityEmail } from "./lib/email-utils";
import { useIsAdmin } from "./lib/hooks/use-admin";
import EmailInput from "./components/EmailInput";
import InboxList from "./components/InboxList";
import EmailViewer from "./components/EmailViewer";

export default function Home() {
  const { isAdmin, user } = useIsAdmin();

  const [tempEmail, setTempEmail] = useState("");
  const [inbox, setInbox] = useState<Email[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [emailHistory, setEmailHistory] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFilter, setActiveFilter] = useState<EmailCategory | "all">("all");

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchEmails = useCallback(async (email: string) => {
    setIsChecking(true);
    const { data, error } = await supabase
      .from("incoming_emails")
      .select("*")
      .eq("recipient", email)
      .order("received_at", { ascending: false });

    if (data && !error) {
      setInbox(data as Email[]);
    } else {
      console.error("Gagal menarik data:", error);
    }
    setTimeout(() => setIsChecking(false), 500);
  }, []);

  // ============================================
  // EMAIL ACTIONS
  // ============================================

  /**
   * Aktivasi email — dipakai baik admin maupun publik.
   * TIDAK mencatat history di sini. History hanya di-track di handleGenerate (admin only).
   */
  const activateEmail = useCallback(
    (email: string) => {
      localStorage.setItem("savedTempEmail", email);
      setTempEmail(email);
      setInbox([]);
      setSelectedEmail(null);
      setActiveFilter("all");
      fetchEmails(email);
    },
    [fetchEmails]
  );

  /**
   * Generate email berdasarkan identitas admin Clerk.
   * Hanya admin yang bisa memanggil ini.
   * Email yang di-generate admin akan di-track ke DB agar tidak di-auto-cleanup.
   */
  const handleGenerate = useCallback(() => {
    if (!user || !isAdmin) return;

    const email = generateIdentityEmail({
      username: user.username,
      primaryEmail: user.primaryEmailAddress?.emailAddress ?? null,
    });
    activateEmail(email);

    // Catat ke export history — HANYA email admin yang masuk di sini
    setEmailHistory((prev) => {
      if (prev.includes(email)) return prev;
      const updated = [...prev, email];
      localStorage.setItem("adminEmailHistory", JSON.stringify(updated));
      return updated;
    });

    // Track ke database: email admin tidak akan di-cleanup otomatis
    const adminEmail = user.primaryEmailAddress?.emailAddress;
    if (adminEmail) {
      supabase
        .from("admin_generated_emails")
        .upsert(
          { admin_email: adminEmail, generated_email: email },
          { onConflict: "generated_email" }
        )
        .then(({ error }) => {
          if (error) console.error("Gagal track email admin:", error);
        });
    }
  }, [user, isAdmin, activateEmail]);

  /**
   * Submit email custom — bisa diakses siapapun tanpa login.
   */
  const handleCustomSubmit = useCallback(
    (email: string) => {
      activateEmail(email);
    },
    [activateEmail]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(tempEmail);
  }, [tempEmail]);

  const handleDeleteEmail = useCallback(async (emailId: string) => {
    const { error } = await supabase
      .from("incoming_emails")
      .delete()
      .eq("id", emailId);

    if (!error) {
      setInbox((prev) => prev.filter((e) => e.id !== emailId));
      setSelectedEmail(null);
    } else {
      console.error("Gagal menghapus email:", error);
    }
  }, []);

  // ============================================
  // EKSPOR CSV — hanya admin
  // ============================================

  const exportToCSV = useCallback(() => {
    if (emailHistory.length === 0) return;
    const rows = ["Email,Password", ...emailHistory.map((email) => `${email},`)];
    const csvString = rows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Riwayat_Temp_Mail.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [emailHistory]);

  // ============================================
  // INIT
  // ============================================

  useEffect(() => {
    // Load admin-only history (bukan history campuran lama)
    const savedHistory = JSON.parse(
      localStorage.getItem("adminEmailHistory") || "[]"
    );
    setEmailHistory(savedHistory);

    // Hapus key lama yang sudah tidak dipakai
    localStorage.removeItem("emailHistory");

    // Restore email terakhir yang aktif
    const savedEmail = localStorage.getItem("savedTempEmail");
    if (savedEmail) {
      setTempEmail(savedEmail);
      fetchEmails(savedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // REAL-TIME LISTENER
  // ============================================

  useEffect(() => {
    if (!tempEmail) return;
    const channel = supabase
      .channel(`listener-${tempEmail}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incoming_emails",
          filter: `recipient=eq.${tempEmail}`,
        },
        (payload) => {
          const newEmail = payload.new as Email;
          setInbox((prev) => {
            const exists = prev.some((e) => e.id === newEmail.id);
            return exists ? prev : [newEmail, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tempEmail]);

  // ============================================
  // RENDER — hanya konten, navbar/footer ada di layout.tsx
  // ============================================

  return (
    <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <EmailInput
        currentEmail={tempEmail}
        onGenerate={handleGenerate}
        onCustomSubmit={handleCustomSubmit}
        onCopy={handleCopy}
        isAdmin={isAdmin}
      />

      {selectedEmail ? (
        <EmailViewer
          email={selectedEmail}
          onBack={() => setSelectedEmail(null)}
          onDelete={handleDeleteEmail}
        />
      ) : (
        <>
          <InboxList
            emails={inbox}
            isChecking={isChecking}
            selectedEmailId={null}
            onSelectEmail={(email) => setSelectedEmail(email)}
            onRefresh={() => fetchEmails(tempEmail)}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {isAdmin && (
            <div className="flex justify-end">
              <button
                className="flex items-center gap-1.5 px-4 py-2 border border-white/15 rounded-xl text-xs font-semibold text-zinc-500 bg-transparent cursor-pointer transition-all hover:text-white hover:border-blue-600 hover:bg-[#0a0a0a] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={exportToCSV}
                disabled={emailHistory.length === 0}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Ekspor Riwayat ({emailHistory.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}