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
  Check,
  Coins,
  Globe2,
  UserCheck,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  AtomicFxSwapResponse,
  SpokeBExecutionResponse,
  ProxyResolutionResponse,
} from "@/types/payment";
import { executeSpokeBSettlement } from "@/lib/api";
import { toast } from "sonner";

interface SpokeBSettlementCardProps {
  pacs008: Pacs008MessageResponse;
  swapResult: AtomicFxSwapResponse;
  recipient: ProxyResolutionResponse;
  onProceedToPacs002: (spokeBRes: SpokeBExecutionResponse) => void;
  onBack: () => void;
}

export const SpokeBSettlementCard: React.FC<SpokeBSettlementCardProps> = ({
  pacs008,
  swapResult,
  recipient,
  onProceedToPacs002,
  onBack,
}) => {
  const [isSettling, setIsSettling] = useState<boolean>(true);
  const [settlementResult, setSettlementResult] = useState<SpokeBExecutionResponse | null>(null);

  const runSpokeBSettlement = useCallback(async () => {
    setIsSettling(true);
    try {
      const res = await executeSpokeBSettlement({
        uetr: pacs008.uetr,
        swap_id: swapResult.swap_id,
        quote_id: pacs008.end_to_end_id,
        recipient_proxy: recipient.proxy_value,
        recipient_spoke: recipient.destination_country,
        recipient_currency: recipient.destination_currency,
        recipient_bic: recipient.destination_bic,
        recipient_name: recipient.masked_legal_name,
        destination_amount: Number(pacs008.settlement_amount),
        destination_amount_cents: Math.round(Number(pacs008.settlement_amount) * 100),
        fx_provider_id: "DBS_GLOBAL_LIQUIDITY_DESK",
      });

      setSettlementResult(res);
      setIsSettling(false);

      toast.success("Spoke B Settlement Complete!", {
        description: `Credited ${res.amount_credited_formatted} to ${recipient.masked_legal_name} via PayNow in ${res.settlement_latency_ms}ms`,
      });
    } catch (err: unknown) {
      setIsSettling(false);
      const msg = err instanceof Error ? err.message : "Spoke B settlement failed";
      toast.error(msg);
    }
  }, [pacs008.end_to_end_id, pacs008.settlement_amount, pacs008.uetr, recipient.destination_bic, recipient.destination_country, recipient.destination_currency, recipient.masked_legal_name, recipient.proxy_value, swapResult.swap_id]);

  useEffect(() => {
    runSpokeBSettlement();
  }, [runSpokeBSettlement]);

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
            Spoke B Settlement Engine
          </span>
        </div>
      </div>

      {isSettling ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Disbursing Instant Local Fiat on Host IPS</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Debiting Foreign FX Pool • Crediting Recipient Checking Account</p>
          </div>
        </div>
      ) : settlementResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Spoke B Settlement Cleared (2nd Leg)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {settlementResult.host_ips_reference} ({settlementResult.settlement_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              DISBURSED
            </span>
          </div>

          {/* Amount Delivered & Host Rail Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Host IPS Real-Time Rail
              </span>
              <span className="text-emerald-400 font-mono text-[10px] font-bold">
                PayNow (Singapore Spoke B)
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-zinc-400 font-medium">Local Fiat Credited:</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                {settlementResult.amount_credited_formatted}
              </span>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between pt-1 border-t border-white/[0.03]">
              <span>Beneficiary Account:</span>
              <span className="text-zinc-200 font-bold truncate max-w-[180px]">{recipient.masked_legal_name}</span>
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
              toast.success("Spoke B Completed! Proceeding to Step 18: ISO 20022 pacs.002 Settlement Confirmation");
              onProceedToPacs002(settlementResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to pacs.002 Confirmation</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
