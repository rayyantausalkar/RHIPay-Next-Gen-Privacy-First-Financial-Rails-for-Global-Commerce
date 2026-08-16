"use client";

import React from "react";
import { Activity, Database, FileCode2, Scale } from "lucide-react";

export const AdminHubPlaceholder: React.FC = () => {
  return (
    <div className="bg-[#09090b] rounded-3xl border border-white/[0.08] p-8 shadow-2xl backdrop-blur-2xl text-center max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
        <Activity className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white tracking-tight">
        BIS Nexus Hub Telemetry
      </h2>
      <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
        Live telemetry, ISO 20022 XML (`pacs.008`) inspections, double-entry bilateral ledger pools, and real-time ZKP verification telemetry.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <FileCode2 className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-zinc-200">ISO 20022 Logs</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Raw XML & JSON pacs.008 schema validation.</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <Scale className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-zinc-200">Double-Entry Ledger</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Bilateral FXP liquidity pools & zero-float balances.</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <Database className="w-4 h-4 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-zinc-200">ZKP Tree Registry</h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">Poseidon Merkle root & nullifier anti-replay index.</p>
        </div>
      </div>
    </div>
  );
};
