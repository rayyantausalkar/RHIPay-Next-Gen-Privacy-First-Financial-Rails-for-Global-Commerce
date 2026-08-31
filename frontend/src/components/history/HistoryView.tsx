"use client";

import React, { useState } from "react";
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  X,
  Copy,
  Check,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { SAMPLE_RECENT_TRANSACTIONS, TransactionItem } from "../home/RecentTransactionsFeed";

const EXTENDED_TRANSACTIONS: TransactionItem[] = [
  ...SAMPLE_RECENT_TRANSACTIONS,
  {
    id: "TX-20260828-3012",
    type: "sent",
    counterpartyName: "Bangkok Central Merchant",
    counterpartyProxy: "+66812345678",
    counterpartyCountry: "TH",
    homeAmount: 3776.1,
    homeCurrency: "INR",
    foreignAmount: 1500.0,
    foreignCurrency: "THB",
    status: "SETTLED",
    timestamp: "Aug 28",
    uetr: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
  },
  {
    id: "TX-20260825-9011",
    type: "received",
    counterpartyName: "Dubai Marina Services LLC",
    counterpartyProxy: "+971501234567",
    counterpartyCountry: "AE",
    homeAmount: 11824.0,
    homeCurrency: "INR",
    foreignAmount: 500.0,
    foreignCurrency: "AED",
    status: "SETTLED",
    timestamp: "Aug 25",
    uetr: "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
  },
  {
    id: "TX-20260820-4109",
    type: "sent",
    counterpartyName: "London Tech Consultants",
    counterpartyProxy: "+447911123456",
    counterpartyCountry: "GB",
    homeAmount: 16595.55,
    homeCurrency: "INR",
    foreignAmount: 150.0,
    foreignCurrency: "GBP",
    status: "SETTLED",
    timestamp: "Aug 20",
    uetr: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
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

export const HistoryView: React.FC = () => {
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [copiedUetr, setCopiedUetr] = useState<boolean>(false);

  const filteredList = EXTENDED_TRANSACTIONS.filter((tx) => {
    if (filterType === "sent" && tx.type !== "sent") return false;
    if (filterType === "received" && tx.type !== "received") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.counterpartyName.toLowerCase().includes(q) ||
        tx.counterpartyProxy.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyUetr = (uetr: string) => {
    navigator.clipboard.writeText(uetr);
    setCopiedUetr(true);
    toast.success("UETR copied to clipboard");
    setTimeout(() => setCopiedUetr(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60 border border-white/[0.08] p-4 sm:p-5 rounded-3xl backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Transaction History</span>
          </h2>
          <p className="text-xs text-zinc-400">Complete immutable record of all cross-border transfers</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-white/[0.06]">
          {(["all", "sent", "received"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterType === tab
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by counterparty name, proxy identifier or ID..."
          className="w-full py-2.5 pl-11 pr-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center bg-zinc-950/40 border border-white/[0.06] rounded-3xl">
            <p className="text-sm font-semibold text-zinc-400">No transactions match your search</p>
          </div>
        ) : (
          filteredList.map((tx) => {
            const isReceived = tx.type === "received";
            const flag = COUNTRY_FLAGS[tx.counterpartyCountry] || "🌐";

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="p-4 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900/80 border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isReceived
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
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
                      <span>{flag}</span>
                      <p className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {tx.counterpartyName}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                      <span>{tx.counterpartyProxy}</span>
                      <span>•</span>
                      <span>{tx.timestamp}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-black font-mono ${
                      isReceived ? "text-emerald-400" : "text-zinc-100"
                    }`}
                  >
                    {isReceived ? "+" : "-"} {tx.homeCurrency} {tx.homeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400">
                    ≈ {tx.foreignCurrency} {tx.foreignAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transaction Detail Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#08131d] border border-white/[0.08] rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white">Settlement Receipt</h3>
              <p className="text-2xl font-black font-mono text-emerald-300">
                {selectedTx.type === "received" ? "+" : "-"} {selectedTx.homeCurrency}{" "}
                {selectedTx.homeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zinc-400">
                Equivalent: {selectedTx.foreignCurrency}{" "}
                {selectedTx.foreignAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Transaction ID:</span>
                <span className="font-mono font-semibold text-zinc-200">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Counterparty:</span>
                <span className="font-semibold text-zinc-200">{selectedTx.counterpartyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ISO 20022 Status:</span>
                <span className="font-mono text-emerald-400 font-bold">ACCP_SETTLED_FUNDS_AVAILABLE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">UETR / Ref:</span>
                <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-300">
                  <span className="truncate max-w-[140px]">{selectedTx.uetr}</span>
                  <button onClick={() => handleCopyUetr(selectedTx.uetr)} className="text-zinc-400 hover:text-white">
                    {copiedUetr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
