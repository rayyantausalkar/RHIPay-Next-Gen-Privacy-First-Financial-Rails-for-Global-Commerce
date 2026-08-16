"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ArrowDownLeft, ArrowUpRight, Activity } from "lucide-react";

interface NavigationProps {
  activeTab: "receive" | "send" | "nexus";
  onSelectTab: (tab: "receive" | "send" | "nexus") => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const [hubOnline, setHubOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHub = async () => {
      try {
        const res = await fetch("http://localhost:8000/health");
        setHubOnline(res.ok);
      } catch {
        setHubOnline(false);
      }
    };
    checkHub();
    const interval = setInterval(checkHub, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-white/[0.08] bg-black/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-black stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-bold tracking-tight text-white">
                  RHIPay
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/25 tracking-wider font-mono">
                  NEXUS
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block truncate">
                Instant Settlement & ZKP Privacy
              </p>
            </div>
          </div>

          {/* Unified Wallet Tabs Navigation */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/[0.08] shadow-inner flex-shrink-0">
            <button
              onClick={() => onSelectTab("receive")}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 active:scale-95 ${
                activeTab === "receive"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Receive</span>
            </button>

            <button
              onClick={() => onSelectTab("send")}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 active:scale-95 ${
                activeTab === "send"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Send</span>
            </button>

            <button
              onClick={() => onSelectTab("nexus")}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 active:scale-95 ${
                activeTab === "nexus"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>
          </nav>

          {/* Hub Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/[0.08] bg-zinc-950 flex-shrink-0">
            {hubOnline === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold text-[11px]">Hub Active</span>
              </>
            ) : hubOnline === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-rose-400 font-semibold text-[11px]">Offline</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-zinc-400 font-semibold text-[11px]">Connecting...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
