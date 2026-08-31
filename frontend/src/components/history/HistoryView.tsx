"use client";

import React, { useState, useEffect } from "react";
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
  Plane,
  RefreshCcw,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, TransactionItem } from "@/context/AuthContext";

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
  const { user, getUserTransactions } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<"all" | "sent" | "received" | "journeys">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [copiedUetr, setCopiedUetr] = useState<boolean>(false);

  const fetchTransactions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getUserTransactions(user.id);
      setTransactions(data);
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const filteredList = transactions.filter((tx) => {
    const isSender = tx.sender_user_id === user?.id;
    const isJourney = tx.category === "JOURNEY_ALLOCATION" || tx.category === "JOURNEY_CANCELLATION_REFUND";

    if (filterType === "sent" && (!isSender || isJourney)) return false;
    if (filterType === "received" && (isSender || isJourney)) return false;
    if (filterType === "journeys" && !isJourney) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.recipient_name.toLowerCase().includes(q) ||
        tx.sender_name.toLowerCase().includes(q) ||
        tx.recipient_proxy.toLowerCase().includes(q) ||
        tx.sender_proxy.toLowerCase().includes(q) ||
        tx.transaction_id.toLowerCase().includes(q) ||
        tx.uetr.toLowerCase().includes(q)
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
          <p className="text-xs text-zinc-400">Live immutable ledger of real cross-border transfers</p>
        </div>

        {/* Filter Buttons & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.06] rounded-2xl text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-white/[0.06] overflow-x-auto">
            {(["all", "sent", "received", "journeys"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
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
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by counterparty name, proxy identifier, ID, or UETR..."
          className="w-full py-2.5 pl-11 pr-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-16 text-center space-y-2 bg-zinc-950/40 border border-white/[0.06] rounded-3xl">
            <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Fetching database records...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center bg-zinc-950/40 border border-white/[0.06] rounded-3xl">
            <p className="text-sm font-semibold text-zinc-400">No transactions match your search or filter</p>
          </div>
        ) : (
          filteredList.map((tx) => {
            const isSender = tx.sender_user_id === user?.id;
            const isJourneyAlloc = tx.category === "JOURNEY_ALLOCATION";
            const isJourneyRefund = tx.category === "JOURNEY_CANCELLATION_REFUND";

            const flag = isSender
              ? COUNTRY_FLAGS[tx.recipient_country] || "🌐"
              : COUNTRY_FLAGS[tx.sender_country] || "🌐";

            const title = isJourneyAlloc
              ? "Travel Allocation (Wallet Vault)"
              : isJourneyRefund
              ? "Travel Refund (Bank Account)"
              : isSender
              ? tx.recipient_name
              : tx.sender_name;

            const subtitle = isJourneyAlloc || isJourneyRefund
              ? tx.purpose_code
              : isSender
              ? tx.recipient_proxy
              : tx.sender_proxy;

            return (
              <div
                key={tx.transaction_id}
                onClick={() => setSelectedTx(tx)}
                className="p-4 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900/80 border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isJourneyAlloc
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : isJourneyRefund
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : !isSender
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    }`}
                  >
                    {isJourneyAlloc ? (
                      <Plane className="w-5 h-5 stroke-[2.2]" />
                    ) : isJourneyRefund ? (
                      <RefreshCcw className="w-5 h-5 stroke-[2.2]" />
                    ) : !isSender ? (
                      <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{flag}</span>
                      <p className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {title}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                      <span className="truncate max-w-[160px]">{subtitle}</span>
                      <span>•</span>
                      <span>{new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-black font-mono ${
                      isJourneyAlloc
                        ? "text-amber-400"
                        : isJourneyRefund
                        ? "text-purple-400"
                        : !isSender
                        ? "text-emerald-400"
                        : "text-zinc-100"
                    }`}
                  >
                    {isJourneyAlloc ? "-" : isJourneyRefund ? "+" : !isSender ? "+" : "-"} {tx.sender_currency} {Number(tx.sender_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400">
                    ≈ {tx.recipient_currency} {Number(tx.recipient_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white">Settlement Receipt</h3>
              <p className="text-2xl font-black font-mono text-emerald-300">
                {selectedTx.sender_currency} {Number(selectedTx.sender_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zinc-400">
                Equivalent: {selectedTx.recipient_currency} {Number(selectedTx.recipient_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Transaction ID:</span>
                <span className="font-mono font-semibold text-zinc-200">{selectedTx.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sender:</span>
                <span className="font-semibold text-zinc-200">{selectedTx.sender_name} ({selectedTx.sender_account_number || "Primary Acct"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Recipient:</span>
                <span className="font-semibold text-zinc-200">{selectedTx.recipient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Category:</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedTx.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ISO 20022 Status:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedTx.iso_status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">UETR / Ref:</span>
                <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-300">
                  <span className="truncate max-w-[140px]">{selectedTx.uetr}</span>
                  <button onClick={() => handleCopyUetr(selectedTx.uetr)} className="text-zinc-400 hover:text-white cursor-pointer">
                    {copiedUetr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {selectedTx.note && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Note:</span>
                  <span className="text-zinc-300 italic">{selectedTx.note}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
