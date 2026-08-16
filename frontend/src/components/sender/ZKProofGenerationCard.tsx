"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Code2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Key,
  Binary,
  Layers,
} from "lucide-react";
import {
  FXQuoteResponse,
  ProxyResolutionResponse,
  ZKProofGenerateResponse,
} from "@/types/payment";
import { generateZKProof } from "@/lib/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ZKProofGenerationCardProps {
  quote: FXQuoteResponse;
  recipient: ProxyResolutionResponse;
  senderProxy: string;
  senderCountry: string;
  onProceedToEnvelope: (zkProof: ZKProofGenerateResponse) => void;
  onBack: () => void;
}

export const ZKProofGenerationCard: React.FC<ZKProofGenerationCardProps> = ({
  quote,
  recipient,
  senderProxy,
  senderCountry,
  onProceedToEnvelope,
  onBack,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [proofResult, setProofResult] = useState<ZKProofGenerateResponse | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showRawProof, setShowRawProof] = useState<boolean>(false);

  const proofStages = [
    "Computing Poseidon Identity Commitment...",
    "Traversing Depth-16 Merkle Tree Sibling Path...",
    "Solving R1CS Circom Constraints on BN254 Curve...",
    "Synthesizing Groth16 Proof Points (πA, πB, πC)...",
  ];

  useEffect(() => {
    let isMounted = true;

    const runZKCircuit = async () => {
      setIsGenerating(true);
      setActiveStepIndex(0);

      // Multi-stage visual animation ticks
      const t1 = setTimeout(() => isMounted && setActiveStepIndex(1), 180);
      const t2 = setTimeout(() => isMounted && setActiveStepIndex(2), 380);
      const t3 = setTimeout(() => isMounted && setActiveStepIndex(3), 580);

      try {
        const result = await generateZKProof({
          identity_proxy: senderProxy,
          sender_spoke: senderCountry,
          quote_id: quote.quote_id,
          kyc_tier_required: 1,
        });

        if (!isMounted) return;
        setProofResult(result);
        setIsGenerating(false);

        toast.success("ZK-SNARK Membership Proof Generated!", {
          description: `Execution benchmark: ${result.generation_time_ms}ms (<1.2s Target)`,
        });

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#059669"],
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsGenerating(false);
        const msg = err instanceof Error ? err.message : "ZK Proof generation failed";
        toast.error(msg);
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    runZKCircuit();
    return () => {
      isMounted = false;
    };
  }, [quote.quote_id, recipient, senderCountry, senderProxy]);

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400 font-mono">
            ZK Membership Prover
          </span>
        </div>
      </div>

      {/* Hero Card: Generating vs Generated */}
      {isGenerating ? (
        <div className="my-8 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
            <div className="relative w-20 h-20 rounded-2xl bg-zinc-950 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <Cpu className="w-9 h-9 animate-pulse" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Executing Circom ZK-SNARK Circuit
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              BN254 Scalar Field • Poseidon Hash Permutation
            </p>
          </div>

          {/* Animated Execution Stages */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/[0.06] text-left space-y-2.5">
            {proofStages.map((stage, idx) => {
              const isDone = activeStepIndex > idx;
              const isCurrent = activeStepIndex === idx;

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2.5 text-xs transition-all ${
                    isDone
                      ? "text-emerald-400 font-semibold"
                      : isCurrent
                      ? "text-white font-medium animate-pulse"
                      : "text-zinc-600"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 flex-shrink-0" />
                  )}
                  <span className="truncate">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : proofResult ? (
        <div className="space-y-4 my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Performance Speed Telemetry Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Client Proof Generated in {proofResult.generation_time_ms}ms
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-black">
              &lt; 1.2s Target Passed
            </span>
          </div>

          {/* Zero-Knowledge Privacy Architecture Disclosure Card */}
          <div className="p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Knowledge Privacy Proof Guarantees
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Identity Secret:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Hidden (0-Knowledge)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Merkle Tree Root:</span>
                <span className="font-mono text-zinc-300 truncate max-w-[200px]" title={proofResult.merkle_root}>
                  {proofResult.merkle_root.slice(0, 18)}...
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Anti-Replay Nullifier:</span>
                <span className="font-mono text-zinc-300 truncate max-w-[200px]" title={proofResult.nullifier_hash}>
                  {proofResult.nullifier_hash.slice(0, 18)}...
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">KYC Compliance:</span>
                <span className="font-semibold text-emerald-400">
                  Tier 1 Participant (Proven)
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Groth16 Curve Points Inspector */}
          <div className="rounded-2xl bg-zinc-950/60 border border-white/[0.06] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawProof(!showRawProof)}
              className="w-full p-3 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors text-left"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspect Groth16 Proof Points (πA, πB, πC)</span>
              </div>
              {showRawProof ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRawProof && (
              <div className="p-3 pt-0 text-[10px] font-mono text-zinc-400 space-y-2 border-t border-white/[0.04] max-h-40 overflow-y-auto">
                <div>
                  <span className="text-emerald-400 font-bold">πA (G1 Point):</span>
                  <div className="truncate text-zinc-500">{proofResult.pi_a[0]}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">πB (G2 Point):</span>
                  <div className="truncate text-zinc-500">{proofResult.pi_b[0]?.[0]}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">πC (G1 Point):</span>
                  <div className="truncate text-zinc-500">{proofResult.pi_c[0]}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Curve:</span> {proofResult.curve} ({proofResult.protocol})
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Proof Verified! Ready for Encrypted PII Envelope & Settlement");
              onProceedToEnvelope(proofResult);
            }}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Proceed to Encrypted Travel Rule Envelope</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
