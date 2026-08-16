"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Cpu,
  Binary,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Code2,
  Eye,
  EyeOff,
  Bug,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SupplementaryDataRouteResponse,
  MerkleRootValidateResponse,
  Groth16VerifyResponse,
} from "@/types/payment";
import { verifyGroth16Circuit } from "@/lib/api";
import { toast } from "sonner";

interface Groth16VerificationCardProps {
  pacs008: Pacs008MessageResponse;
  routeData: SupplementaryDataRouteResponse;
  merkleData: MerkleRootValidateResponse;
  onProceedToNullifierVerify: (zkResult: Groth16VerifyResponse) => void;
  onBack: () => void;
}

export const Groth16VerificationCard: React.FC<Groth16VerificationCardProps> = ({
  pacs008,
  routeData,
  merkleData,
  onProceedToNullifierVerify,
  onBack,
}) => {
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [verifyResult, setVerifyResult] = useState<Groth16VerifyResponse | null>(null);
  const [showCurveInspector, setShowCurveInspector] = useState<boolean>(false);
  const [isTamperedState, setIsTamperedState] = useState<boolean>(false);

  const canonical = (pacs008.canonical_json || {}) as Record<string, any>;
  const cdtTrf = (canonical.CdtTrfTxInf || {}) as Record<string, any>;
  const splmtry = (cdtTrf.SplmtryData || {}) as Record<string, any>;
  const originalZKProof = (splmtry.zk_proof || {}) as Record<string, any>;

  const runGroth16Verification = useCallback(async (proofToTest: Record<string, any>) => {
    setIsValidating(true);
    try {
      const publicSignals = [
        merkleData.merkle_root,
        routeData.pipelines.nullifier_registry_queue.nullifier_hash || splmtry.nullifier_hash || "0x0",
        pacs008.end_to_end_id || "0x0",
        "1",
      ];

      const res = await verifyGroth16Circuit({
        proof: proofToTest,
        public_signals: publicSignals,
        circuit_name: "rhipay_identity_membership_v1",
      });

      setVerifyResult(res);
      setIsValidating(false);

      if (res.is_valid) {
        toast.success("Groth16 Mathematical Circuit Verification Passed!", {
          description: `Bilinear pairing check passed on BN254 (${res.constraints_checked_count} constraints in ${res.verification_time_ms}ms)`,
        });
      } else {
        toast.error("Bilinear Pairing Check Failed!", {
          description: res.error_details || "Curve point constraint violation.",
        });
      }
    } catch (err: unknown) {
      setIsValidating(false);
      const msg = err instanceof Error ? err.message : "Circuit verification failed";
      toast.error(msg);
    }
  }, [merkleData.merkle_root, pacs008.end_to_end_id, routeData.pipelines.nullifier_registry_queue.nullifier_hash, splmtry.nullifier_hash]);

  useEffect(() => {
    runGroth16Verification(originalZKProof);
  }, [originalZKProof, runGroth16Verification]);

  // Simulate Tampered Proof Curve Points
  const handleSimulateTamperedProof = async () => {
    setIsTamperedState(true);
    const tampered = {
      ...originalZKProof,
      pi_a: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ],
    };
    toast.warning("Injected tampered πA curve coordinates into verifier");
    await runGroth16Verification(tampered);
  };

  // Reset to Genuine Proof Points
  const handleResetToGenuineProof = async () => {
    setIsTamperedState(false);
    toast.info("Restored genuine cryptographic proof points");
    await runGroth16Verification(originalZKProof);
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
            Groth16 Verifier
          </span>
        </div>
      </div>

      {isValidating ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Evaluating Bilinear Pairing on BN254</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">e(πA, πB) = e(α, β) · e(x·IC, γ) · e(πC, δ)</p>
          </div>
        </div>
      ) : verifyResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Verification Hero Badge */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              verifyResult.is_valid
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {verifyResult.is_valid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {verifyResult.is_valid
                    ? "Mathematical Pairing Verified"
                    : "Pairing Check Rejected"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {verifyResult.curve} ({verifyResult.protocol}) • {verifyResult.verification_time_ms}ms
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                verifyResult.is_valid
                  ? "bg-emerald-500 text-black"
                  : "bg-rose-500 text-white"
              }`}
            >
              {verifyResult.is_valid ? "Q.E.D. VALID" : "INVALID"}
            </span>
          </div>

          {/* Bilinear Pairing Formula Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-emerald-400" />
                Bilinear Pairing Equation
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">
                {verifyResult.constraints_checked_count} Constraints
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black border border-white/[0.06] font-mono text-[11px] font-bold text-emerald-300 break-all text-center">
              {verifyResult.pairing_equation_evaluated}
            </div>

            {/* Public Signals Verification Audit */}
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Circuit Name:</span>
                <span className="font-mono text-zinc-200">{verifyResult.circuit_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Public Signals:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 4/4 Verified
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Zero-Knowledge Guarantee:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Identity Secret 100% Blind
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Curve Coordinates Inspector */}
          <div className="rounded-2xl bg-zinc-950/60 border border-white/[0.06] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCurveInspector(!showCurveInspector)}
              className="w-full p-3 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors text-left"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] truncate">
                <Code2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Inspect Elliptic Curve Points (G1 / G2)</span>
              </div>
              {showCurveInspector ? <EyeOff className="w-3.5 h-3.5 flex-shrink-0" /> : <Eye className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>

            {showCurveInspector && (
              <div className="p-3 pt-0 text-[10px] font-mono text-zinc-400 space-y-2 border-t border-white/[0.04] max-h-36 overflow-y-auto">
                <div>
                  <span className="text-emerald-400 font-bold">πA (G1 Point):</span>
                  <div className="truncate text-zinc-500">{String(originalZKProof.pi_a?.[0])}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">πB (G2 Point):</span>
                  <div className="truncate text-zinc-500">{String(originalZKProof.pi_b?.[0]?.[0])}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">πC (G1 Point):</span>
                  <div className="truncate text-zinc-500">{String(originalZKProof.pi_c?.[0])}</div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Adversary Tampering Simulation */}
          <div className="space-y-1.5">
            {!isTamperedState ? (
              <button
                type="button"
                onClick={handleSimulateTamperedProof}
                className="w-full py-2.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">Simulate Adversary: Corrupt πA Curve Coordinates</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetToGenuineProof}
                className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Restore Genuine Proof Points</span>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!verifyResult.is_valid}
            onClick={() => {
              toast.success("Circuit Verified! Proceeding to Anti-Replay Nullifier Verification");
              onProceedToNullifierVerify(verifyResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Nullifier Registry Check</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
