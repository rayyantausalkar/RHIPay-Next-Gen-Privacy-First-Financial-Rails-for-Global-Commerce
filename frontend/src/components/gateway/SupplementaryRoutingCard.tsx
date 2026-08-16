"use client";

import React, { useState, useEffect } from "react";
import {
  GitFork,
  Cpu,
  KeyRound,
  Building,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Zap,
  Layers,
  Activity,
  Check,
  Sparkles,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  GatewayIngestResponse,
  SupplementaryDataRouteResponse,
} from "@/types/payment";
import { dispatchSupplementaryData } from "@/lib/api";
import { toast } from "sonner";

interface SupplementaryRoutingCardProps {
  pacs008: Pacs008MessageResponse;
  gatewayData: GatewayIngestResponse;
  onProceedToZkVerify: (routeData: SupplementaryDataRouteResponse) => void;
  onBack: () => void;
}

export const SupplementaryRoutingCard: React.FC<SupplementaryRoutingCardProps> = ({
  pacs008,
  gatewayData,
  onProceedToZkVerify,
  onBack,
}) => {
  const [isRouting, setIsRouting] = useState<boolean>(true);
  const [routeResult, setRouteResult] = useState<SupplementaryDataRouteResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const runSupplementaryRouting = async () => {
      setIsRouting(true);
      try {
        const res = await dispatchSupplementaryData({
          ingestion_id: gatewayData.ingestion_id,
          uetr: pacs008.uetr,
          pacs008_message: pacs008,
        });

        if (!isMounted) return;
        setRouteResult(res);
        setIsRouting(false);

        toast.success("Supplementary Data Dispatched to Specialized Pipelines!", {
          description: "Core Banking Ledger is 100% unblocked from cryptographic workloads.",
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsRouting(false);
        const msg = err instanceof Error ? err.message : "Routing dispatch failed";
        toast.error(msg);
      }
    };

    runSupplementaryRouting();
    return () => {
      isMounted = false;
    };
  }, [gatewayData.ingestion_id, pacs008]);

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
            Supplementary Data Routing
          </span>
        </div>
      </div>

      {isRouting ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Extracting & Dispatching ISO Supplementary Data</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Isolating Heavy Cryptographic Loads from Core Ledger</p>
          </div>
        </div>
      ) : routeResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Zero-Stall Unblocked Core Ledger Hero Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Core Ledger Highway Unblocked
                </span>
                <span className="text-[10px] text-emerald-300/80 block truncate">
                  Parallel execution • {routeResult.isolation_latency_ms}ms overhead
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              4/4 Dispatched
            </span>
          </div>

          {/* 4 Dedicated Pipelines Grid */}
          <div className="space-y-2 text-xs">
            {/* Pipeline 1: ZK Prover Pool */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">ZK-SNARK Verifier Pool</div>
                  <div className="text-[10px] text-zinc-400 font-mono truncate">
                    {routeResult.pipelines.zk_snark_queue.target_engine} • ~{routeResult.pipelines.zk_snark_queue.estimated_execution_time_ms}ms
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <Check className="w-3 h-3" /> ROUTED
              </span>
            </div>

            {/* Pipeline 2: Anti-Replay Nullifier Store */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">Anti-Replay Nullifier Lock</div>
                  <div className="text-[10px] text-zinc-400 font-mono truncate">
                    {routeResult.pipelines.nullifier_registry_queue.target_engine} • ~{routeResult.pipelines.nullifier_registry_queue.estimated_execution_time_ms}ms
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <Check className="w-3 h-3" /> ROUTED
              </span>
            </div>

            {/* Pipeline 3: Regulatory Compliance Relay */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">Regulatory Node Relay</div>
                  <div className="text-[10px] text-zinc-400 font-mono truncate">
                    {routeResult.pipelines.regulatory_compliance_queue.recipient_regulator_id}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <Check className="w-3 h-3" /> ROUTED
              </span>
            </div>

            {/* Pipeline 4: Core Settlement Highway */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">Core Banking Rails</div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate">
                    Fast-Path Non-Blocking Execution
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <Check className="w-3 h-3" /> PARALLEL
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Supplementary Streams Routed! Proceeding to Cryptographic Verification");
              onProceedToZkVerify(routeResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Cryptographic & Nullifier Verification</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
