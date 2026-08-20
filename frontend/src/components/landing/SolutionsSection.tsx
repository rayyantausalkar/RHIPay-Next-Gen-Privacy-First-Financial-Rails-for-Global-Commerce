"use client";

import React from "react";
import Link from "next/link";
import {
  UserCheck,
  Building2,
  QrCode,
  Plane,
  Coins,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Receipt,
  CheckCircle2
} from "lucide-react";

export const SolutionsSection: React.FC = () => {
  return (
    <section id="solutions" className="py-20 bg-[#081C2D]/30 border-t border-white/[0.06] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>SOLUTIONS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Designed for <span className="text-gradient-emerald">Individuals & Businesses</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8]">
            A seamless experience whether you are traveling the world or running global commerce operations.
          </p>
        </div>

        {/* 2 Main Solution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: For Individuals & Travelers */}
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all space-y-6 flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Plane className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  INDIVIDUALS & TRAVELERS
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Travel & Pay Anywhere in the World
                </h3>
                <p className="text-sm text-[#9AA3A8] leading-relaxed">
                  Travel abroad without the hassle of exchanging cash or opening local bank accounts. Pay local merchants or split expenses effortlessly.
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-[#F5F7FA]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Travel Mode</strong>: Select destination country for automatic local currency rails</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Instant Send</strong>: Pay via receiver's Dynamic QR, Phone Number, or Unique Code</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Receive & Request</strong>: Generate your personal Dynamic QR or 6-digit payment code</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Real-time Tracking</strong>: Monitor recent payments, balance history, and live FX rates</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#9AA3A8] font-mono">1-Click Single KYC Verification</span>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 group-hover:translate-x-1 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: For Businesses & Merchants */}
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all space-y-6 flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  BUSINESSES & MERCHANTS
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Universal Cross-Border Merchant Rail
                </h3>
                <p className="text-sm text-[#9AA3A8] leading-relaxed">
                  Accept payments from international customers and contractors that settle directly into your domestic account in your preferred currency.
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-[#F5F7FA]">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Universal Dynamic Invoicing</strong>: Generate multi-currency QR codes with rate locks</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Instant Settlement</strong>: Eliminate 3-5 day banking delays with sub-3s finality</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Multi-Currency Vault</strong>: Hold, convert, and manage international balances seamlessly</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Audit Ready</strong>: ISO 20022 compliant automated double-entry ledger logs</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#9AA3A8] font-mono">0% Hidden FX Spread Margins</span>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 group-hover:translate-x-1 transition-all"
              >
                <span>Explore Solutions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
