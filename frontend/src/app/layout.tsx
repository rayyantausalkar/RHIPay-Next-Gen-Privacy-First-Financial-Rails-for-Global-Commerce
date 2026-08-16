import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RHIPay Nexus — Instant Cross-Border P2P Settlement",
  description:
    "BIS Nexus Hub-and-Spoke Instant P2P Payment System with Zero-Knowledge Proof Privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-zinc-100 min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200`}
      >
        <Toaster richColors position="top-right" theme="dark" />
        {children}
      </body>
    </html>
  );
}
