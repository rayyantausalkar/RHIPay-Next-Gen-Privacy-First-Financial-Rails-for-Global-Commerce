"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Activity, ArrowLeft, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface NavigationProps {
  activeTab: "receive" | "send" | "nexus";
  onSelectTab: (tab: "receive" | "send" | "nexus") => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const router = useRouter();
  const [hubOnline, setHubOnline] = useState<boolean | null>(null);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info("Logged out of RHI Pay");
    router.push("/");
  };

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

  const countryFlags: Record<string, string> = {
    SG: "🇸🇬",
    IN: "🇮🇳",
    AE: "🇦🇪",
    US: "🇺🇸",
    GB: "🇬🇧",
    EU: "🇪🇺",
    JP: "🇯🇵",
    TH: "🇹🇭",
    MY: "🇲🇾",
    AU: "🇦🇺",
    CA: "🇨🇦",
    BR: "🇧🇷",
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#040d14]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo (Stays in App) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/app" className="flex items-center gap-2 sm:gap-3 min-w-0 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/rhi_without_bg.svg"
                  alt="RHI Pay Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    RHI Pay
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/25 tracking-wider font-mono">
                    NEXUS
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block truncate">
                  Instant Settlement & ZKP Privacy
                </p>
              </div>
            </Link>
          </div>

          {/* Unified Wallet Tabs Navigation */}
          <nav className="flex items-center gap-0.5 sm:gap-1 bg-zinc-950/80 p-1 rounded-2xl border border-white/[0.08] shadow-inner flex-shrink-0">
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

          {/* User Profile or Hub Status Pill */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-950/40 text-emerald-300">
                  <span>{countryFlags[user.home_country] || "🌐"}</span>
                  <span className="font-bold text-[11px] truncate max-w-[100px]">{user.name.split(" ")[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-white/[0.08] bg-zinc-950 flex-shrink-0">
                {hubOnline === true ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-semibold text-[11px]">Hub Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-rose-400 font-semibold text-[11px]">Offline</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

