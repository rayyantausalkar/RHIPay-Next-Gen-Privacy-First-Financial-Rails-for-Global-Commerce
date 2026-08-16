"use client";

import React, { useState, useMemo } from "react";
import { Search, X, Check, Globe2, Plus, Sparkles } from "lucide-react";
import { SpokeNetworkConfig } from "@/types/payment";

interface CountryCurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  spokes: SpokeNetworkConfig[];
  selectedCountry: string;
  selectedCurrency: string;
  onSelect: (countryCode: string, currency: string, defaultProxy?: string) => void;
}

export const CountryCurrencySelectorModal: React.FC<CountryCurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  spokes,
  selectedCountry,
  selectedCurrency,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customCurrency, setCustomCurrency] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const filteredSpokes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return spokes;
    return spokes.filter(
      (s) =>
        s.country_name.toLowerCase().includes(q) ||
        s.country_code.toLowerCase().includes(q) ||
        s.currency.toLowerCase().includes(q) ||
        s.ips_scheme_name.toLowerCase().includes(q)
    );
  }, [spokes, searchQuery]);

  if (!isOpen) return null;

  const handleCustomApply = () => {
    const cc = customCountry.trim().toUpperCase();
    const cur = customCurrency.trim().toUpperCase();
    if (cc.length === 2 && cur.length === 3) {
      onSelect(cc, cur);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#09090b] border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Select Spoke & Currency</h3>
              <p className="text-xs text-zinc-400">Connected to BIS Nexus Multi-Currency Rails</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search country, currency, or IPS rail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
            autoFocus
          />
        </div>

        {/* Spoke List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 py-1">
          {filteredSpokes.map((spoke) => {
            const isSelected =
              spoke.country_code === selectedCountry &&
              spoke.currency === selectedCurrency;

            return (
              <button
                key={`${spoke.country_code}-${spoke.currency}`}
                onClick={() => {
                  onSelect(spoke.country_code, spoke.currency, spoke.default_proxy_example);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${
                  isSelected
                    ? "bg-emerald-500/15 border border-emerald-500/40 text-white"
                    : "hover:bg-white/[0.04] border border-transparent text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{spoke.flag_emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{spoke.country_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-white/[0.08]">
                        {spoke.country_code}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {spoke.ips_scheme_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {spoke.currency}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              </button>
            );
          })}

          {filteredSpokes.length === 0 && !isCustomMode && (
            <div className="text-center py-6 text-xs text-zinc-500">
              No matching spoke found. You can enter any custom ISO code below.
            </div>
          )}
        </div>

        {/* Custom ISO Entry Toggle */}
        <div className="pt-3 border-t border-white/[0.08] mt-2">
          {!isCustomMode ? (
            <button
              onClick={() => setIsCustomMode(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Use Any Other ISO Country / Currency</span>
            </button>
          ) : (
            <div className="p-3 bg-zinc-950 rounded-2xl border border-white/[0.08] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Custom ISO Codes
                </span>
                <button
                  onClick={() => setIsCustomMode(false)}
                  className="text-[10px] text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Country Code (e.g. CH)"
                  maxLength={2}
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value.toUpperCase())}
                  className="px-3 py-2 bg-black border border-white/[0.08] rounded-lg text-xs font-mono text-white placeholder-zinc-500 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Currency (e.g. CHF)"
                  maxLength={3}
                  value={customCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                  className="px-3 py-2 bg-black border border-white/[0.08] rounded-lg text-xs font-mono text-white placeholder-zinc-500 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={customCountry.length !== 2 || customCurrency.length !== 3}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-bold transition-all"
              >
                Apply Custom Corridor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
