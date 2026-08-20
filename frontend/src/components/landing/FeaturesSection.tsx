"use client";

import React from "react";
import {
  QrCode,
  Globe2,
  Lock,
  Zap,
  Repeat,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Sparkles,
  History
} from "lucide-react";

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <QrCode className="w-5 h-5 text-emerald-400" />,
      title: "Universal Dynamic QR Pay",
      desc: "Send or receive money instantly. Receivers can generate custom dynamic QR codes with exact amounts and currency tags for instant scan-to-pay.",
    },
    {
      icon: <MapPin className="w-5 h-5 text-emerald-400" />,
      title: "Location-Aware Travel Mode",
      desc: "Select the country you are traveling to, and RHI Pay automatically configures the local payment rails and locks in the wholesale FX rate.",
    },
    {
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      title: "Multiple Send Options",
      desc: "Send money flexibly through unique Dynamic QR codes, recipient phone numbers, or 6-digit one-time payment codes with instant confirmation.",
    },
    {
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      title: "Zero-Knowledge Single KYC",
      desc: "Complete biometric KYC once. Your personal identity remains encrypted in a secure envelope, verified through Zero-Knowledge cryptography.",
    },
    {
      icon: <History className="w-5 h-5 text-emerald-400" />,
      title: "Live Tracking & History",
      desc: "Track all recent payment requests, incoming settlements, live multi-currency balances, and detailed transaction histories in real time.",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      title: "Real-Time Wholesale FX",
      desc: "Access live interbank foreign exchange rates with transparent 0% hidden spreads and guaranteed rate-lock protection against currency volatility.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-[#040D14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#1F7A63]/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CORE FEATURES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Everything You Need for <span className="text-gradient-emerald">Borderless Money</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8]">
            A powerful suite of capabilities designed to make sending, receiving, and managing international payments as simple as local cash.
          </p>
        </div>

        {/* Features 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="glass-panel p-7 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all space-y-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                {f.icon}
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                {f.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#9AA3A8] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
