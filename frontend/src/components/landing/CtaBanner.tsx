"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Globe2, Sparkles, CheckCircle2 } from "lucide-react";

export const CtaBanner: React.FC = () => {
  return (
    <section className="py-20 bg-[#040D14] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-[36px] p-8 sm:p-14 overflow-hidden border border-emerald-500/40 bg-gradient-to-b from-[#081C2D] via-[#05131f] to-[#040D14] shadow-2xl shadow-emerald-950/60 text-center space-y-8">
          {/* Ambient Glow mesh inside card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#10B981]/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse-glow" />
          <div className="absolute -bottom-20 right-0 w-72 h-72 bg-[#1F7A63]/20 rounded-full blur-[90px] pointer-events-none -z-10" />

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>START MOVING CAPITAL GLOBALLY</span>
          </div>

          {/* Headline */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Redefine How You Move{" "}
              <span className="text-gradient-emerald">Money Globally?</span>
            </h2>
            <p className="text-sm sm:text-base text-[#9AA3A8] max-w-xl mx-auto">
              Join thousands of travelers, founders, and international teams using RHI Pay for instant, zero-knowledge, and transparent cross-border payments.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/app"
              className="btn-pressable w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] hover:brightness-110 rounded-2xl shadow-xl shadow-emerald-500/40 ring-1 ring-emerald-400/60 transition-all group"
            >
              <span>Launch RHI Pay Hub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#features"
              className="btn-pressable w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold text-[#F5F7FA] bg-[#040D14]/80 hover:bg-[#040D14] hover:text-white border border-white/[0.12] hover:border-emerald-500/40 rounded-2xl backdrop-blur-md transition-all"
            >
              <span>Explore Platform Docs</span>
            </a>
          </div>

          {/* Guarantees */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#9AA3A8] font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant 1-Click Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>0% Hidden Foreign Exchange Fees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>200+ Jurisdictions Supported</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
