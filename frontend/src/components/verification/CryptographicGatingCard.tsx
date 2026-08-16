"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  Cpu,
  KeyRound,
  Layers,
  Bug,
  Sparkles,
  Zap,
  Flame,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SupplementaryDataRouteResponse,
  MerkleRootValidateResponse,
  Groth16VerifyResponse,
  NullifierRegistryCheckResponse,
  CryptographicGateResponse,
} from "@/types/payment";
import { evaluateCryptographicGate } from "@/lib/api";
import { toast } from "sonner";

interface CryptographicGatingCardProps {
  pacs008: Pacs008MessageResponse;
  routeData: SupplementaryDataRouteResponse;
  merkleData: MerkleRootValidateResponse;
  zkResult: Groth16VerifyResponse;
  nullifierCheck: NullifierRegistryCheckResponse;
  onProceedToLedgerSettlement: (gateResult: CryptographicGateResponse) => void;
  onBack: () => void;
}

export const CryptographicGatingCard: React.FC<CryptographicGatingCardProps> = ({
  pacs008,
  routeData,
  merkleData,
  zkResult,
  nullifierCheck,
  onProceedToLedgerSettlement,
  onBack,
}) => {
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [gateResult, setGateResult] = useState<CryptographicGateResponse | null>(null);

  // Simulated override state for fail-safe testing
  const [simulatedFailGate, setSimulatedFailGate] = useState<"none" | "proof" | "root" | "nullifier">("none");

  const runGateEvaluation = useCallback(async (failGate: "none" | "proof" | "root" | "nullifier") => {
    setIsValidating(true);
    try {
      const payload = {
        uetr: pacs008.uetr,
        message_id: pacs008.message_id,
        quote_id: pacs008.end_to_end_id || "quote-001",
        proof_validity: failGate === "proof" ? false : zkResult.is_valid,
        root_consistency: failGate === "root" ? false : merkleData.is_valid,
        nullifier_uniqueness: failGate === "nullifier" ? false : nullifierCheck.is_fresh,
        kyc_tier_satisfied: true,
        envelope_integrity: true,
        merkle_root: merkleData.merkle_root,
        nullifier_hash: nullifierCheck.nullifier_hash,
      };

      const res = await evaluateCryptographicGate(payload);
      setGateResult(res);
      setIsValidating(false);

      if (res.gate_approved) {
        toast.success("Cryptographic Gating Approved!", {
          description: `Clearance token signed (${res.evaluation_latency_ms}ms). Downstream ledger unlocked.`,
        });
      } else {
        toast.error("Fail-Safe Security Trip Activated!", {
          description: res.rejection_reasons[0] || "Execution terminated before funds touched.",
        });
      }
    } catch (err: unknown) {
      setIsValidating(false);
      const msg = err instanceof Error ? err.message : "Gate evaluation failed";
      toast.error(msg);
    }
  }, [merkleData.is_valid, merkleData.merkle_root, nullifierCheck.is_fresh, nullifierCheck.nullifier_hash, pacs008.end_to_end_id, pacs008.message_id, pacs008.uetr, zkResult.is_valid]);

  useEffect(() => {
    runGateEvaluation(simulatedFailGate);
  }, [runGateEvaluation, simulatedFailGate]);

  const handleToggleFailSafe = (gate: "proof" | "root" | "nullifier") => {
    const next = simulatedFailGate === gate ? "none" : gate;
    setSimulatedFailGate(next);
    if (next !== "none") {
      toast.warning(`Simulating Fail-Safe Trip on: ${gate.toUpperCase()}`);
    } else {
      toast.info("Restored all cryptographic predicates to genuine verified state");
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
            Fail-Safe Gate Evaluator
          </span>
        </div>
      </div>

      {isValidating ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Evaluating 3-Predicate Logic Gate</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Proof ∧ Root ∧ Nullifier ⟹ Clearance Token</p>
          </div>
        </div>
      ) : gateResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Verification Hero Badge */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              gateResult.gate_approved
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {gateResult.gate_approved ? (
                <Unlock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Flame className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {gateResult.gate_approved
                    ? "Cryptographic Clearance Granted"
                    : "Fail-Safe Boundary Tripped"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {gateResult.clearance_status} ({gateResult.evaluation_latency_ms}ms)
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                gateResult.gate_approved
                  ? "bg-emerald-500 text-black"
                  : "bg-rose-500 text-white"
              }`}
            >
              {gateResult.gate_approved ? "UNLOCKED" : "BLOCKED"}
            </span>
          </div>

          {/* 3-Predicate Logic Gate AND Matrix */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span>Atomic 3-Predicate Logic Gate</span>
              <span className="text-emerald-400 font-mono text-[10px]">Fail-Safe Active</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* Predicate 1: Groth16 Proof */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">1. Groth16 Proof (BN254)</span>
                </div>
                <span className={gateResult.gate_checks.proof_validity ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {gateResult.gate_checks.proof_validity ? "TRUE (VALID)" : "FALSE (FAIL)"}
                </span>
              </div>

              {/* Predicate 2: Merkle Root */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">2. Poseidon Merkle Root</span>
                </div>
                <span className={gateResult.gate_checks.root_consistency ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {gateResult.gate_checks.root_consistency ? "TRUE (MATCH)" : "FALSE (FAIL)"}
                </span>
              </div>

              {/* Predicate 3: Anti-Replay Nullifier */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/60 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">3. Anti-Replay Nullifier</span>
                </div>
                <span className={gateResult.gate_checks.nullifier_uniqueness ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {gateResult.gate_checks.nullifier_uniqueness ? "TRUE (UNSPENT)" : "FALSE (REPLAY)"}
                </span>
              </div>
            </div>

            {/* Clearance Token Badge */}
            {gateResult.gate_approved && gateResult.clearance_token && (
              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Signed Clearance Token
                </span>
                <div className="p-2 rounded-xl bg-black border border-emerald-500/30 text-[10px] font-mono text-emerald-400 break-all select-all">
                  {gateResult.clearance_token}
                </div>
              </div>
            )}

            {/* Rejection Reason if Tripped */}
            {!gateResult.gate_approved && gateResult.rejection_reasons.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Fail-Safe Termination:
                </span>
                <p className="text-[11px] font-mono">{gateResult.rejection_reasons[0]}</p>
              </div>
            )}
          </div>

          {/* Interactive Fail-Safe Testing Controls */}
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Test Security Boundary (Simulate Single-Point Failure):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleToggleFailSafe("proof")}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-colors active:scale-95 ${
                  simulatedFailGate === "proof"
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white border-white/[0.06]"
                }`}
              >
                Trip Proof
              </button>

              <button
                type="button"
                onClick={() => handleToggleFailSafe("root")}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-colors active:scale-95 ${
                  simulatedFailGate === "root"
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white border-white/[0.06]"
                }`}
              >
                Trip Root
              </button>

              <button
                type="button"
                onClick={() => handleToggleFailSafe("nullifier")}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-colors active:scale-95 ${
                  simulatedFailGate === "nullifier"
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-white/[0.03] text-zinc-400 hover:text-white border-white/[0.06]"
                }`}
              >
                Trip Nullifier
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!gateResult.gate_approved}
            onClick={() => {
              toast.success("Clearance Token Verified! Proceeding to Core Double-Entry Ledger Settlement");
              onProceedToLedgerSettlement(gateResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Double-Entry Ledger Settlement</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
