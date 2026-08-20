"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Globe2, ArrowUpRight, Code2, Terminal, Network } from "lucide-react";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#040D14] border-t border-white/[0.08] text-[#9AA3A8] pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/[0.06]">
          {/* Col 1 & 2: Brand & Description */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1F7A63] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40">
                <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  RHI Pay
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30 tracking-wider font-mono">
                  NEXUS
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#9AA3A8] max-w-sm leading-relaxed">
              The single intelligent payment layer connecting international banking networks, instant payment systems, and local currencies into one frictionless, privacy-first protocol.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BIS Nexus Hub-and-Spoke Architecture</span>
            </div>
          </div>

          {/* Col 3: Products & Rails */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Products & Rails
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Dynamic QR Engine
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Location-Aware Travel Mode
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Real-Time FX Liquidity
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Zero-Knowledge Proofs
                </a>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  P2P Instant Transfers
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  World Travelers & Nomads
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  Remote Freelancers
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  Cross-Border Merchants
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  Enterprise Global Payouts
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Platform & Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Platform & Specs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#workflow" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Infrastructure
                </a>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Launch P2P App
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Nexus Telemetry Hub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="text-[#9AA3A8] text-center sm:text-left">
            © 2026 RHI Pay Network. All rights reserved. Instant Cross-Border P2P Settlement.
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Nexus Rails 99.99% Operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
