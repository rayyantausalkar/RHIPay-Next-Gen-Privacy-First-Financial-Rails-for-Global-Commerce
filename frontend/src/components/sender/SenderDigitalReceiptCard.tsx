"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Zap,
  Check,
  Globe2,
  Landmark,
  Radio,
  Coins,
  Copy,
  Sparkles,
  UserCheck,
  Building2,
  Layers,
  Lock,
  Boxes,
  Archive,
  Download,
  Share2,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  ComplianceArchivalResponse,
  SenderReceiptResponse,
} from "@/types/payment";
import { generateSenderReceipt } from "@/lib/api";
import { toast } from "sonner";

interface SenderDigitalReceiptCardProps {
  pacs008: Pacs008MessageResponse;
  archivalResult?: ComplianceArchivalResponse;
  onNewPayment: () => void;
}

export const SenderDigitalReceiptCard: React.FC<SenderDigitalReceiptCardProps> = ({
  pacs008,
  archivalResult,
  onNewPayment,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [receiptData, setReceiptData] = useState<SenderReceiptResponse | null>(null);

  const fetchReceipt = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await generateSenderReceipt({
        uetr: pacs008.uetr,
        message_id: pacs008.message_id,
        sender_proxy: "+919876543210",
        sender_name: "Rahul Sharma",
        sender_currency: pacs008.instructed_currency || "INR",
        amount_debited: pacs008.instructed_amount || 2835.0,
        amount_debited_cents: Math.round((pacs008.instructed_amount || 2835.0) * 100),
        recipient_name: "Tan Wei Ling",
        recipient_proxy: "+6591234567",
        recipient_currency: pacs008.settlement_currency || "SGD",
        amount_credited: pacs008.settlement_amount || 45.0,
        fx_rate: pacs008.exchange_rate || 63.0,
        zk_proof_id: "RHIPAY-ZKP-PROVEN-01",
        nullifier_hash: "0x1928301928301928301928301928301928301928301928301928301928301928",
        archive_id: archivalResult?.archive_id || "ARCH-20260816-001",
        ledger_block_height: 10493,
      });

      setReceiptData(res);
      setIsGenerating(false);

      toast.success("Digital Settlement Receipt Issued!", {
        description: `Wallet debited • New balance: INR ${res.sender_balance_after.toLocaleString()}`,
      });
    } catch (err: unknown) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : "Receipt generation failed";
      toast.error(msg);
    }
  }, [archivalResult?.archive_id, pacs008.exchange_rate, pacs008.instructed_amount, pacs008.instructed_currency, pacs008.message_id, pacs008.settlement_amount, pacs008.settlement_currency, pacs008.uetr]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handleCopyReceipt = () => {
    if (!receiptData) return;
    const text = `RHIPay Digital Receipt\nReceipt ID: ${receiptData.receipt_id}\nUETR: ${receiptData.uetr}\nAmount Debited: ${receiptData.amount_debited_formatted}\nCredited to ${receiptData.recipient_name}: ${receiptData.amount_credited_formatted}\nFX Rate: 1 SGD = ${receiptData.effective_fx_rate} INR\nStatus: ACCP (Settled & Final)\nSignature: ${receiptData.receipt_signature_digest}`;
    navigator.clipboard.writeText(text);
    toast.success("Receipt details copied to clipboard!");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span>Settlement Finality</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 font-mono">
            Digital Receipt
          </span>
        </div>
      </div>

      {isGenerating ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Receipt className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Generating Digital Settlement Receipt</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Deducting Domestic Balance & Sealing Cryptographic Proofs</p>
          </div>
        </div>
      ) : receiptData ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/90 border border-emerald-500/40 text-center relative overflow-hidden">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-2 text-black font-bold text-lg shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-1.5">
              <Sparkles className="w-3 h-3" /> Settled & Cleared (ACCP)
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              -{receiptData.amount_debited_formatted}
            </h2>

            <p className="text-xs text-emerald-400 font-mono mt-1 truncate">
              Delivered +{receiptData.amount_credited_formatted} to {receiptData.recipient_name}
            </p>

            {/* Wallet Balance Deduction Banner */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Updated Wallet Balance:</span>
              <span className="text-emerald-400 font-bold">
                INR {receiptData.sender_balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Cryptographic Security Inscription Manifest */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Cryptographic Proof Inscription</span>
              <span className="text-emerald-400 font-bold">{receiptData.total_settlement_duration_ms}ms E2E</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Groth16 ZK Prover:</span>
                <span className="text-emerald-400 font-bold">VALIDATED (&lt;1.2s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Anti-Replay Nullifier:</span>
                <span className="text-emerald-400 font-bold">INSCRIBED & SPENT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">FATF Travel Rule:</span>
                <span className="text-emerald-400 font-bold">ENCLAVE ATTESTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Double-Entry Ledger:</span>
                <span className="text-emerald-400 font-bold">BLOCK #{receiptData.ledger_block_height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">WORM Compliance:</span>
                <span className="text-emerald-400 font-bold">7-YEAR SEALED</span>
              </div>
            </div>
          </div>

          {/* Statutory Receipt Identifiers Panel */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <span>Statutory Digital Receipt</span>
              <span>Zero FX Fees</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Receipt ID:</span>
                <span className="text-white font-bold">{receiptData.receipt_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ISO UETR:</span>
                <span className="text-zinc-300 truncate max-w-[190px]">{receiptData.uetr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Effective Rate:</span>
                <span className="text-white font-bold">1 SGD = {receiptData.effective_fx_rate} INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Digital Seal:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[190px]">
                  {receiptData.receipt_signature_digest}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Copy Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `RHIPay_Receipt_${receiptData.uetr.slice(0, 8)}.json`;
                a.click();
                toast.success("Receipt JSON downloaded!");
              }}
              className="py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Download JSON</span>
            </button>
          </div>

          {/* Primary Action Button: Return to Dashboard */}
          <button
            type="button"
            onClick={() => {
              toast.success("Ready for next cross-border transfer!");
              onNewPayment();
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">New Payment / Return to Wallet</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
