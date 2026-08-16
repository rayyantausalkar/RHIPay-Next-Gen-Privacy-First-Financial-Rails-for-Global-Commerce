"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  Layers,
  Sparkles,
  Zap,
  Check,
  Globe2,
  FileText,
  UserCheck,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Bug,
  Scale,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  EnclaveDecryptionResponse,
  SanctionsScreeningResponse,
} from "@/types/payment";
import { screenSanctionsIdentity } from "@/lib/api";
import { toast } from "sonner";

interface SanctionsScreeningCardProps {
  pacs008: Pacs008MessageResponse;
  enclaveResult: EnclaveDecryptionResponse;
  onProceedToNullifierInscription: (screeningRes: SanctionsScreeningResponse) => void;
  onBack: () => void;
}

export const SanctionsScreeningCard: React.FC<SanctionsScreeningCardProps> = ({
  pacs008,
  enclaveResult,
  onProceedToNullifierInscription,
  onBack,
}) => {
  const [isScreening, setIsScreening] = useState<boolean>(true);
  const [screeningResult, setScreeningResult] = useState<SanctionsScreeningResponse | null>(null);
  const [isSimulatingSanctionHit, setIsSimulatingSanctionHit] = useState<boolean>(false);

  const runSanctionsScreening = useCallback(async (simulatedName?: string) => {
    setIsScreening(true);
    try {
      const res = await screenSanctionsIdentity({
        uetr: pacs008.uetr,
        originator_name: simulatedName || enclaveResult.originator_name,
        originator_proxy: enclaveResult.originator_proxy,
        originator_national_id: enclaveResult.originator_national_id,
        originator_country: "IN",
        beneficiary_name: enclaveResult.beneficiary_name,
        beneficiary_proxy: enclaveResult.beneficiary_proxy,
        beneficiary_country: "SG",
        transaction_amount: pacs008.settlement_amount || 45.0,
        currency: pacs008.settlement_currency || "SGD",
        screening_profile: "STRICT_GLOBAL_WATCHLISTS",
      });

      setScreeningResult(res);
      setIsScreening(false);

      if (res.is_cleared) {
        toast.success("Automated Real-Time Sanctions Screening Passed!", {
          description: `Zero watchlists hits • Log ID: ${res.audit_log_id}`,
        });
      } else {
        toast.error("SANCTIONS ALERT: Watchlist Match Triggered!", {
          description: "Entity blocked by statutory compliance rules",
        });
      }
    } catch (err: unknown) {
      setIsScreening(false);
      const msg = err instanceof Error ? err.message : "Sanctions screening failed";
      toast.error(msg);
    }
  }, [enclaveResult.beneficiary_name, enclaveResult.beneficiary_proxy, enclaveResult.originator_name, enclaveResult.originator_national_id, enclaveResult.originator_proxy, pacs008.settlement_amount, pacs008.settlement_currency, pacs008.uetr]);

  useEffect(() => {
    runSanctionsScreening();
  }, [runSanctionsScreening]);

  const handleSimulateHitToggle = () => {
    if (!isSimulatingSanctionHit) {
      setIsSimulatingSanctionHit(true);
      runSanctionsScreening("SANCTIONED_TARGET_INDIVIDUAL_OFAC");
    } else {
      setIsSimulatingSanctionHit(false);
      runSanctionsScreening();
    }
  };

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
            AML Watchlist Engine
          </span>
        </div>
      </div>

      {isScreening ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Screening Multi-Jurisdictional Watchlists</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">OFAC, UN, MAS, EU & PEP Real-Time Matching</p>
          </div>
        </div>
      ) : screeningResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              screeningResult.is_cleared
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/25 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {screeningResult.is_cleared ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {screeningResult.overall_verdict === "CLEARED_PASS"
                    ? "Sanctions Screening Passed"
                    : "Sanctions Alert: Blocked"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {screeningResult.risk_tier} ({screeningResult.screening_latency_ms}ms)
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                screeningResult.is_cleared
                  ? "bg-emerald-500 text-black"
                  : "bg-rose-500 text-white"
              }`}
            >
              {screeningResult.overall_verdict}
            </span>
          </div>

          {/* Watchlist Screening Matrix Breakdown */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Watchlist Register Verification</span>
              <span className="text-emerald-400 font-mono font-bold">Vector Similarity</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {screeningResult.watchlist_breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-black/60 border border-white/[0.04] space-y-0.5 min-w-0"
                >
                  <span className="text-[9px] text-zinc-500 block truncate">
                    {item.list_name.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold truncate ${
                        item.status === "CLEARED" ? "text-emerald-400" : "text-rose-400 font-extrabold"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {Math.round(item.similarity_score * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Audit Seal & PEP Status */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <span>Cryptographic Audit Seal</span>
              <span>SHA-256 Chained</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Audit Log ID:</span>
                <span className="text-white font-bold">{screeningResult.audit_log_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Seal Digest:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[190px]">
                  {screeningResult.audit_seal_hash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">PEP Detection:</span>
                <span className="text-white font-semibold">
                  {screeningResult.pep_screening.is_pep ? "FLAGGED" : "NEGATIVE (Zero Exposure)"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Sanctions Hit Simulator */}
          <button
            type="button"
            onClick={handleSimulateHitToggle}
            className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Bug className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">
              {isSimulatingSanctionHit ? "Reset to Clean User" : "Simulate Sanctioned Entity Alert (Test AML Block)"}
            </span>
          </button>

          {/* Primary Action Button */}
          {screeningResult.is_cleared ? (
            <button
              type="button"
              onClick={() => {
                toast.success("Sanctions Cleared! Proceeding to Step 21: Nullifier State Permanent Inscription");
                onProceedToNullifierInscription(screeningResult);
              }}
              className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span className="truncate">Proceed to Nullifier Inscription</span>
              <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              Payment Clearing Halted: Sanctions Hit Requires Statutory Compliance Review
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
