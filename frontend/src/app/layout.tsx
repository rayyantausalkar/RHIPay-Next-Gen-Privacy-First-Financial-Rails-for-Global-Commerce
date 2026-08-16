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
        <Toaster
          position="bottom-right"
          theme="dark"
          closeButton
          gap={12}
          visibleToasts={4}
          toastOptions={{
            duration: 4000,
            className:
              "!bg-[#09090b]/95 !backdrop-blur-2xl !border !border-white/[0.12] !shadow-2xl !shadow-black/80 !rounded-2xl !p-4 !text-zinc-100",
            classNames: {
              toast:
                "group !bg-[#09090b]/95 !backdrop-blur-2xl !border !border-white/[0.12] !shadow-2xl !shadow-black/80 !rounded-2xl !p-4 !text-zinc-100",
              title: "!text-white !font-bold !text-xs !tracking-tight",
              description: "!text-zinc-400 !text-[11px] !font-mono !mt-0.5",
              actionButton:
                "!bg-emerald-500 !text-black !font-bold !text-xs !rounded-xl !px-3 !py-1.5",
              cancelButton:
                "!bg-zinc-800 !text-zinc-300 !font-medium !text-xs !rounded-xl !px-3 !py-1.5",
              closeButton:
                "!bg-zinc-900 !text-zinc-400 !border !border-white/10 hover:!text-white hover:!bg-zinc-800 !transition-colors",
              success: "!border-emerald-500/30",
              error: "!border-rose-500/30",
              info: "!border-emerald-500/20",
              warning: "!border-amber-500/30",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
