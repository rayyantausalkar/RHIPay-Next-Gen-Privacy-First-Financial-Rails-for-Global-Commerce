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
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SupplementaryDataRouteResponse,
  CryptographicGateResponse,
  SpokeAExecutionResponse,
} from "@/types/payment";
import { executeSpokeASettlement } from "@/lib/api";
import { toast } from "sonner";

interface SpokeASettlementCardProps {
  pacs008: Pacs008MessageResponse;
  gateResult: CryptographicGateResponse;
  sender: {
    proxy_value: string;
    country_code: string;
    currency: string;
  };
  onProceedToFxSwap: (spokeARes: SpokeAExecutionResponse) => void;
  onBack: () => void;
}

export const SpokeASettlementCard: React.FC<SpokeASettlementCardProps> = ({
  pacs008,
  gateResult,
  sender,
  onProceedToFxSwap,
  onBack,
}) => {
  const [isSettling, setIsSettling] = useState<boolean>(true);
  const [settlementResult, setSettlementResult] = useState<SpokeAExecutionResponse | null>(null);

  const runSpokeASettlement = useCallback(async () => {
    setIsSettling(true);
    try {
      const res = await executeSpokeASettlement({
        uetr: pacs008.uetr,
        clearance_token: gateResult.clearance_token || "RHIPAY_CLEARANCE_DEFAULT",
        sender_proxy: sender.proxy_value,
        sender_spoke: sender.country_code,
        sender_currency: pacs008.instructed_currency,
        sender_bic: "HDFCINBBXXX",
        origin_debit_amount: pacs008.instructed_amount,
        fx_rate: pacs008.exchange_rate,
        destination_amount: pacs008.settlement_amount,
        recipient_currency: pacs008.settlement_currency,
        quote_id: pacs008.end_to_end_id,
        fx_provider_id: "DBS_GLOBAL_LIQUIDITY_DESK",
      });

      setSettlementResult(res);
      setIsSettling(false);

      toast.success("Spoke A Settlement Complete!", {
        description: `Debited ${res.amount_debited_formatted} via UPI • Double-entry balanced in ${res.settlement_latency_ms}ms`,
      });
    } catch (err: unknown) {
      setIsSettling(false);
      const msg = err instanceof Error ? err.message : "Spoke A settlement failed";
      toast.error(msg);
    }
  }, [gateResult.clearance_token, pacs008.end_to_end_id, pacs008.exchange_rate, pacs008.instructed_amount, pacs008.instructed_currency, pacs008.settlement_amount, pacs008.settlement_currency, pacs008.uetr, sender.country_code, sender.proxy_value]);

  useEffect(() => {
    runSpokeASettlement();
  }, [runSpokeASettlement]);

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
            Spoke A Settlement Engine
          </span>
        </div>
      </div>

      {isSettling ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Posting Double-Entry Debit & Credit Entries</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Debiting Sender Commercial Bank • Crediting FXP Domestic Pool</p>
          </div>
        </div>
      ) : settlementResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Verification Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Spoke A Settlement Cleared (1st Leg)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {settlementResult.home_ips_reference} ({settlementResult.settlement_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              SETTLED
            </span>
          </div>

          {/* Amount Settled & Rail Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Home IPS Real-Time Rail
              </span>
              <span className="text-emerald-400 font-mono text-[10px] font-bold">
                UPI (India Spoke A)
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-zinc-400 font-medium">Domestic Amount Debited:</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                {settlementResult.amount_debited_formatted}
              </span>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between">
              <span>Minor Units Accounted:</span>
              <span className="text-zinc-300 font-bold">{settlementResult.amount_debited_cents.toLocaleString()} paise</span>
            </div>
          </div>

          {/* Double-Entry Ledger Journal Audit Table */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Double-Entry Journal Postings</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Balanced (Δ = 0)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {settlementResult.journal_entries.map((entry) => {
                const isDebit = entry.entry_type === "DEBIT";
                return (
                  <div
                    key={entry.entry_id}
                    className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-1 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isDebit ? (
                          <div className="w-5 h-5 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                            <ArrowUpRight className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <ArrowDownLeft className="w-3 h-3" />
                          </div>
                        )}
                        <span className="font-bold text-white truncate max-w-[170px]">
                          {entry.account_name}
                        </span>
                      </div>

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
                      <span>Balance Post-Entry:</span>
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
              toast.success("Spoke A Completed! Proceeding to Step 16: FX Nexus Pool Real-Time Swap");
              onProceedToFxSwap(settlementResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to FX Nexus Pool Swap</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
