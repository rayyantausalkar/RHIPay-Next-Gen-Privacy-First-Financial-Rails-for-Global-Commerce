"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  CheckCircle2,
  Lock,
  Sparkles
} from "lucide-react";
import landingHeroImg from "@/assets/landingHero.png";

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section className="relative min-h-[88vh] pt-32 pb-16 overflow-hidden flex items-center bg-[#040D14] bg-mesh-pattern bg-grid-lines">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#1F7A63]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#10B981]/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Copy, and CTAs */}
          <div className="lg:col-span-6 space-y-7 text-center lg:text-left z-10">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#081C2D]/80 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-emerald-300 font-mono">
                Smart Payments. Global Impact.
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl lg:text-[60px] font-extrabold tracking-tight text-white leading-[1.1]">
                Enable Payments.{" "}
                <span className="block mt-1 text-gradient-emerald">
                  Empower the World.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[#9AA3A8] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed pt-1">
                RHI Pay is a next-generation payment platform that connects businesses and individuals globally with speed, security, and intelligence.
              </p>
            </div>

            {/* CTAs Button Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
              <Link
                href="/app"
                className="btn-pressable w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-bold text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] hover:brightness-110 rounded-2xl shadow-xl shadow-emerald-500/35 ring-1 ring-emerald-400/60 transition-all group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#solutions"
                className="btn-pressable w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-[#F5F7FA] bg-[#081C2D]/80 hover:bg-[#081C2D] hover:text-white border border-white/[0.12] hover:border-emerald-500/40 rounded-2xl backdrop-blur-md transition-all"
              >
                <span>Explore Solutions</span>
              </a>
            </div>

            {/* Value Guarantees */}
            <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#9AA3A8]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Settlement (&lt;3s)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero-Knowledge Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>200+ Countries</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Hero Artwork with animated dotted elements, NO CARD wrapper */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="lg:col-span-6 relative flex items-center justify-center py-6 select-none"
          >
            {/* Animated Dotted Orbital Rings */}
            <div className="absolute w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full border-2 border-dotted border-emerald-400/25 animate-orbit-spin pointer-events-none" />
            <div className="absolute w-[260px] sm:w-[380px] h-[260px] sm:h-[380px] rounded-full border border-dashed border-emerald-500/20 animate-orbit-spin-reverse pointer-events-none" />

            {/* Orbiting / Floating Dotted Particle Elements */}
            <div className="absolute top-4 left-8 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse-glow pointer-events-none" />
            <div className="absolute top-12 right-12 w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_10px_#10b981] animate-float-slow pointer-events-none" style={{ animationDelay: "1s" }} />
            <div className="absolute bottom-10 left-12 w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_14px_#10b981] animate-float-reverse pointer-events-none" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-6 right-16 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse-glow pointer-events-none" style={{ animationDelay: "0.5s" }} />
            <div className="absolute top-1/2 -left-4 w-1.5 h-1.5 rounded-full bg-emerald-300/80 shadow-[0_0_8px_#34d399] animate-pulse pointer-events-none" />
            <div className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-emerald-400/90 shadow-[0_0_10px_#10b981] animate-float-slow pointer-events-none" />

            {/* Direct 3D Floating Hero Image (No card box, No background, No border) */}
            <div
              className="relative w-full max-w-[560px] transition-transform duration-300 ease-out will-change-transform flex items-center justify-center"
              style={{
                transform: isHovered
                  ? `perspective(1000px) rotateY(${mousePos.x * 10}deg) rotateX(${-mousePos.y * 10}deg) scale3d(1.02, 1.02, 1.02)`
                  : "perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)",
              }}
            >
              <div className="relative animate-float-slow">
                <Image
                  src={landingHeroImg}
                  alt="RHI Pay Global Smart Payments Globe and Card"
                  priority
                  className="w-full h-auto object-contain drop-shadow-[0_20px_45px_rgba(16,185,129,0.2)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
