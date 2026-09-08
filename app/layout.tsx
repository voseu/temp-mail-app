import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminGate from "./components/AdminGate";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Temp Mail — Email Sekali Pakai @whise.fun",
  description:
    "Buat email sekali pakai instan untuk menerima OTP, bypass paywall, atau verifikasi akun. Tanpa registrasi, real-time, aman.",
  keywords: ["temp mail", "disposable email", "burner email", "OTP", "whise.fun"],
  openGraph: {
    title: "Temp Mail — Email Sekali Pakai @whise.fun",
    description:
      "Email disposable instan — terima OTP tanpa mengotori inbox pribadimu.",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-300">
        <ClerkProvider>
          {/* Blokir user yang login tapi bukan admin → auto sign-out */}
          <AdminGate />
          <Navbar />
          <div className="flex-1 flex flex-col pt-20">{children}</div>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
