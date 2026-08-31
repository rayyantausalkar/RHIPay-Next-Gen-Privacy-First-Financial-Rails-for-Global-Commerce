"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Clock, CheckCircle2, ShieldCheck } from "lucide-react";

export interface TransactionItem {
  id: string;
  type: "sent" | "received";
  counterpartyName: string;
  counterpartyProxy: string;
  counterpartyCountry: string;
  homeAmount: number;
  homeCurrency: string;
  foreignAmount: number;
  foreignCurrency: string;
  status: "SETTLED" | "PROCESSING" | "FAILED";
  timestamp: string;
  uetr: string;
}

interface RecentTransactionsFeedProps {
  onSeeAll: () => void;
  onSelectTransaction?: (tx: TransactionItem) => void;
}

export const SAMPLE_RECENT_TRANSACTIONS: TransactionItem[] = [
  {
    id: "TX-20260831-9812",
    type: "received",
    counterpartyName: "Tan Wei Ling",
    counterpartyProxy: "+6591234567",
    counterpartyCountry: "SG",
    homeAmount: 2835.0,
    homeCurrency: "INR",
    foreignAmount: 45.0,
    foreignCurrency: "SGD",
    status: "SETTLED",
    timestamp: "10:42 AM",
    uetr: "7a9b3c4d-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  },
  {
    id: "TX-20260831-4821",
    type: "sent",
    counterpartyName: "Marcus Vance",
    counterpartyProxy: "+14155552671",
    counterpartyCountry: "US",
    homeAmount: 4342.5,
    homeCurrency: "INR",
    foreignAmount: 50.0,
    foreignCurrency: "USD",
    status: "SETTLED",
    timestamp: "Yesterday",
    uetr: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  },
  {
    id: "TX-20260830-1092",
    type: "received",
    counterpartyName: "Hiroshi Tanaka",
    counterpartyProxy: "+819012345678",
    counterpartyCountry: "JP",
    homeAmount: 5669.0,
    homeCurrency: "INR",
    foreignAmount: 10000.0,
    foreignCurrency: "JPY",
    status: "SETTLED",
    timestamp: "Aug 29",
    uetr: "9f8e7d6c-5b4a-3a2b-1c0d-9e8f7a6b5c4d",
  },
];

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

export const RecentTransactionsFeed: React.FC<RecentTransactionsFeedProps> = ({
  onSeeAll,
  onSelectTransaction,
}) => {
  return (
    <div className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Transactions</h3>
          <p className="text-[11px] text-zinc-400">Cross-border atomic settlement ledger</p>
        </div>

        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
        >
          <span>See All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {SAMPLE_RECENT_TRANSACTIONS.map((tx) => {
          const isReceived = tx.type === "received";
          const flag = COUNTRY_FLAGS[tx.counterpartyCountry] || "🌐";

          return (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction?.(tx)}
              className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] flex items-center justify-between transition-all cursor-pointer group"
            >
              {/* Left: Icon & Counterparty */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isReceived
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                  }`}
                >
                  {isReceived ? (
                    <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{flag}</span>
                    <p className="text-xs sm:text-sm font-bold text-zinc-100 truncate group-hover:text-white transition-colors">
                      {tx.counterpartyName}
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                    <span>{tx.counterpartyProxy}</span>
                    <span>•</span>
                    <span>{tx.timestamp}</span>
                  </p>
                </div>
              </div>

              {/* Right: Amounts & Status */}
              <div className="text-right flex-shrink-0">
                <p
                  className={`text-xs sm:text-sm font-black font-mono ${
                    isReceived ? "text-emerald-400" : "text-zinc-200"
                  }`}
                >
                  {isReceived ? "+" : "-"} {tx.homeCurrency} {tx.homeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] font-mono text-zinc-400">
                  ≈ {tx.foreignCurrency} {tx.foreignAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
