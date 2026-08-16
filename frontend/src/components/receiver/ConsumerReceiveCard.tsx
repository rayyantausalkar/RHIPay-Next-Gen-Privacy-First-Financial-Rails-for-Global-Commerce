"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  QrCode,
  ArrowRight,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import {
  DynamicPaymentRequestCreate,
  DynamicPaymentRequestResponse,
  SpokeNetworkConfig,
} from "@/types/payment";
import { UserProfile, PRESET_P2P_PROFILES } from "@/types/user";
import { createPaymentRequest, getNetworkSpokes } from "@/lib/api";
import { CountryCurrencySelectorModal } from "./CountryCurrencySelectorModal";
import { toast } from "sonner";

interface ConsumerReceiveCardProps {
  onRequestGenerated: (request: DynamicPaymentRequestResponse) => void;
}

export const ConsumerReceiveCard: React.FC<ConsumerReceiveCardProps> = ({
  onRequestGenerated,
}) => {
  // Current Logged-in User Profile (Auto-bound)
  const [currentUser, setCurrentUser] = useState<UserProfile>(PRESET_P2P_PROFILES[0]);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState<boolean>(false);

  // Spoke & Currency State
  const [spokes, setSpokes] = useState<SpokeNetworkConfig[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(currentUser.country_code);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currentUser.currency);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Amount & Note State
  const [amountStr, setAmountStr] = useState<string>("45.00");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick preset amounts
  const quickAmounts = [10, 25, 50, 100];

  // Fetch spokes on mount
  useEffect(() => {
    const fetchSpokes = async () => {
      try {
        const res = await getNetworkSpokes();
        setSpokes(res.spokes);
      } catch {
        // Handled in API
      }
    };
    fetchSpokes();
  }, []);

  // When switching profiles, update bound proxy & destination defaults
  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    setSelectedCountry(profile.country_code);
    setSelectedCurrency(profile.currency);
    setShowProfileSwitcher(false);
    toast.info(`Switched active profile to ${profile.name} (${profile.country_name})`);
  };

  const handleSelectCountryCurrency = (
    countryCode: string,
    currency: string
  ) => {
    setSelectedCountry(countryCode);
    setSelectedCurrency(currency);
  };

  const handleQuickAdd = (val: number) => {
    const current = parseFloat(amountStr) || 0;
    const updated = (current + val).toFixed(2);
    setAmountStr(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amountStr);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DynamicPaymentRequestCreate = {
        recipient_name: currentUser.name,
        recipient_proxy_type: currentUser.proxy_type,
        recipient_proxy_value: currentUser.proxy_value.replace(/\s+/g, ""),
        destination_country: selectedCountry.toUpperCase(),
        destination_currency: selectedCurrency.toUpperCase(),
        requested_amount: numAmount,
        note: note.trim() || undefined,
        expiry_seconds: 900,
        purpose_code: "P2P_TRANSFER",
      };

      const result = await createPaymentRequest(payload);
      toast.success("Payment Request QR Ready!", {
        description: `Request for ${Number(result.requested_amount).toFixed(2)} ${result.destination_currency}`,
      });
      onRequestGenerated(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create request";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSpokeConfig = spokes.find((s) => s.country_code === selectedCountry);

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Logged-in User Profile Top Card */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3">
            {/* Avatar Initials */}
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-sm text-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40">
              {currentUser.avatar_initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  {currentUser.name}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <UserCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {currentUser.proxy_value} • {currentUser.ips_network}
              </p>
            </div>
          </div>

          {/* Switch Profile Button */}
          <button
            type="button"
            onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-300 border border-white/[0.08] transition-colors"
            title="Switch demo profile"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] hidden sm:inline">Switch</span>
          </button>
        </div>

        {/* Profile Switcher Popover */}
        {showProfileSwitcher && (
          <div className="absolute top-full left-0 right-0 mt-2 z-20 p-2 bg-black border border-white/10 rounded-2xl shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Select Demo Identity
            </div>
            {PRESET_P2P_PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProfile(p)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                  currentUser.id === p.id
                    ? "bg-emerald-500/15 text-white font-semibold border border-emerald-500/30"
                    : "hover:bg-white/[0.04] text-zinc-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{p.flag_emoji}</span>
                  <div>
                    <div className="text-xs font-semibold">{p.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.proxy_value}</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{p.currency}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Compact Spoke & Currency Pill Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            Receiving into
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-white/[0.08] hover:border-emerald-500/40 transition-all text-xs font-medium text-white shadow-inner group"
          >
            <span className="text-base">
              {currentSpokeConfig?.flag_emoji || "🌐"}
            </span>
            <span className="font-bold font-mono text-emerald-400">
              {selectedCurrency}
            </span>
            <span className="text-zinc-400 font-sans text-[11px] hidden sm:inline">
              ({selectedCountry})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        {/* 3. Hero Center-Aligned Amount Input */}
        <div className="py-3 text-center">
          <div className="inline-flex items-baseline justify-center gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight select-none">
              {currentUser.currency_symbol || selectedCurrency}
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-48 sm:w-56 text-center text-4xl sm:text-5xl font-extrabold text-white bg-transparent border-b-2 border-transparent hover:border-white/10 focus:border-emerald-400 focus:outline-none transition-all font-mono tracking-tight placeholder-zinc-700"
              autoFocus
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Direct instant settlement to your {currentUser.ips_network}
          </p>

          {/* Quick Amount Chips */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-white/[0.08] hover:border-emerald-500/40 transition-all active:scale-95"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Optional Personal Note */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Personal Note (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Dinner split 🍕, Rent, Concert ticket"
              className="w-full px-4 py-3 bg-zinc-950 border border-white/[0.08] rounded-2xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* 5. Primary Action Button (Vibrant Emerald on Black) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] group"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Generating Secure QR...</span>
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Generate Request QR</span>
              <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Country Currency Selector Modal */}
      <CountryCurrencySelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        spokes={spokes}
        selectedCountry={selectedCountry}
        selectedCurrency={selectedCurrency}
        onSelect={handleSelectCountryCurrency}
      />
    </div>
  );
};
