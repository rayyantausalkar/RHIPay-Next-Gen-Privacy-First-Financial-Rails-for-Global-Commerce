"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 transition-all duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Animated Glowing Border Floating Navbar Dock */}
        <div className="glowing-navbar-container">
          <div className="glowing-navbar-content px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
            {/* 1. Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#1F7A63] via-[#10B981] to-[#34D399] flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300/50 group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black stroke-[2.5]" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#040D14] animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  RHI Pay
                </span>
                <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/40 tracking-wider font-mono shadow-sm">
                  NEXUS
                </span>
              </div>
            </Link>

            {/* 2. Center Desktop Navigation Links (Clean Text Links without Box) */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <a
                href="#about"
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-emerald-300 transition-colors duration-150 relative py-1"
              >
                About
              </a>
              <a
                href="#solutions"
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-emerald-300 transition-colors duration-150 relative py-1"
              >
                Solution
              </a>
              <a
                href="#features"
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-emerald-300 transition-colors duration-150 relative py-1"
              >
                Features
              </a>
              <a
                href="#workflow"
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-emerald-300 transition-colors duration-150 relative py-1"
              >
                How It Works
              </a>
            </nav>

            {/* 3. Right Action Area: Login / Get Started or Logged-in Profile */}
            <div className="hidden sm:flex items-center gap-2.5">
              {user ? (
                // Authenticated User Menu
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
                  >
                    <span className="text-sm">
                      {countryFlags[user.home_country] || "🌐"}
                    </span>
                    <span className="font-semibold text-emerald-300">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#081c2d]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] font-mono text-zinc-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                          {user.bank_name}
                        </span>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <Link
                          href="/app"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-emerald-500/15 rounded-xl transition-colors font-medium"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Open Nexus Hub</span>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            toast.info("Logged out of RHI Pay");
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-colors font-medium text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Unauthenticated Guest Actions
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] rounded-full transition-all active:scale-95"
                  >
                    Log In
                  </Link>

                  <Link
                    href="/signup"
                    className="btn-pressable flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-extrabold text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] hover:brightness-110 rounded-full shadow-md shadow-emerald-500/30 ring-1 ring-emerald-300/60 transition-all group"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex sm:hidden items-center gap-2">
              <Link
                href={user ? "/app" : "/signup"}
                className="px-3 py-1.5 text-[11px] font-bold text-black bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-md shadow-emerald-500/30"
              >
                {user ? "Hub" : "Get Started"}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 hover:text-white active:scale-95"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-2 p-4 rounded-3xl bg-[#06121C]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-center"
              >
                About
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-center"
              >
                Solution
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-center"
              >
                Features
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 text-center"
              >
                How It Works
              </a>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              {user ? (
                <>
                  <Link
                    href="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-bold text-black bg-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/30"
                  >
                    Open Nexus Hub →
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-semibold text-white bg-white/[0.06] rounded-2xl border border-white/10"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-bold text-black bg-gradient-to-r from-emerald-400 to-teal-300 rounded-2xl shadow-lg shadow-emerald-500/30"
                  >
                    Get Started →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
