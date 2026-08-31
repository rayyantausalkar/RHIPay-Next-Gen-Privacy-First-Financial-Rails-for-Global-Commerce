"use client";

import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, Cpu, ArrowUpRight } from "lucide-react";

export const CreativeHeroBanner: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState(0);

  const metrics = [
    { label: "Zero-Knowledge Latency", value: "< 1.2s", sub: "Groth16 on BN254" },
    { label: "Atomic Settlement Rails", value: "100% Final", sub: "ISO 20022 Compliant" },
    { label: "Global Spoke Reserves", value: "12 Countries", sub: "Bilateral Liquidity" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % metrics.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [metrics.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061826] via-[#04111d] to-[#020b12] border border-emerald-500/20 p-4 sm:p-5 shadow-xl shadow-emerald-950/20">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mb-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Minimal Cyber Brand Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#08131d] rounded-2xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#08131d] animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                Nexus ZKP Core
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-300 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-0.5">
              Next-Gen Privacy-First Financial Rails
            </p>
          </div>
        </div>

        {/* Right: Dynamic Sliding Metric Pill */}
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] py-1.5 px-3.5 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              {metrics[activeMetric].label}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono text-emerald-300">
                {metrics[activeMetric].value}
              </span>
              <span className="text-[10px] text-zinc-500">
                • {metrics[activeMetric].sub}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
