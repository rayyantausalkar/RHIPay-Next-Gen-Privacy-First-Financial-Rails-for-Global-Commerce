"use client";

import React from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustMarquee } from "@/components/landing/TrustMarquee";
import { AboutSection } from "@/components/landing/AboutSection";
import { SolutionsSection } from "@/components/landing/SolutionsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#040D14] text-[#F5F7FA] relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Glassmorphic Navigation */}
      <LandingNavbar />

      {/* 1. Hero Section (Clean 3D visual with landingHero.png) */}
      <HeroSection />

      {/* 2. Trust & Keywords Marquee (Secure, Global Payments, etc.) */}
      <TrustMarquee />

      {/* 3. About Section: The Single Intelligent Layer */}
      <AboutSection />

      {/* 4. Solutions Section: Individuals & Travelers vs Businesses */}
      <SolutionsSection />

      {/* 5. Features Section: Core Capabilities */}
      <FeaturesSection />

      {/* 6. How to Use / Workflow Section */}
      <WorkflowSection />

      {/* 7. Call To Action Banner */}
      <CtaBanner />

      {/* 8. Footer */}
      <LandingFooter />
    </div>
  );
}
