"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Scale,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Building2,
  Landmark,
  ShieldCheck,
  Binary,
  Sparkles,
  Zap,
  Check,
  FileSpreadsheet,
  Globe2,
  Lock,
  Boxes,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SanctionsScreeningResponse,
  LedgerCommitmentResponse,
} from "@/types/payment";
import { commitDoubleEntryLedger } from "@/lib/api";
import { toast } from "sonner";

interface DoubleEntryCommitmentCardProps {
  pacs008: Pacs008MessageResponse;
  screeningResult: SanctionsScreeningResponse;
  onProceedToNullifierInscription: (commitmentRes: LedgerCommitmentResponse) => void;
  onBack: () => void;
}

export const DoubleEntryCommitmentCard: React.FC<DoubleEntryCommitmentCardProps> = ({
  pacs008,
  screeningResult,
  onProceedToNullifierInscription,
  onBack,
}) => {
  const [isCommitting, setIsCommitting] = useState<boolean>(true);
  const [commitmentResult, setCommitmentResult] = useState<LedgerCommitmentResponse | null>(null);

  const runLedgerCommitment = useCallback(async () => {
    setIsCommitting(true);
    try {
      const res = await commitDoubleEntryLedger({
        uetr: pacs008.uetr,
        quote_id: "RHIPAY-FXQ-DBS-LOCKED",
        sender_proxy: "+919876543210",
        sender_spoke: "IN",
        sender_currency: pacs008.instructed_currency || "INR",
        recipient_proxy: "+6591234567",
        recipient_spoke: "SG",
        recipient_currency: pacs008.settlement_currency || "SGD",
        origin_debit_amount: pacs008.instructed_amount || 2835.0,
        destination_credit_amount: pacs008.settlement_amount || 45.0,
        fx_rate: pacs008.exchange_rate || 63.0,
        screening_id: screeningResult.screening_id,
      });

      setCommitmentResult(res);
      setIsCommitting(false);

      toast.success("Double-Entry Ledger Inscription Committed!", {
        description: `Zero-sum invariant verified • Height #${res.ledger_block_height}`,
      });
    } catch (err: unknown) {
      setIsCommitting(false);
      const msg = err instanceof Error ? err.message : "Ledger commitment failed";
      toast.error(msg);
    }
  }, [pacs008.exchange_rate, pacs008.instructed_amount, pacs008.instructed_currency, pacs008.settlement_amount, pacs008.settlement_currency, pacs008.uetr, screeningResult.screening_id]);

  useEffect(() => {
    runLedgerCommitment();
  }, [runLedgerCommitment]);

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
            Zero-Sum Ledger Engine
          </span>
        </div>
      </div>

      {isCommitting ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Inscribing Balanced Double-Entry Journals</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Enforcing Continuous Zero-Sum Ledger Invariant</p>
          </div>
        </div>
      ) : commitmentResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Double-Entry Ledger Committed
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  Block #{commitmentResult.ledger_block_height} ({commitmentResult.commitment_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              {commitmentResult.status}
            </span>
          </div>

          {/* 4-Leg Double Entry Audit Journal Table */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Balanced Journal Entries (4 Legs)</span>
              <span className="text-emerald-400 font-mono font-bold">Integer Minor Units</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {commitmentResult.journal_entries.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          entry.entry_type === "DEBIT"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {entry.entry_type}
                      </span>
                      <span className="text-xs text-white font-medium truncate">
                        {entry.account_name}
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
                      {entry.account_id}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-bold block ${
                        entry.entry_type === "DEBIT" ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {entry.entry_type === "DEBIT" ? "-" : "+"}
                      {entry.currency} {(entry.amount_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {entry.amount_cents.toLocaleString()} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zero-Sum Invariant & Chained Block Root */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <span>Zero-Sum Invariant & State Root</span>
              <span className="text-emerald-400">Δ = 0.00</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Currency Deltas:</span>
                <span className="text-white font-bold">
                  INR: {commitmentResult.currency_balances_delta.INR?.toFixed(2) || "0.00"} • SGD: {commitmentResult.currency_balances_delta.SGD?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Commitment Hash:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[190px]">
                  {commitmentResult.commitment_hash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">State Merkle Root:</span>
                <span className="text-zinc-300 font-bold truncate max-w-[190px]">
                  {commitmentResult.ledger_state_merkle_root}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Ledger Committed! Proceeding to Step 22: Nullifier State Permanent Inscription");
              onProceedToNullifierInscription(commitmentResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Boxes className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Nullifier Inscription</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
