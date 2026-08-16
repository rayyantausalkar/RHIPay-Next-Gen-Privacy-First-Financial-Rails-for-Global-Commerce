"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Building2,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowDownUp,
} from "lucide-react";
import {
  FXQuoteResponse,
  ProxyResolutionResponse,
} from "@/types/payment";
import { lockFXQuote } from "@/lib/api";
import { toast } from "sonner";

interface FXQuoteLockCardProps {
  initialQuote: FXQuoteResponse;
  recipient: ProxyResolutionResponse;
  senderCurrency: string;
  senderCountry: string;
  onProceedToZKP: (quote: FXQuoteResponse) => void;
  onBack: () => void;
}

export const FXQuoteLockCard: React.FC<FXQuoteLockCardProps> = ({
  initialQuote,
  recipient,
  senderCurrency,
  senderCountry,
  onProceedToZKP,
  onBack,
}) => {
  const [quote, setQuote] = useState<FXQuoteResponse>(initialQuote);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    initialQuote.ttl_remaining_seconds || 60
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // 60-Second TTL Countdown Timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          toast.warning("FX Quote expired! Please refresh to re-lock rate.", { id: "fx-exp" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Re-lock Rate Action
  const handleRelockRate = async () => {
    setIsRefreshing(true);
    try {
      toast.loading("Fetching fresh guaranteed FX quote from liquidity desk...", { id: "relock" });
      const newQuote = await lockFXQuote({
        origin_currency: senderCurrency,
        destination_currency: recipient.destination_currency,
        destination_amount: Number(quote.destination_amount),
        sender_spoke: senderCountry,
        recipient_spoke: recipient.destination_country,
        ttl_seconds: 60,
      });

      setQuote(newQuote);
      setSecondsRemaining(newQuote.ttl_remaining_seconds || 60);
      setIsExpired(false);
      toast.dismiss("relock");
      toast.success("New Guaranteed Rate Locked for 60s!");
    } catch {
      toast.dismiss("relock");
      toast.error("Failed to re-lock rate. Please retry.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400 font-mono">
            Guaranteed FX Rate Lock
          </span>
        </div>
      </div>

      {/* Live 60-Second Timer Bar */}
      <div className="mt-3.5 sm:mt-4 p-3 sm:p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.08] relative overflow-hidden">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium truncate">
            <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isExpired ? "text-rose-400" : "text-emerald-400"}`} />
            <span className="truncate">
              {isExpired ? "Quote Expired" : `Guaranteed for ${formatTime(secondsRemaining)}`}
            </span>
          </div>

          <button
            onClick={handleRelockRate}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors active:scale-95 flex-shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Re-lock</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsRemaining <= 10
                ? "bg-rose-500"
                : secondsRemaining <= 25
                ? "bg-amber-400"
                : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Zero Slippage Guarantee Badge */}
      <div className="mt-3 sm:mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
        <div className="text-left min-w-0">
          <div className="text-xs font-bold text-white truncate">
            BIS Nexus Zero-Slippage Commitment
          </div>
          <div className="text-[10px] text-emerald-300/80 truncate">
            Guaranteed execution. No hidden fees or rate adjustments.
          </div>
        </div>
      </div>

      {/* Hero Exchange Comparison Card */}
      <div className="mt-3.5 sm:mt-4 p-4 sm:p-5 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-3 sm:space-y-4">
        {/* Origin Payer Debit */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5 truncate">
              You Pay (Debited from {senderCountry} IPS)
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-white font-mono tracking-tight truncate">
              {Number(quote.origin_debit_amount).toFixed(quote.origin_decimals ?? 2)}{" "}
              <span className="text-xs sm:text-sm font-bold text-emerald-400">{quote.origin_currency}</span>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-zinc-400 flex-shrink-0">
            Spoke A
          </div>
        </div>

        {/* Divider with Arrow Icon */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="border-t border-white/[0.08] w-full" />
          <div className="absolute p-1 sm:p-1.5 rounded-full bg-zinc-900 border border-white/10 text-emerald-400">
            <ArrowDownUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>

        {/* Destination Recipient Credit */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5 truncate">
              Payee Receives ({recipient.destination_country} • {recipient.masked_legal_name})
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-white font-mono tracking-tight truncate">
              {Number(quote.destination_amount).toFixed(quote.destination_decimals ?? 2)}{" "}
              <span className="text-xs sm:text-sm font-bold text-emerald-400">{quote.destination_currency}</span>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-zinc-400 flex-shrink-0">
            Spoke B
          </div>
        </div>
      </div>

      {/* Rate Breakdown & Liquidity Provider Details */}
      <div className="mt-3.5 sm:mt-4 p-3 sm:p-4 rounded-2xl bg-zinc-950/60 border border-white/[0.06] space-y-2 text-xs">
        <div className="flex items-center justify-between text-zinc-300 gap-2">
          <span className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Rate:
          </span>
          <span className="font-mono font-bold text-white truncate text-right">
            1 {quote.destination_currency} = {Number(quote.fx_rate).toFixed(6)} {quote.origin_currency}
          </span>
        </div>

        <div className="flex items-center justify-between text-zinc-300 gap-2">
          <span className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            LP Desk:
          </span>
          <span className="font-medium text-zinc-200 truncate text-right">
            {quote.fx_provider_name}
          </span>
        </div>

        <div className="flex items-center justify-between text-zinc-300">
          <span className="text-zinc-400">Transparent Spread:</span>
          <span className="font-mono text-emerald-400">
            {quote.fx_markup_bps} bps (0.05%)
          </span>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500 gap-2">
          <span className="flex-shrink-0">Quote ID:</span>
          <span className="truncate text-right">{quote.quote_id}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 sm:mt-5 space-y-2">
        {isExpired ? (
          <button
            type="button"
            onClick={handleRelockRate}
            disabled={isRefreshing}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Quote Expired — Re-Lock Fresh Rate</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              toast.success("Rate Confirmed! Ready for ZK Proof Generation");
              onProceedToZKP(quote);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Lock Rate & Proceed to ZK Proof (&lt;1.2s)</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
