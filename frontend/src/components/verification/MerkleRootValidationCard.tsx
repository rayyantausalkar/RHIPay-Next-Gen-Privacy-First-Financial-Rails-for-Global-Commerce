"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  GitBranch,
  UserPlus,
  Bug,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SupplementaryDataRouteResponse,
  MerkleRootValidateResponse,
} from "@/types/payment";
import { validateMerkleRoot, pushMerkleTreeUpdate, getMerkleRoot } from "@/lib/api";
import { toast } from "sonner";

interface MerkleRootValidationCardProps {
  pacs008: Pacs008MessageResponse;
  routeData: SupplementaryDataRouteResponse;
  onProceedToZkCircuitVerify: (valData: MerkleRootValidateResponse) => void;
  onBack: () => void;
}

export const MerkleRootValidationCard: React.FC<MerkleRootValidationCardProps> = ({
  pacs008,
  routeData,
  onProceedToZkCircuitVerify,
  onBack,
}) => {
  const canonical = (pacs008.canonical_json || {}) as Record<string, any>;
  const cdtTrf = (canonical.CdtTrfTxInf || {}) as Record<string, any>;
  const splmtry = (cdtTrf.SplmtryData || {}) as Record<string, any>;
  const zkProof = (splmtry.zk_proof || {}) as Record<string, any>;

  const initialRoot =
    routeData?.pipelines?.zk_snark_queue?.merkle_root ||
    zkProof?.merkle_root ||
    "";

  const [targetRoot, setTargetRoot] = useState<string>(initialRoot);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<MerkleRootValidateResponse | null>(null);
  const [isSimulatingMutation, setIsSimulatingMutation] = useState<boolean>(false);

  const runMerkleRootValidation = useCallback(async (rootToVerify: string) => {
    setIsValidating(true);
    try {
      let resolvedRoot = rootToVerify;
      if (!resolvedRoot) {
        const active = await getMerkleRoot();
        resolvedRoot = active.merkle_root;
        setTargetRoot(resolvedRoot);
      }

      const res = await validateMerkleRoot({
        merkle_root: resolvedRoot,
        sender_spoke: "IN",
        kyc_tier_required: 1,
      });

      setValidationResult(res);
      setIsValidating(false);

      if (res.is_valid) {
        toast.success(
          res.is_current_root
            ? "Active Merkle Root Verified!"
            : "Historical Merkle Root Accepted (Within Cache TTL)!",
          {
            description: `Tree Depth ${res.tree_depth} • ${res.total_participants} Participants • ${res.validation_time_ms}ms`,
          }
        );
      } else {
        toast.error("Merkle Root Verification Failed!", {
          description: res.error_details || "Root hash not found in active or historical registry.",
        });
      }
    } catch (err: unknown) {
      setIsValidating(false);
      const msg = err instanceof Error ? err.message : "Merkle root validation failed";
      toast.error(msg);
    }
  }, []);

  useEffect(() => {
    runMerkleRootValidation(targetRoot);
  }, [runMerkleRootValidation, targetRoot]);

  // Simulate Concurrent Tree Update / Leaf Enrollment
  const handleSimulateTreeMutation = async () => {
    setIsSimulatingMutation(true);
    try {
      toast.loading("Enrolling new KYC participant & mutating Merkle tree...", { id: "mutate" });
      const newProxy = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
      const updateRes = await pushMerkleTreeUpdate({
        new_leaf_proxy: newProxy,
        spoke: "IN",
      });

      toast.dismiss("mutate");
      toast.info("Merkle Tree State Updated!", {
        description: `Enrolled ${newProxy}. Previous root is now in historical cache.`,
      });

      // Re-validate the original transaction root against the new tree state
      await runMerkleRootValidation(targetRoot);
    } catch {
      toast.dismiss("mutate");
      toast.error("Tree update simulation failed");
    } finally {
      setIsSimulatingMutation(false);
    }
  };

  // Simulate Fake / Malicious Root Attack
  const handleSimulateForgedRootAttack = async () => {
    const fakeRoot = "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678";
    setTargetRoot(fakeRoot);
    toast.warning("Injected tampered / forged Merkle root hash");
    await runMerkleRootValidation(fakeRoot);
  };

  // Reset to Genuine Active Root
  const handleResetToActiveRoot = async () => {
    try {
      const active = await getMerkleRoot();
      setTargetRoot(active.merkle_root);
      toast.info("Reset to genuine active Merkle tree root");
      await runMerkleRootValidation(active.merkle_root);
    } catch {
      toast.error("Failed to fetch active root");
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
            Merkle Root Validator
          </span>
        </div>
      </div>

      {isValidating ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Validating 256-bit Poseidon Merkle Root</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Matching Against Central Identity Registry State</p>
          </div>
        </div>
      ) : validationResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Verification Hero Badge */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              validationResult.is_valid
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {validationResult.is_valid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {validationResult.is_current_root
                    ? "Active Tree State Verified"
                    : validationResult.is_historical_cached
                    ? "Historical State (Valid in TTL)"
                    : "Outdated / Forged Root Blocked"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {validationResult.status} ({validationResult.validation_time_ms}ms)
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold flex-shrink-0 ${
                validationResult.is_valid
                  ? "bg-emerald-500 text-black"
                  : "bg-rose-500 text-white"
              }`}
            >
              {validationResult.is_valid ? "VALID ROOT" : "REJECTED"}
            </span>
          </div>

          {/* Root Hash & Merkle State Details Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Evaluated Poseidon Merkle Root
              </span>
              <div className="p-2.5 rounded-xl bg-black border border-white/[0.06] font-mono text-xs font-bold text-emerald-400 break-all select-all">
                {validationResult.merkle_root}
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tree Depth:</span>
                <span className="font-mono font-bold text-white">
                  Level {validationResult.tree_depth} (Capacity: 65,536 leaves)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total Enrolled Participants:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {validationResult.total_participants} KYC-verified
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">State Freshness:</span>
                <span className="font-mono text-zinc-300">
                  {validationResult.is_current_root
                    ? "Current Active Head (0.0s)"
                    : `${validationResult.root_age_seconds}s historical`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive State Mutation & Tampering Controls */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateTreeMutation}
                disabled={isSimulatingMutation}
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Enroll Leaf (Mutate Tree)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateForgedRootAttack}
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">Inject Fake Root</span>
              </button>
            </div>

            {!validationResult.is_valid && (
              <button
                type="button"
                onClick={handleResetToActiveRoot}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Active Registry Root</span>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!validationResult.is_valid}
            onClick={() => {
              toast.success("Merkle Root Verified! Proceeding to Groth16 Circuit & Nullifier Verification");
              onProceedToZkCircuitVerify(validationResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Groth16 Circuit Verification</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
