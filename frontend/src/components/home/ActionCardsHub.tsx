"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, QrCode, Sparkles, Send, Download } from "lucide-react";

interface ActionCardsHubProps {
  onOpenSend: () => void;
  onOpenReceive: () => void;
}

export const ActionCardsHub: React.FC<ActionCardsHubProps> = ({
  onOpenSend,
  onOpenReceive,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
      {/* Send Money Card */}
      <button
        type="button"
        onClick={onOpenSend}
        className="group relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#071d2b] to-[#041018] border border-cyan-500/20 hover:border-cyan-400/45 text-left shadow-xl shadow-cyan-950/25 active:scale-98 transition-all duration-200 cursor-pointer"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md group-hover:scale-105 group-hover:bg-cyan-400 group-hover:text-black transition-all">
              <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400/90 bg-cyan-950/50 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
              Instant FX
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
              Send Money
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 line-clamp-1">
              Scan QR or enter 6-digit payment code
            </p>
          </div>
        </div>
      </button>

      {/* Receive Money Card */}
      <button
        type="button"
        onClick={onOpenReceive}
        className="group relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#07241b] to-[#03130e] border border-emerald-500/20 hover:border-emerald-400/45 text-left shadow-xl shadow-emerald-950/25 active:scale-98 transition-all duration-200 cursor-pointer"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-105 group-hover:bg-emerald-400 group-hover:text-black transition-all">
              <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400/90 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
              2-Min Code
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
              Receive Money
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 line-clamp-1">
              Generate dynamic QR or 6-digit code
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};
