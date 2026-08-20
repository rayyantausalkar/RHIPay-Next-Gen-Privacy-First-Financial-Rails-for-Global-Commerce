"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowUpDown
} from "lucide-react";

export const LiveFXCalculator: React.FC = () => {
  const [sendAmount, setSendAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [countdown, setCountdown] = useState(45);

  // Exchange rates against USD
  const ratesAgainstUSD: Record<string, number> = {
    USD: 1.0,
    EUR: 0.924,
    GBP: 0.789,
    INR: 86.50,
    JPY: 154.20,
    SGD: 1.342,
    AED: 3.673,
    CAD: 1.391,
    AUD: 1.545,
  };

  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    SGD: "S$",
    AED: "د.إ",
    CAD: "CA$",
    AUD: "A$",
  };

  // Compute live cross rate
  const fromRate = ratesAgainstUSD[fromCurrency] || 1.0;
  const toRate = ratesAgainstUSD[toCurrency] || 1.0;
  const crossRate = toRate / fromRate;

  const numAmount = parseFloat(sendAmount) || 0;
  const rhiFee = (numAmount * 0.0015).toFixed(2); // transparent 0.15% fee
  const convertedAmount = ((numAmount - parseFloat(rhiFee)) * crossRate).toFixed(2);

  // Bank calculation (typically 3.5% hidden FX markup + $25 wire fee)
  const bankMarkupRate = crossRate * 0.965;
  const bankWireFee = 25.0;
  const bankReceived = ((numAmount - bankWireFee) * bankMarkupRate).toFixed(2);
  const totalSaved = (parseFloat(convertedAmount) - parseFloat(bankReceived)).toFixed(2);

  // Countdown timer simulation for guaranteed rate lock
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <section id="fx-calculator" className="py-24 bg-[#040D14] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL-TIME FX ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Transparent Pricing with <span className="text-gradient-emerald">0% Hidden FX Margins</span>
          </h2>

          <p className="text-base sm:text-lg text-[#9AA3A8]">
            Compare our real-time interbank wholesale rates against traditional SWIFT bank transfers. No surprise fees, no hidden spreads.
          </p>
        </div>

        {/* Calculator Widget Container */}
        <div className="max-w-4xl mx-auto glass-panel-glow p-6 sm:p-10 rounded-3xl border border-emerald-500/30 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Input Form */}
            <div className="lg:col-span-7 space-y-5">
              {/* You Send Input */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#9AA3A8] mb-2 font-semibold">
                  You Send
                </label>
                <div className="flex items-center bg-[#040D14] border border-white/15 focus-within:border-emerald-500 rounded-2xl p-2 transition-colors">
                  <span className="pl-3 font-mono font-bold text-lg text-[#9AA3A8]">
                    {currencySymbols[fromCurrency] || "$"}
                  </span>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-xl sm:text-2xl font-bold text-white outline-none"
                    placeholder="1000"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-28 px-3 py-2 text-sm font-bold font-mono bg-[#081C2D] border border-white/10 rounded-xl text-white outline-none cursor-pointer"
                  >
                    {Object.keys(ratesAgainstUSD).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button & Mid Market Rate Indicator */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    1 {fromCurrency} = {crossRate.toFixed(4)} {toCurrency}
                  </span>
                </div>

                <button
                  onClick={swapCurrencies}
                  className="p-2 rounded-xl bg-[#081C2D] hover:bg-emerald-500 hover:text-black text-white border border-white/10 transition-colors"
                  title="Swap Currencies"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Recipient Gets Input */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#9AA3A8] mb-2 font-semibold">
                  Recipient Gets (Guaranteed Exact)
                </label>
                <div className="flex items-center bg-[#040D14] border border-emerald-500/40 rounded-2xl p-2">
                  <span className="pl-3 font-mono font-bold text-lg text-emerald-400">
                    {currencySymbols[toCurrency] || "₹"}
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={convertedAmount}
                    className="flex-1 bg-transparent px-3 py-2 text-xl sm:text-2xl font-bold text-emerald-300 font-mono outline-none"
                  />
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-28 px-3 py-2 text-sm font-bold font-mono bg-[#081C2D] border border-emerald-500/30 rounded-xl text-emerald-300 outline-none cursor-pointer"
                  >
                    {Object.keys(ratesAgainstUSD).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rate Lock Timer Bar */}
              <div className="flex items-center justify-between text-xs font-mono text-[#9AA3A8] p-3 rounded-xl bg-[#040D14]/80 border border-white/5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guaranteed Rate Lock Active</span>
                </div>
                <div className="text-emerald-400 font-bold">
                  {countdown}s remaining
                </div>
              </div>
            </div>

            {/* Right Column: Transparent Comparison & Cost Breakdown */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#040D14]/90 border border-emerald-500/30 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-3 flex items-center justify-between">
                <span>Fee & Savings Analysis</span>
                <span className="text-emerald-400 text-xs font-mono font-normal">Instant Audit</span>
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-[#9AA3A8]">
                  <span>RHI Pay Fixed Network Fee:</span>
                  <span className="text-white">${rhiFee}</span>
                </div>
                <div className="flex justify-between text-[#9AA3A8]">
                  <span>FX Spread Margin:</span>
                  <span className="text-emerald-400 font-bold">0.00% (Interbank)</span>
                </div>
                <div className="flex justify-between text-[#9AA3A8]">
                  <span>Estimated Delivery Time:</span>
                  <span className="text-emerald-300 font-bold">&lt; 2.4 seconds</span>
                </div>
              </div>

              {/* Savings Highlight Box */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1">
                <div className="text-[11px] font-mono text-[#9AA3A8]">
                  Compared to traditional bank wires:
                </div>
                <div className="text-lg font-extrabold text-emerald-300 font-mono">
                  You Save ≈ {currencySymbols[toCurrency]}{totalSaved} {toCurrency}
                </div>
                <div className="text-[10px] text-emerald-400">
                  (Zero correspondent wire fees + 0% FX spread)
                </div>
              </div>

              {/* Direct Action Button */}
              <Link
                href="/app"
                className="btn-pressable w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] rounded-xl shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/50 hover:brightness-110 transition-all"
              >
                <span>Lock Rate & Send Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
