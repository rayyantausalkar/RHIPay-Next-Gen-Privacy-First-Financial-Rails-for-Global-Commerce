"use client";

import React from "react";
import {
  Globe2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  Sparkles,
  RefreshCw,
  Lock
} from "lucide-react";

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#040D14] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-[#1F7A63]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#081C2D]/60 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ABOUT RHI PAY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            A Unified Hub for <span className="text-gradient-emerald">Global Digital Payments</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8] leading-relaxed">
            RHI Pay is a global digital payment hub designed to simplify and secure cross-border payments for individuals and businesses.
          </p>
        </div>

        {/* Narrative Banner */}
        <div className="glass-panel-glow p-8 sm:p-12 rounded-3xl border border-emerald-500/25 max-w-4xl mx-auto mb-12 text-center space-y-6">
          <p className="text-base sm:text-xl text-white font-medium leading-relaxed">
            "Instead of treating international payments as separate systems across different countries, currencies, banks, and payment networks, RHI Pay acts as a <span className="text-emerald-300 font-bold">single intelligent payment layer</span> connecting these ecosystems."
          </p>
          <div className="h-px w-24 bg-emerald-500/40 mx-auto" />
          <p className="text-xs sm:text-sm text-[#9AA3A8] leading-relaxed max-w-2xl mx-auto">
            We bridge the complexity, security, compliance, and interoperability challenges associated with international payments, empowering users to send, receive, convert, and manage money globally with ease.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Unified Infrastructure</h3>
            <p className="text-xs text-[#9AA3A8] leading-relaxed">
              Connects domestic banking systems, real-time clearing networks, and multi-currency rails through one simple interface.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Security & Compliance</h3>
            <p className="text-xs text-[#9AA3A8] leading-relaxed">
              Zero-Knowledge single KYC verification and bank-grade encryption safeguard every transaction and user identity.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sub-3s Settlement</h3>
            <p className="text-xs text-[#9AA3A8] leading-relaxed">
              Atomic cross-border settlement eliminates multi-day delays and delivers instant transaction confirmation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
