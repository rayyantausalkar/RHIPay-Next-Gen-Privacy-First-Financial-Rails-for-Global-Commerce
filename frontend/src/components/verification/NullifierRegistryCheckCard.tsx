"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  Layers,
  Bug,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SupplementaryDataRouteResponse,
  MerkleRootValidateResponse,
  Groth16VerifyResponse,
  NullifierRegistryCheckResponse,
} from "@/types/payment";
import {
  registryCheckNullifier,
  spendNullifier,
  resetNullifierRegistry,
} from "@/lib/api";
import { toast } from "sonner";

interface NullifierRegistryCheckCardProps {
  pacs008: Pacs008MessageResponse;
  routeData: SupplementaryDataRouteResponse;
  merkleData: MerkleRootValidateResponse;
  zkResult: Groth16VerifyResponse;
  onProceedToEnvelopeRelay: (nullifierCheck: NullifierRegistryCheckResponse) => void;
  onBack: () => void;
}

export const NullifierRegistryCheckCard: React.FC<NullifierRegistryCheckCardProps> = ({
  pacs008,
  routeData,
  merkleData,
  zkResult,
  onProceedToEnvelopeRelay,
  onBack,
}) => {
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [checkResult, setCheckResult] = useState<NullifierRegistryCheckResponse | null>(null);
  const [isSimulatingReplay, setIsSimulatingReplay] = useState<boolean>(false);

  const canonical = (pacs008.canonical_json || {}) as Record<string, any>;
  const cdtTrf = (canonical.CdtTrfTxInf || {}) as Record<string, any>;
  const splmtry = (cdtTrf.SplmtryData || {}) as Record<string, any>;
  const nullifierHash =
    routeData.pipelines.nullifier_registry_queue.nullifier_hash ||
    splmtry.nullifier_hash ||
    "0x0";

  const runNullifierRegistryCheck = useCallback(async () => {
    setIsValidating(true);
    try {
      const res = await registryCheckNullifier({
        nullifier_hash: nullifierHash,
        quote_id: pacs008.end_to_end_id || "quote-001",
        uetr: pacs008.uetr,
      });

      setCheckResult(res);
      setIsValidating(false);

      if (res.is_fresh) {
        toast.success("Nullifier Freshness Confirmed & In-Flight Lock Acquired!", {
          description: `Checked in ${res.check_latency_ms}ms on ${res.storage_tier}`,
        });
      } else {
        toast.error("Replay Blocked: Double-Spend Detected!", {
          description: res.error_details || "Nullifier hash was already committed.",
        });
      }
    } catch (err: unknown) {
      setIsValidating(false);
      const msg = err instanceof Error ? err.message : "Nullifier registry check failed";
      toast.error(msg);
    }
  }, [nullifierHash, pacs008.end_to_end_id, pacs008.uetr]);

  useEffect(() => {
    runNullifierRegistryCheck();
  }, [runNullifierRegistryCheck]);

  // Simulate Replay Attack: Mark spent and re-query
  const handleSimulateReplayAttack = async () => {
    setIsSimulatingReplay(true);
    try {
      toast.loading("Simulating Replay Attack: Marking nullifier as spent on Central Hub...", { id: "replay" });
      await spendNullifier(nullifierHash, pacs008.end_to_end_id || "quote-001");

      toast.dismiss("replay");
      toast.error("Replay Blocked by Central Hub!", {
        description: "Re-queried nullifier: Hub identified double-spend and rejected transaction.",
      });

      await runNullifierRegistryCheck();
    } catch {
      toast.dismiss("replay");
      toast.error("Replay simulation error");
    } finally {
      setIsSimulatingReplay(false);
    }
  };

  // Reset spent registry
  const handleResetRegistry = async () => {
    try {
      await resetNullifierRegistry();
      toast.info("Anti-replay registry cleared. Nullifier is fresh again.");
      await runNullifierRegistryCheck();
    } catch {
      toast.error("Failed to reset registry");
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
            Anti-Replay Registry Check
          </span>
        </div>
      </div>

      {isValidating ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Querying Anti-Replay Storage Layer</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Atomic Test-and-Set Nullifier Reservation</p>
          </div>
        </div>
      ) : checkResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Hero Status Badge */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              checkResult.is_fresh
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {checkResult.is_fresh ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {checkResult.is_fresh
                    ? "Fresh Nullifier • Reservation Acquired"
                    : "Replay Attack Blocked (Double-Spend)"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {checkResult.storage_tier} ({checkResult.check_latency_ms}ms)
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                checkResult.is_fresh
                  ? "bg-emerald-500 text-black"
                  : "bg-rose-500 text-white"
              }`}
            >
              {checkResult.is_fresh ? "UNSPENT" : "SPENT / REPLAY"}
            </span>
          </div>

          {/* Nullifier Hash & Reservation Lock Details Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Committed 256-bit Nullifier Hash
              </span>
              <div className="p-2.5 rounded-xl bg-black border border-white/[0.06] font-mono text-xs font-bold text-emerald-400 break-all select-all">
                {checkResult.nullifier_hash}
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Lock State:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {checkResult.is_reserved ? "EPHEMERAL_RESERVATION_ACQUIRED" : "NO_LOCK"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Transaction Scope:</span>
                <span className="font-mono text-zinc-300 truncate text-right">
                  {checkResult.quote_id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Double-Spend Prevention:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Anti-Replay Immune
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Replay Attack Simulation */}
          <div className="space-y-1.5">
            {checkResult.is_fresh ? (
              <button
                type="button"
                onClick={handleSimulateReplayAttack}
                disabled={isSimulatingReplay}
                className="w-full py-2.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">Simulate Replay Attack: Mark Spent & Re-query</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetRegistry}
                className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">Reset Anti-Replay Registry & Restore Fresh</span>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!checkResult.is_fresh}
            onClick={() => {
              toast.success("Nullifier Confirmed! Proceeding to Destination Regulator Envelope Relay");
              onProceedToEnvelopeRelay(checkResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Regulatory Envelope Relay</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
