"use client";

import React from "react";
import { Building2, Globe, Plane, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HomeHeaderInfoProps {
  onOpenJourneyModal: () => void;
  activeJourney?: any;
}

const COUNTRY_FLAGS: Record<string, string> = {
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

const COUNTRY_NAMES: Record<string, string> = {
  SG: "Singapore",
  IN: "India",
  AE: "UAE",
  US: "USA",
  GB: "UK",
  EU: "Eurozone",
  JP: "Japan",
  TH: "Thailand",
  MY: "Malaysia",
  AU: "Australia",
  CA: "Canada",
  BR: "Brazil",
};

export const HomeHeaderInfo: React.FC<HomeHeaderInfoProps> = ({
  onOpenJourneyModal,
  activeJourney,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const flag = COUNTRY_FLAGS[user.home_country] || "🌐";
  const countryName = COUNTRY_NAMES[user.home_country] || user.home_country;

  const isPending = activeJourney?.status === "PENDING";
  const isApproved = activeJourney?.status === "APPROVED" || Boolean(user.active_journey_country);
  const destCountry = activeJourney?.destination_country || user.active_journey_country;

  return (
    <div className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-3xl p-3 sm:p-4 backdrop-blur-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Home Country & Selected Bank (Unchangeable) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
          {/* Home Country Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-200 shadow-sm flex-shrink-0"
            title="Registered Home Country (Unchangeable)"
          >
            <span className="text-base leading-none">{flag}</span>
            <span className="text-zinc-100 font-bold">{countryName}</span>
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/80 px-1 py-0.2 rounded">Fixed</span>
          </div>

          {/* Bank Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-200 shadow-sm flex-shrink-0 max-w-[200px] sm:max-w-[240px]"
            title="Selected Member Bank (Unchangeable)"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate text-zinc-100">{user.bank_name}</span>
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/80 px-1 py-0.2 rounded hidden sm:inline">Fixed</span>
          </div>
        </div>

        {/* Right: Select / Start Journey Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          {isPending ? (
            <button
              onClick={onOpenJourneyModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all active:scale-95 animate-pulse"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Journey Pending Review</span>
            </button>
          ) : isApproved && destCountry ? (
            <button
              onClick={onOpenJourneyModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-xs font-bold text-emerald-300 transition-all active:scale-95"
            >
              <span>{COUNTRY_FLAGS[destCountry] || "✈️"}</span>
              <span>Active: {COUNTRY_NAMES[destCountry] || destCountry}</span>
              <span className="text-[10px] text-emerald-400 font-mono underline ml-1">Plan More</span>
            </button>
          ) : (
            <button
              onClick={onOpenJourneyModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plane className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Select / Start Journey</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
