"use client";

import React from "react";
import {
  ShieldCheck,
  Globe2,
  Zap,
  Lock,
  Layers,
  QrCode,
  FileCheck,
  Repeat,
  Sparkles,
  Scale
} from "lucide-react";

export const TrustMarquee: React.FC = () => {
  const pillars = [
    {
      icon: <Lock className="w-4 h-4 text-emerald-400" />,
      title: "Zero-Knowledge Privacy",
      subtitle: "Client-Side ZKP Proofs",
    },
    {
      icon: <Globe2 className="w-4 h-4 text-emerald-400" />,
      title: "Global Payments Hub",
      subtitle: "BIS Nexus Architecture",
    },
    {
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      title: "Sub-Second Settlement",
      subtitle: "< 3s Finality",
    },
    {
      icon: <FileCheck className="w-4 h-4 text-emerald-400" />,
      title: "ISO 20022 pacs.008",
      subtitle: "Native Financial Standard",
    },
    {
      icon: <QrCode className="w-4 h-4 text-emerald-400" />,
      title: "Universal Dynamic QR",
      subtitle: "Pay Anywhere Abroad",
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      title: "FATF Travel Rule Encrypted",
      subtitle: "ECIES/RSA Envelopes",
    },
    {
      icon: <Scale className="w-4 h-4 text-emerald-400" />,
      title: "Atomic Double-Entry",
      subtitle: "Zero Ledger Imbalance",
    },
    {
      icon: <Repeat className="w-4 h-4 text-emerald-400" />,
      title: "Real-Time FX Liquidity",
      subtitle: "0% Hidden Spreads",
    },
  ];

  return (
    <div className="relative py-10 bg-[#081C2D]/50 border-y border-white/[0.06] overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#040D14] via-transparent to-[#040D14] z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-5 text-center">
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#9AA3A8]">
          Powering the Next Era of Unified Borderless Financial Rails
        </p>
      </div>

      {/* Infinite Marquee Track */}
      <div className="flex select-none overflow-hidden">
        <div className="animate-marquee flex items-center gap-6">
          {pillars.map((item, idx) => (
            <div
              key={`pillar-1-${idx}`}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#040D14]/80 border border-white/[0.08] hover:border-emerald-500/40 shadow-lg backdrop-blur-md transition-all flex-shrink-0 group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </div>
                <div className="text-[10px] font-mono text-[#9AA3A8]">
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
          {/* Duplicate set for seamless infinite loop */}
          {pillars.map((item, idx) => (
            <div
              key={`pillar-2-${idx}`}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#040D14]/80 border border-white/[0.08] hover:border-emerald-500/40 shadow-lg backdrop-blur-md transition-all flex-shrink-0 group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </div>
                <div className="text-[10px] font-mono text-[#9AA3A8]">
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
