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
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
              <ShieldCheck className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  RHIPay
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/25 tracking-wider font-mono">
                  NEXUS P2P
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Instant Settlement & ZKP Privacy
              </p>
            </div>
          </div>

          {/* Unified Wallet Tabs Navigation */}
          <nav className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-white/[0.08] shadow-inner">
            <button
              onClick={() => onSelectTab("receive")}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "receive"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receive</span>
            </button>

            <button
              onClick={() => onSelectTab("send")}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "send"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send</span>
            </button>

            <button
              onClick={() => onSelectTab("nexus")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "nexus"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Telemetry</span>
            </button>
          </nav>

          {/* Hub Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/[0.08] bg-zinc-950">
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
