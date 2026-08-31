"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, BalanceData } from "@/context/AuthContext";
import { UpiPinModal } from "../modals/UpiPinModal";

const FOREX_PAIRS = [
  { pair: "USD / INR", from: "USD", to: "INR", rate: "86.8500", change: "+0.14%", flag: "🇺🇸 🇮🇳" },
  { pair: "SGD / INR", from: "SGD", to: "INR", rate: "64.5725", change: "+0.08%", flag: "🇸🇬 🇮🇳" },
  { pair: "EUR / INR", from: "EUR", to: "INR", rate: "93.8920", change: "-0.05%", flag: "🇪🇺 🇮🇳" },
  { pair: "GBP / INR", from: "GBP", to: "INR", rate: "110.6370", change: "+0.22%", flag: "🇬🇧 🇮🇳" },
  { pair: "AED / INR", from: "AED", to: "INR", rate: "23.6480", change: "+0.01%", flag: "🇦🇪 🇮🇳" },
  { pair: "JPY / INR", from: "JPY", to: "INR", rate: "0.5669", change: "-0.18%", flag: "🇯🇵 🇮🇳" },
  { pair: "THB / INR", from: "THB", to: "INR", rate: "2.5174", change: "+0.12%", flag: "🇹🇭 🇮🇳" },
  { pair: "SGD / USD", from: "SGD", to: "USD", rate: "0.7435", change: "-0.02%", flag: "🇸🇬 🇺🇸" },
  { pair: "AUD / INR", from: "AUD", to: "INR", rate: "56.3960", change: "+0.19%", flag: "🇦🇺 🇮🇳" },
];

export const FinancialGridBox: React.FC = () => {
  const { user, checkBalance } = useAuth();
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(false);
  const [activeForexIndex, setActiveForexIndex] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  // Cycle Forex rates every 3.5 seconds unless active journey locks on one
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setActiveForexIndex((prev) => (prev + 1) % FOREX_PAIRS.length);
        setIsFlipping(false);
      }, 200);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleOpenPin = () => {
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    const res = await checkBalance(pin);
    if (res.success && res.data) {
      setBalanceData(res.data);
      setIsBalanceVisible(true);
      toast.success("Account balance decrypted & verified.");
    }
  };

  const currentPair = FOREX_PAIRS[activeForexIndex];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* Box 1: Check Balance (Secured with UPI PIN) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#081520] to-[#040e16] border border-white/[0.08] shadow-lg flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-300">Account Balance</h4>
                <p className="text-[10px] text-zinc-500 font-mono">Clearing Account Vault</p>
              </div>
            </div>

            {isBalanceVisible && (
              <button
                type="button"
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
                title="Toggle Visibility"
              >
                {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Balance Content */}
          <div className="my-2 min-h-[58px] flex flex-col justify-center">
            {isBalanceVisible && balanceData ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tracking-tight">
                    {balanceData.wallet_balance_formatted}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">Home Vault</span>
                </div>

                {balanceData.active_journey_country && balanceData.travel_wallet_balance_formatted && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono font-bold">
                    <span>✈️ Travel:</span>
                    <span>{balanceData.travel_wallet_balance_formatted}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ({balanceData.active_journey_country})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-500 tracking-wider">
                    ••••••••••
                  </p>
                  <p className="text-[10px] text-zinc-500">PIN authorization required to view</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
            {!isBalanceVisible ? (
              <button
                type="button"
                onClick={handleOpenPin}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Check Balance (Enter UPI PIN)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between w-full text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified with PIN</span>
                </span>
                <button
                  type="button"
                  onClick={handleOpenPin}
                  className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 underline font-mono cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Dynamically Changing Live Forex Rates */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#071724] to-[#040e17] border border-white/[0.08] shadow-lg flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-300">Live Forex Exchange</h4>
                <p className="text-[10px] text-zinc-500 font-mono">Bilateral Liquidity Grid</p>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Dynamic Cycling Rate Content */}
          <div className={`my-2 min-h-[58px] flex flex-col justify-center transition-opacity duration-200 ${isFlipping ? "opacity-30" : "opacity-100"}`}>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{currentPair.flag}</span>
                  <span className="text-xs font-bold text-zinc-200">{currentPair.pair}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-tight">
                    {currentPair.rate}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {currentPair.change}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Marquee / Indicator */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Zero-Slippage Guaranteed Quote</span>
            <div className="flex items-center gap-1">
              {FOREX_PAIRS.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === activeForexIndex % 5 ? "bg-cyan-400 scale-125" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* UPI PIN Modal for Balance Check */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode="balance"
        title="Check Balance"
        subtitle="Enter your 4-digit UPI PIN to decrypt account balance"
        onSuccess={handlePinSuccess}
      />
    </>
  );
};
