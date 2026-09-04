"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

interface AuthPageLayoutProps {
  initialMode: "login" | "signup";
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ initialMode }) => {
  return (
    <div className="min-h-screen bg-[#040D14] text-[#F5F7FA] relative selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden flex flex-col justify-center items-center py-8 px-4">
      {/* Background Animated Cyber Mesh & Grids */}
      <div className="fixed inset-0 bg-mesh-pattern pointer-events-none opacity-40 z-0" />
      <div className="fixed inset-0 bg-grid-lines pointer-events-none opacity-20 z-0" />

      {/* Floating Animated Radial Aura */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />

      {/* Centered Main Stage */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Unified Top Branding & Home Navigation */}
        <div className="w-full flex items-center justify-between mb-6 px-2">
          {/* Back to Home Button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-emerald-400" />
            <span>Home</span>
          </Link>

          {/* Single Clean RHI Pay Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/rhi_without_bg.svg"
                alt="RHI Pay Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                priority
              />
            </div>
            <span className="text-base font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              RHI Pay
            </span>
          </Link>

          {/* Spacer for symmetrical balance */}
          <div className="w-16 hidden sm:block" />
        </div>

        {/* Slanted Envelope Auth Card */}
        <AuthCard initialMode={initialMode} onSuccessRedirect="/app" />

        {/* Minimal Footer */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>© 2026 RHI Pay</p>
        </div>
      </div>
    </div>
  );
};
