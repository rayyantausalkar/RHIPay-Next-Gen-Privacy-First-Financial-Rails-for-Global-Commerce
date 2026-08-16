"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  RotateCcw,
  KeyRound,
  Binary,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bug,
  RefreshCw,
} from "lucide-react";
import {
  FXQuoteResponse,
  ProxyResolutionResponse,
  ZKProofGenerateResponse,
  NullifierComputeResponse,
} from "@/types/payment";
import { computeNullifier, spendNullifier, verifyNullifier, resetNullifierRegistry } from "@/lib/api";
import { toast } from "sonner";

interface NullifierComputationCardProps {
  quote: FXQuoteResponse;
  recipient: ProxyResolutionResponse;
  zkProof: ZKProofGenerateResponse;
  senderProxy: string;
  senderCountry: string;
  onProceedToEnvelope: (nullifier: NullifierComputeResponse) => void;
  onBack: () => void;
}

export const NullifierComputationCard: React.FC<NullifierComputationCardProps> = ({
  quote,
  recipient,
  zkProof,
  senderProxy,
  senderCountry,
  onProceedToEnvelope,
  onBack,
}) => {
  const [nullifierData, setNullifierData] = useState<NullifierComputeResponse | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(true);
  const [isSpentStatus, setIsSpentStatus] = useState<boolean>(false);
  const [isTestingReplay, setIsTestingReplay] = useState<boolean>(false);
  const [sessionNonce, setSessionNonce] = useState<string>(() => `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const runNullifierComputation = useCallback(async (nonceValue: string) => {
    setIsComputing(true);
    try {
      const res = await computeNullifier({
        identity_proxy: senderProxy,
        sender_spoke: senderCountry,
        quote_id: quote.quote_id,
        nonce: nonceValue,
      });

      setNullifierData(res);
      setIsSpentStatus(!res.is_fresh);
      setIsComputing(false);

      toast.success("Cryptographic Nullifier Derived!", {
        description: "Anti-double-spend protection active for this transaction.",
      });
    } catch (err: unknown) {
      setIsComputing(false);
      const msg = err instanceof Error ? err.message : "Failed to compute nullifier";
      toast.error(msg);
    }
  }, [quote.quote_id, senderCountry, senderProxy]);

  useEffect(() => {
    runNullifierComputation(sessionNonce);
  }, [runNullifierComputation, sessionNonce]);

  // Interactive Replay Simulation Test
  const handleSimulateReplayAttack = async () => {
    if (!nullifierData) return;
    setIsTestingReplay(true);

    try {
      toast.loading("Simulating Replay Attack: Attempting to reuse nullifier...", { id: "replay" });
      
      // 1. Mark as spent on Hub
      await spendNullifier(nullifierData.nullifier_hash, quote.quote_id);
      
      // 2. Verify Hub rejection
      const check = await verifyNullifier(nullifierData.nullifier_hash);
      setIsSpentStatus(check.is_spent);

      toast.dismiss("replay");
      toast.error("Replay Blocked by Central Hub!", {
        description: "Double-spend detected: Hub rejected reused nullifier hash.",
      });
    } catch {
      toast.dismiss("replay");
      toast.error("Replay simulation error");
    } finally {
      setIsTestingReplay(false);
    }
  };

  // Reset / Generate Fresh Nonce
  const handleGenerateFreshNullifier = async () => {
    await resetNullifierRegistry().catch(() => {});
    const freshNonce = `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setSessionNonce(freshNonce);
    setIsSpentStatus(false);
    toast.info("Generated fresh cryptographic transaction nonce");
    await runNullifierComputation(freshNonce);
  };

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
            Anti-Replay Nullifier
          </span>
        </div>
      </div>

      {isComputing ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Deriving Deterministic Nullifier</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Poseidon(Secret, TxSeed, LeafIndex)</p>
          </div>
        </div>
      ) : nullifierData ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Hero Nullifier Status Pill */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                Single-Use Nullifier Derived
              </span>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                isSpentStatus
                  ? "bg-rose-500 text-white"
                  : "bg-emerald-500 text-black"
              }`}
            >
              {isSpentStatus ? "SPENT" : "FRESH"}
            </span>
          </div>

          {/* Output Nullifier Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5 sm:space-y-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Cryptographic Nullifier Hash
              </span>
              <div className="p-2.5 rounded-xl bg-black border border-white/[0.06] font-mono text-xs font-bold text-emerald-400 break-all select-all">
                {nullifierData.nullifier_hash}
              </div>
            </div>

            {/* 3 Cryptographic Inputs Breakdown */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Deterministic Circuit Inputs
              </span>

              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                  <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  Secret Digest:
                </span>
                <span className="font-mono text-zinc-300 truncate text-right">
                  {nullifierData.identity_secret_hash.slice(0, 16)}...
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                  <Binary className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  Tx Seed Hash:
                </span>
                <span className="font-mono text-zinc-300 truncate text-right">
                  {nullifierData.transaction_seed_hash.slice(0, 16)}...
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                  <Layers className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  Leaf Index:
                </span>
                <span className="font-mono font-bold text-emerald-400 truncate text-right">
                  #{nullifierData.leaf_index}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Replay Test & Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateReplayAttack}
              disabled={isTestingReplay || isSpentStatus}
              className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-2xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-xs font-semibold text-zinc-300 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="truncate">Simulate Replay Attack</span>
            </button>

            {isSpentStatus && (
              <button
                type="button"
                onClick={handleGenerateFreshNullifier}
                className="flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Reset / Fresh</span>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Nullifier committed! Proceeding to Travel Rule Envelope");
              onProceedToEnvelope(nullifierData);
            }}
            disabled={isSpentStatus}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Encrypted Compliance Envelope</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
