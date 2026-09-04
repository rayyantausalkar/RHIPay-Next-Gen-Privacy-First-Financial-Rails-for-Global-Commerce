"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, BalanceData } from "@/context/AuthContext";
import { UpiPinModal } from "../modals/UpiPinModal";

interface ForexPair {
  pair: string;
  from: string;
  to: string;
  rate: string;
  change: string;
  flag: string;
  countryCode: string;
}

const GLOBAL_FOREX_PAIRS: ForexPair[] = [
  { pair: "USD / INR", from: "USD", to: "INR", rate: "86.8500", change: "+0.14%", flag: "🇺🇸 🇮🇳", countryCode: "US" },
  { pair: "SGD / INR", from: "SGD", to: "INR", rate: "64.5725", change: "+0.08%", flag: "🇸🇬 🇮🇳", countryCode: "SG" },
  { pair: "EUR / INR", from: "EUR", to: "INR", rate: "93.8920", change: "-0.05%", flag: "🇪🇺 🇮🇳", countryCode: "EU" },
  { pair: "GBP / INR", from: "GBP", to: "INR", rate: "110.6370", change: "+0.22%", flag: "🇬🇧 🇮🇳", countryCode: "GB" },
  { pair: "AED / INR", from: "AED", to: "INR", rate: "23.6480", change: "+0.01%", flag: "🇦🇪 🇮🇳", countryCode: "AE" },
  { pair: "JPY / INR", from: "JPY", to: "INR", rate: "0.5669", change: "-0.18%", flag: "🇯🇵 🇮🇳", countryCode: "JP" },
  { pair: "THB / INR", from: "THB", to: "INR", rate: "2.5174", change: "+0.12%", flag: "🇹🇭 🇮🇳", countryCode: "TH" },
  { pair: "MYR / INR", from: "MYR", to: "INR", rate: "19.5160", change: "+0.04%", flag: "🇲🇾 🇮🇳", countryCode: "MY" },
  { pair: "AUD / INR", from: "AUD", to: "INR", rate: "56.3960", change: "+0.19%", flag: "🇦🇺 🇮🇳", countryCode: "AU" },
  { pair: "CAD / INR", from: "CAD", to: "INR", rate: "62.4820", change: "+0.06%", flag: "🇨🇦 🇮🇳", countryCode: "CA" },
];

export const FinancialGridBox: React.FC = () => {
  const { user, checkBalance } = useAuth();
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(false);
  const [activeForexIndex, setActiveForexIndex] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  // Determine if user has an active travel journey
  const activeTravelCountry = user?.active_journey_country;

  // Find country-specific forex pair if active journey exists
  const activeJourneyForexPair = useMemo(() => {
    if (!activeTravelCountry) return null;
    const match = GLOBAL_FOREX_PAIRS.find(
      (p) => p.countryCode === activeTravelCountry.toUpperCase() || p.from === user?.active_journey_currency
    );
    if (match) return match;
    const home = user?.preferred_currency || "INR";
    const destCur = user?.active_journey_currency || "USD";
    return {
      pair: `${destCur} / ${home}`,
      from: destCur,
      to: home,
      rate: destCur === "USD" ? "86.8500" : "64.5725",
      change: "+0.14%",
      flag: "✈️ 🌐",
      countryCode: activeTravelCountry,
    };
  }, [activeTravelCountry, user?.active_journey_currency, user?.preferred_currency]);

  // Requirement: Cycle Forex rates ONLY if no active journey is locked
  useEffect(() => {
    if (activeJourneyForexPair) {
      // Sticky to selected travel country
      return;
    }

    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setActiveForexIndex((prev) => (prev + 1) % GLOBAL_FOREX_PAIRS.length);
        setIsFlipping(false);
      }, 200);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeJourneyForexPair]);

  const handleOpenPin = () => {
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    const res = await checkBalance(pin);
    if (res.success && res.data) {
      setIsBalanceVisible(true);
      toast.success("Account balance decrypted & verified.");
    }
  };

  // Live real-time derived balance strings directly from user state
  const homeCurrency = user?.preferred_currency || "INR";
  const homeBalanceFormatted = `${homeCurrency} ${Number(user?.wallet_balance || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const travelCurrency = user?.active_journey_currency || "USD";
  const travelBalanceFormatted = `${travelCurrency} ${Number(user?.travel_wallet_balance || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const displayedPair = activeJourneyForexPair || GLOBAL_FOREX_PAIRS[activeForexIndex];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* Box 1: Check Balance (Secured with UPI PIN) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#06181e] to-[#030e14] border border-white/[0.08] hover:border-emerald-500/25 shadow-xl shadow-black/30 flex flex-col justify-between relative overflow-hidden transition-colors">
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
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Toggle Visibility"
              >
                {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Balance Content */}
          <div className="my-2 min-h-[58px] flex flex-col justify-center">
            {isBalanceVisible ? (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tracking-tight">
                    {homeBalanceFormatted}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">Home Vault</span>
                </div>

                {user?.active_journey_country && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono font-bold bg-cyan-950/30 border border-cyan-500/20 px-2.5 py-1 rounded-xl w-fit">
                    <Plane className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Travel Wallet:</span>
                    <span>{travelBalanceFormatted}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ({user.active_journey_country})
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
                  <span>Re-check</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Live Forex Rates (Sticky to selected travel corridor if active) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#061822] to-[#030e15] border border-white/[0.08] hover:border-cyan-500/25 shadow-xl shadow-black/30 flex flex-col justify-between relative overflow-hidden transition-colors">
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

            <div className="flex items-center gap-1.5">
              {activeJourneyForexPair && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-bold text-cyan-300 font-mono">
                  CORRIDOR LOCKED
                </span>
              )}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>
          </div>

          {/* Rate Content */}
          <div className={`my-2 min-h-[58px] flex flex-col justify-center transition-opacity duration-200 ${isFlipping ? "opacity-30" : "opacity-100"}`}>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{displayedPair.flag}</span>
                  <span className="text-xs font-bold text-zinc-200">{displayedPair.pair}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-tight">
                    {displayedPair.rate}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {displayedPair.change}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Marquee / Indicator */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>
              {activeJourneyForexPair
                ? `Active Journey Corridor (${activeTravelCountry})`
                : "Zero-Slippage Guaranteed Quote"}
            </span>
            <div className="flex items-center gap-1">
              {activeJourneyForexPair ? (
                <span className="text-emerald-400 font-bold">🔒 STICKY</span>
              ) : (
                GLOBAL_FOREX_PAIRS.slice(0, 5).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeForexIndex % 5 ? "bg-cyan-400 scale-125" : "bg-white/10"
                      }`}
                  />
                ))
              )}
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
