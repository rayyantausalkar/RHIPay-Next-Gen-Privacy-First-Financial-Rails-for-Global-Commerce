"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  Layers,
  Scale,
  Sparkles,
  Zap,
  Lock,
  ArrowLeftRight,
  Check,
  Coins,
  Globe2,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SpokeAExecutionResponse,
  AtomicFxSwapResponse,
} from "@/types/payment";
import { executeAtomicFxSwap } from "@/lib/api";
import { toast } from "sonner";

interface AtomicFxSwapCardProps {
  pacs008: Pacs008MessageResponse;
  spokeAResult: SpokeAExecutionResponse;
  onProceedToSpokeB: (swapRes: AtomicFxSwapResponse) => void;
  onBack: () => void;
}

export const AtomicFxSwapCard: React.FC<AtomicFxSwapCardProps> = ({
  pacs008,
  spokeAResult,
  onProceedToSpokeB,
  onBack,
}) => {
  const [isSwapping, setIsSwapping] = useState<boolean>(true);
  const [swapResult, setSwapResult] = useState<AtomicFxSwapResponse | null>(null);

  const runAtomicFxSwap = useCallback(async () => {
    setIsSwapping(true);
    try {
      const res = await executeAtomicFxSwap({
        uetr: pacs008.uetr,
        settlement_id: spokeAResult.settlement_id,
        quote_id: pacs008.end_to_end_id,
        origin_currency: pacs008.instructed_currency,
        origin_amount_cents: spokeAResult.amount_debited_cents,
        destination_currency: pacs008.settlement_currency,
        destination_amount_cents: Math.round(pacs008.settlement_amount * 100),
        fx_rate: pacs008.exchange_rate,
        fx_provider_id: "DBS_GLOBAL_LIQUIDITY_DESK",
      });

      setSwapResult(res);
      setIsSwapping(false);

      toast.success("Atomic FX Swap Executed!", {
        description: `PvP Atomic Commit Completed • Herstatt Risk Eliminated in ${res.atomic_execution_latency_ms}ms`,
      });
    } catch (err: unknown) {
      setIsSwapping(false);
      const msg = err instanceof Error ? err.message : "Atomic FX swap failed";
      toast.error(msg);
    }
  }, [pacs008.end_to_end_id, pacs008.exchange_rate, pacs008.instructed_currency, pacs008.settlement_amount, pacs008.settlement_currency, pacs008.uetr, spokeAResult.amount_debited_cents, spokeAResult.settlement_id]);

  useEffect(() => {
    runAtomicFxSwap();
  }, [runAtomicFxSwap]);

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
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
            Nexus FX Bilateral Bridge
          </span>
        </div>
      </div>

      {isSwapping ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Executing Indivisible Atomic Cross-Currency Swap</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Enforcing PvP All-or-Nothing Commit Invariant</p>
          </div>
        </div>
      ) : swapResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Atomic Cross-Currency Swap Committed
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {swapResult.swap_id} ({swapResult.atomic_execution_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              PvP LOCKED
            </span>
          </div>

          {/* Herstatt Risk Elimination Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Herstatt Risk: 100% Eliminated
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  Payment-versus-Payment (PvP) Atomic Commit
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold flex-shrink-0">
              <Check className="w-3 h-3" /> ZERO RISK
            </span>
          </div>

          {/* Bilateral Inflow & Outflow Visualizer */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Bilateral Liquidity Bridge
              </span>
              <span className="text-emerald-400 font-mono text-[10px] font-bold">
                {swapResult.fx_provider_id}
              </span>
            </div>

            {/* Inflow vs Outflow Columns */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Domestic Inflow (Spoke A)
                </span>
                <div className="text-sm font-mono font-bold text-emerald-400">
                  +{swapResult.origin_inflow_formatted}
                </div>
                <span className="text-[9px] text-zinc-400 block font-mono">
                  Credited to India Pool
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Foreign Outflow (Spoke B)
                </span>
                <div className="text-sm font-mono font-bold text-emerald-300">
                  -{swapResult.destination_outflow_formatted}
                </div>
                <span className="text-[9px] text-zinc-400 block font-mono">
                  Earmarked for Singapore
                </span>
              </div>
            </div>

            {/* Guaranteed Conversion Rate Badge */}
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Fixed Conversion Rate:</span>
              <span className="text-white font-bold">
                1 SGD = {swapResult.effective_fx_rate.toFixed(4)} INR
              </span>
            </div>
          </div>

          {/* Double-Entry Swap Journal Postings */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atomic Swap Ledger Postings</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Balanced
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {swapResult.journal_entries.map((entry) => {
                const isDebit = entry.entry_type === "DEBIT";
                return (
                  <div
                    key={entry.entry_id}
                    className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-1 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[190px]">
                        {entry.account_name}
                      </span>
                      <span
                        className={`font-bold ${
                          isDebit ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {isDebit ? "-" : "+"}
                        {entry.currency} {(entry.amount_cents / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-white/[0.03]">
                      <span>Pool Balance Post-Swap:</span>
                      <span className="text-zinc-400">
                        {entry.currency} {(entry.balance_after_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("FX Swap Committed! Proceeding to Step 17: Spoke B Destination IPS Clearing");
              onProceedToSpokeB(swapResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Coins className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Spoke B Execution</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
