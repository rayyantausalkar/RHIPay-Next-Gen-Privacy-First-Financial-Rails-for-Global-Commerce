"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Globe2,
  Lock,
  Zap,
  Repeat,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  FileCode2,
  TrendingUp,
  MapPin,
  ArrowRight,
  Sparkles,
  Layers,
  Search
} from "lucide-react";

export const FeaturesBento: React.FC = () => {
  // Interactive State for Feature 1: Dynamic QR Simulator
  const [demoAmount, setDemoAmount] = useState("50.00");
  const [demoCurrency, setDemoCurrency] = useState("USD");
  const [demoPurpose, setDemoPurpose] = useState("Dinner in Tokyo");

  // Interactive State for Feature 3: Travel Mode
  const [selectedCountry, setSelectedCountry] = useState("Japan");

  const travelRails: Record<string, { currency: string; rail: string; symbol: string; rate: string; tip: string }> = {
    Japan: { currency: "JPY", rail: "Zengin / PayPay Rail", symbol: "¥", rate: "154.20", tip: "Instant QR accepted at all convenience stores & cabs." },
    Singapore: { currency: "SGD", rail: "PayNow / FAST Rail", symbol: "S$", rate: "1.34", tip: "Direct merchant QR & hawker center scan-to-pay." },
    "United Arab Emirates": { currency: "AED", rail: "Aani / CBUAE Instant", symbol: "د.إ", rate: "3.67", tip: "Zero foreign transaction markup in Dubai & Abu Dhabi." },
    France: { currency: "EUR", rail: "SEPA Instant & TIPS", symbol: "€", rate: "0.92", tip: "Instant euro clearing across all EU member merchants." },
    India: { currency: "INR", rail: "UPI / NPCI Nexus Spoke", symbol: "₹", rate: "86.50", tip: "Scan any merchant QR code across 30M+ local vendors." },
    "United Kingdom": { currency: "GBP", rail: "Faster Payments Scheme", symbol: "£", rate: "0.79", tip: "Sub-second GBP settlement directly linked to your card." },
  };

  const currentCountryData = travelRails[selectedCountry] || travelRails["Japan"];

  return (
    <section id="features" className="py-24 bg-[#040D14] relative overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#1F7A63]/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CORE CAPABILITIES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Engineered for <span className="text-gradient-emerald">Speed, Security</span> & Simplicity
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8]">
            Explore the deep modular infrastructure that powers instant, privacy-preserving cross-border transactions.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* BENTO CARD 1 (Large - Col Span 8): Interactive Dynamic QR & Payment Code */}
          <div className="md:col-span-12 lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Universal Dynamic QR & Payment Code
                    </h3>
                    <p className="text-xs text-[#9AA3A8]">
                      Generate instantaneous QR requests with embedded FX rate locks
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/25">
                  LIVE INTERACTIVE PREVIEW
                </span>
              </div>

              {/* Interactive Simulator inside Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 items-center">
                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#9AA3A8] mb-1">
                      Request Amount & Currency
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={demoAmount}
                        onChange={(e) => setDemoAmount(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm font-bold bg-[#040D14] border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none"
                        placeholder="50.00"
                      />
                      <select
                        value={demoCurrency}
                        onChange={(e) => setDemoCurrency(e.target.value)}
                        className="w-24 px-3 py-2 text-xs font-bold font-mono bg-[#040D14] border border-white/10 rounded-xl text-emerald-400 focus:border-emerald-500 outline-none"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                        <option value="JPY">JPY</option>
                        <option value="SGD">SGD</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#9AA3A8] mb-1">
                      Payment Purpose / Memo
                    </label>
                    <input
                      type="text"
                      value={demoPurpose}
                      onChange={(e) => setDemoPurpose(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#040D14] border border-white/10 rounded-xl text-[#F5F7FA] focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#9AA3A8]">6-Digit Payment Code:</span>
                      <span className="text-emerald-300 font-bold tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded">
                        RHI-892415
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#9AA3A8]">
                      <span>Expires in:</span>
                      <span className="text-emerald-400">14:58 (Auto-Rate Locked)</span>
                    </div>
                  </div>
                </div>

                {/* Visual QR Code Display */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#040D14] border border-emerald-500/30 text-center shadow-lg relative">
                  <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner relative group/qr">
                    {/* Stylized QR representation */}
                    <div className="w-full h-full bg-black rounded-lg p-1.5 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-4 border-emerald-500 rounded-sm" />
                        <div className="w-6 h-6 border-4 border-emerald-500 rounded-sm" />
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-4 border-emerald-500 rounded-sm" />
                        <div className="w-6 h-6 bg-emerald-400/40 rounded-sm" />
                      </div>
                    </div>
                    {/* Scanning Line Animation */}
                    <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-bounce" />
                  </div>
                  <div className="mt-2 text-[11px] font-mono font-bold text-white">
                    {demoAmount} {demoCurrency}
                  </div>
                  <div className="text-[10px] text-[#9AA3A8] truncate max-w-[140px]">
                    {demoPurpose}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#9AA3A8]">
                Compatible with iOS, Android, and Web browsers worldwide.
              </span>
              <Link href="/app" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                <span>Try Receiver Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* BENTO CARD 2 (Col Span 4): Zero-Knowledge Privacy */}
          <div className="md:col-span-6 lg:col-span-4 glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Zero-Knowledge Privacy
              </h3>

              <p className="text-xs text-[#9AA3A8] leading-relaxed">
                Client-side SnarkJS and Poseidon Merkle proofs cryptographically prove your account balance and legitimacy without revealing your identity or account history.
              </p>

              {/* Cryptographic Proof Diagram Visual */}
              <div className="p-3.5 rounded-2xl bg-[#040D14] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#9AA3A8]">ZK Merkle Tree Depth:</span>
                  <span className="text-emerald-400 font-bold">20 Levels</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#9AA3A8]">Proof Generation Time:</span>
                  <span className="text-emerald-300 font-bold">&lt; 1.2 seconds</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#9AA3A8]">Anti-Replay Nullifier:</span>
                  <span className="text-zinc-400 text-[10px] truncate max-w-[120px]">
                    0x9f82a1...bc40
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>FATF Travel Rule Encrypted</span>
            </div>
          </div>

          {/* BENTO CARD 3 (Col Span 4): Location-Aware Travel Mode */}
          <div className="md:col-span-6 lg:col-span-4 glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/25">
                  AUTO-ROUTING
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Location-Aware Travel Mode
              </h3>

              <p className="text-xs text-[#9AA3A8] leading-relaxed">
                Select your destination country and RHI Pay automatically switches your payment rail to the native local infrastructure.
              </p>

              {/* Country Selector */}
              <div>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-[#040D14] border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none"
                >
                  {Object.keys(travelRails).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Local Rail Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9AA3A8]">Active Local Rail:</span>
                  <span className="text-emerald-300 font-bold font-mono">
                    {currentCountryData.rail}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9AA3A8]">Live Mid-Market Rate:</span>
                  <span className="text-white font-mono font-bold">
                    1 USD = {currentCountryData.symbol}{currentCountryData.rate}
                  </span>
                </div>
                <p className="text-[10px] text-[#9AA3A8] pt-1 border-t border-emerald-500/20">
                  {currentCountryData.tip}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] text-xs text-[#9AA3A8] flex items-center justify-between">
              <span>200+ Destinations Ready</span>
              <span className="text-emerald-400 font-mono">0% FX Spread</span>
            </div>
          </div>

          {/* BENTO CARD 4 (Col Span 4): Atomic Double-Entry Ledger */}
          <div className="md:col-span-6 lg:col-span-4 glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Repeat className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Atomic Double-Entry Ledger
              </h3>

              <p className="text-xs text-[#9AA3A8] leading-relaxed">
                Every debit has an exact, immutable credit across our liquidity pools. Scaled integer arithmetic guarantees zero floating-point rounding drift.
              </p>

              {/* Ledger Visual */}
              <div className="p-3.5 rounded-2xl bg-[#040D14] border border-white/10 font-mono text-[10px] space-y-1.5">
                <div className="flex items-center justify-between text-rose-400">
                  <span>DEBIT Payer (USD Pool):</span>
                  <span>-100.00 USD</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>CREDIT Payee (JPY Pool):</span>
                  <span>+15,420 JPY</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
                  <span>Net Ledger Variance:</span>
                  <span className="text-emerald-400 font-bold">0.00000000</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] text-xs text-[#9AA3A8] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Audited & Cryptographically Verifiable</span>
            </div>
          </div>

          {/* BENTO CARD 5 (Col Span 4): ISO 20022 Standard Native */}
          <div className="md:col-span-6 lg:col-span-4 glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] hover:border-emerald-500/35 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileCode2 className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                ISO 20022 pacs.008 Native
              </h3>

              <p className="text-xs text-[#9AA3A8] leading-relaxed">
                Seamless institutional interoperability with standardized XML/JSON message formats ready for global central bank clearing networks.
              </p>

              {/* pacs.008 snippet */}
              <div className="p-3.5 rounded-2xl bg-[#040D14] border border-white/10 font-mono text-[10px] text-zinc-400 space-y-1 overflow-x-hidden">
                <div className="text-emerald-400">&lt;FIToFICstmrCdtTrf&gt;</div>
                <div className="pl-2">&lt;GrpHdr&gt;&lt;MsgId&gt;RHI-NEXUS-2026&lt;/MsgId&gt;</div>
                <div className="pl-2 text-emerald-300">&lt;CdtTrfTxInf&gt;&lt;IntrBkSttlmAmt&gt;</div>
                <div className="text-emerald-400">&lt;/FIToFICstmrCdtTrf&gt;</div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] text-xs text-[#9AA3A8] flex items-center justify-between">
              <span>BIS Nexus Model</span>
              <Link href="/app" className="text-emerald-400 font-semibold hover:underline">
                View Telemetry →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
