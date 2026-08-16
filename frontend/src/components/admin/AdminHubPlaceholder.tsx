"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  KeyRound,
  FileCode,
  Globe2,
  RefreshCw,
  TrendingUp,
  Server,
  Zap,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { getMerkleRoot, resetNullifierRegistry } from "@/lib/api";
import { MerkleRootResponse } from "@/types/payment";
import { toast } from "sonner";

export const AdminHubPlaceholder: React.FC = () => {
  const [merkleInfo, setMerkleInfo] = useState<MerkleRootResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [serverLatency, setServerLatency] = useState<number>(12);

  const fetchHubTelemetry = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      const root = await getMerkleRoot();
      setMerkleInfo(root);
      const elapsed = Math.round(performance.now() - start);
      setServerLatency(elapsed || 8);
    } catch {
      // Handled
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHubTelemetry();
    const interval = setInterval(fetchHubTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetNullifiers = async () => {
    try {
      await resetNullifierRegistry();
      toast.success("Anti-Replay Nullifier Registry Cleared!", {
        description: "Fresh state ready for multi-transaction benchmarking.",
      });
    } catch {
      toast.error("Failed to reset nullifier registry");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#09090b] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Nexus Hub Telemetry
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  LIVE RAILS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Central Bank Settlement Engine & Zero-Knowledge Verifier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchHubTelemetry}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 border border-white/[0.08] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh State</span>
          </button>
        </div>

        {/* Live Rail Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              Hub Node Latency
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white font-mono">{serverLatency}</span>
              <span className="text-xs text-emerald-400 font-mono">ms</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              ZK Proving Speed
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">~180</span>
              <span className="text-xs text-zinc-400 font-mono">ms (&lt;1.2s)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              KYC Participants
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white font-mono">
                {merkleInfo?.total_members ?? 8}
              </span>
              <span className="text-xs text-zinc-400 font-mono">leaves</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              Tree Depth
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white font-mono">
                2<sup>16</sup>
              </span>
              <span className="text-xs text-zinc-400 font-mono">levels</span>
            </div>
          </div>
        </div>
      </div>

      {/* Merkle Tree & Anti-Replay Root Card */}
      <div className="p-6 rounded-3xl bg-[#09090b] border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Poseidon Merkle Tree Anchor
            </h3>
          </div>

          <span className="text-[10px] font-mono text-zinc-400">
            BN254 Scalar Field
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
            Current 256-Bit Merkle Root
          </span>
          <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06] font-mono text-xs font-bold text-emerald-400 break-all select-all">
            {merkleInfo?.merkle_root || "0x12f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f"}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-zinc-400">Double-Spend Nullifier Registry:</span>
          <button
            type="button"
            onClick={handleResetNullifiers}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-[11px] font-semibold text-zinc-300 hover:text-rose-300 transition-colors"
          >
            Clear Nullifier Spent Cache
          </button>
        </div>
      </div>

      {/* Bilateral FX Liquidity Pools */}
      <div className="p-6 rounded-3xl bg-[#09090b] border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Guaranteed Bilateral FX Pools
            </h3>
          </div>

          <span className="text-[10px] font-mono text-emerald-400">
            5 bps Spread • Zero Slippage
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                <span>🇮🇳 INR / 🇸🇬 SGD</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">Active</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Pool: S$ 2.50M / ₹ 161.65M</div>
            </div>
            <div className="text-right text-emerald-400 font-bold">1 SGD = 64.66 INR</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                <span>🇦🇪 AED / 🇮🇳 INR</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">Active</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Pool: ₹ 85.00M / 2.45M AED</div>
            </div>
            <div className="text-right text-emerald-400 font-bold">1 AED = 22.84 INR</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                <span>🇺🇸 USD / 🇸🇬 SGD</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">Active</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Pool: S$ 4.20M / $ 3.15M</div>
            </div>
            <div className="text-right text-emerald-400 font-bold">1 USD = 1.34 SGD</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                <span>🇯🇵 JPY / 🇪🇺 EUR</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">Active</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Pool: ¥ 450M / € 2.80M</div>
            </div>
            <div className="text-right text-emerald-400 font-bold">1 EUR = 163.45 JPY</div>
          </div>
        </div>
      </div>
    </div>
  );
};
