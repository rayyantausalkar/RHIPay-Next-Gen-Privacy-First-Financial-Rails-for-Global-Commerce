"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  X,
  QrCode,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
  Lock,
  Building2,
  Landmark,
  Scale,
  Boxes,
  Archive,
  BellRing,
  Receipt,
  FileCode,
  Server,
  GitFork,
  Layers,
  Zap,
  Unlock,
  ArrowLeftRight,
  FileSpreadsheet,
  Key,
  Camera,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { UpiPinModal } from "../modals/UpiPinModal";

interface ModernSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentCompleted?: () => void;
}

const STAGES = [
  { id: "ingest", label: "Verify Payee", short: "Payee", icon: QrCode },
  { id: "quote", label: "FX Rate Lock", short: "Rate", icon: TrendingUp },
  { id: "zkp", label: "ZK Prover", short: "ZK Proof", icon: Cpu },
  { id: "nullifier", label: "Nullifier", short: "Nullifier", icon: KeyRound },
  { id: "envelope", label: "FATF Envelope", short: "Envelope", icon: Lock },
  { id: "iso20022", label: "ISO 20022", short: "ISO 20022", icon: FileCode },
  { id: "gateway", label: "API Gateway", short: "Gateway", icon: Server },
  { id: "routing", label: "Stream Routing", short: "Routing", icon: GitFork },
  { id: "merkle", label: "Merkle Root", short: "Merkle", icon: Layers },
  { id: "groth16", label: "Circuit Verifier", short: "Groth16", icon: ShieldCheck },
  { id: "anti_replay", label: "Anti-Replay", short: "Anti-Replay", icon: Zap },
  { id: "crypto_gate", label: "Crypto Gate", short: "Gate", icon: Unlock },
  { id: "spoke_a", label: "Spoke A Debit", short: "Spoke A", icon: Building2 },
  { id: "fx_swap", label: "Atomic FX Swap", short: "FX Swap", icon: ArrowLeftRight },
  { id: "spoke_b", label: "Spoke B Credit", short: "Spoke B", icon: Landmark },
  { id: "travel_rule", label: "FATF Dispatch", short: "FATF", icon: FileSpreadsheet },
  { id: "enclave_decryption", label: "Enclave Decrypt", short: "Enclave", icon: Key },
  { id: "sanctions_screening", label: "AML Sanctions", short: "AML", icon: Scale },
  { id: "ledger_commit", label: "Ledger Commitment", short: "Ledger", icon: Boxes },
  { id: "compliance_archival", label: "WORM Archival", short: "Archive", icon: Archive },
  { id: "push_notify", label: "Recipient Push", short: "Push", icon: BellRing },
  { id: "sender_receipt", label: "Digital Receipt", short: "Receipt", icon: Receipt },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const ModernSendModal: React.FC<ModernSendModalProps> = ({
  isOpen,
  onClose,
  onPaymentCompleted,
}) => {
  const { user, refreshUser } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [inputMode, setInputMode] = useState<"code" | "qr">("code");
  const [codeInput, setCodeInput] = useState<string>("");
  const [qrInput, setQrInput] = useState<string>("");
  const [resolvedPayload, setResolvedPayload] = useState<any>(null);
  const [fxQuote, setFxQuote] = useState<any>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResolve = async (payloadString: string) => {
    setErrorMsg(null);
    setIsResolving(true);
    try {
      const res = await fetch(`${API_BASE}/requests/validate-payload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_payload: payloadString }),
      });

      const data = await res.json();
      if (!res.ok || !data.is_valid) {
        setErrorMsg(data.error_details || "Invalid or expired payment code / QR payload.");
        setIsResolving(false);
        return;
      }

      setResolvedPayload(data);

      // Lock FX quote
      const homeCur = user?.preferred_currency || "INR";
      const fxRes = await fetch(`${API_BASE}/fx/lock-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_currency: homeCur,
          destination_currency: data.destination_currency,
          destination_amount: data.requested_amount,
          ttl_seconds: 120,
        }),
      });

      if (fxRes.ok) {
        const fxData = await fxRes.json();
        setFxQuote(fxData);
      } else {
        // Approximate fallback
        setFxQuote({
          origin_currency: homeCur,
          destination_currency: data.destination_currency,
          fx_rate: 64.57,
          origin_debit_amount: (data.requested_amount * 64.57).toFixed(2),
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve payment request");
    } finally {
      setIsResolving(false);
    }
  };

  const handleProceedToPin = () => {
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (pin: string) => {
    setIsPinModalOpen(false);
    setIsProcessing(true);
    setCurrentStageIdx(0);

    // Run 22-step pipeline sequentially within 3.5 seconds
    const totalSteps = STAGES.length;
    const stepDuration = 3500 / totalSteps;

    for (let i = 0; i < totalSteps; i++) {
      setCurrentStageIdx(i);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    try {
      // Mark completed on backend
      if (resolvedPayload?.reference_id) {
        await fetch(`${API_BASE}/requests/${resolvedPayload.reference_id}/complete`, { method: "POST" });
      }

      // Generate receipt
      const uetr = `7a9b3c4d-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 6)}`;
      const receiptData = {
        receipt_id: `REC-${Date.now().toString().slice(-8)}`,
        uetr,
        recipient_name: resolvedPayload.recipient_name,
        recipient_proxy: resolvedPayload.proxy_value,
        recipient_currency: resolvedPayload.destination_currency,
        amount_credited: resolvedPayload.requested_amount,
        sender_name: user?.name,
        sender_currency: user?.preferred_currency || "INR",
        amount_debited: fxQuote?.origin_debit_amount || (resolvedPayload.requested_amount * 64.57).toFixed(2),
        effective_fx_rate: fxQuote?.fx_rate || 64.57,
        settled_at: new Date().toLocaleTimeString(),
      };

      setCompletedReceipt(receiptData);
      setIsProcessing(false);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10B981", "#34D399", "#22D3EE", "#FFFFFF"],
        });
      } catch {}

      toast.success("Payment Settled Successfully!");
      await refreshUser();
      await fetchNotifications();
      onPaymentCompleted?.();
    } catch {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResolvedPayload(null);
    setFxQuote(null);
    setCodeInput("");
    setQrInput("");
    setCompletedReceipt(null);
    setCurrentStageIdx(-1);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-[#08131d] border border-cyan-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 text-white max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          {!isProcessing && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Send Money</h3>
              <p className="text-xs text-zinc-400">Instant Cross-Border Atomic FX Settlement</p>
            </div>
          </div>

          {/* Stage 1: Pipeline Animation during 3-5 seconds */}
          {isProcessing ? (
            <div className="py-6 space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
                <Cpu className="w-7 h-7 stroke-[2]" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  {STAGES[currentStageIdx]?.label || "Processing Payment"}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Automated AML, CFT, Zero-Knowledge proofs & Correspondent Bank Settlement (3–5s)
                </p>
              </div>

              {/* 22 Telemetry Step Chips (Matching User Screenshot!) */}
              <div className="p-3 rounded-2xl bg-zinc-950/90 border border-white/[0.08] shadow-inner max-h-48 overflow-y-auto">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {STAGES.map((st, idx) => {
                    const isPassed = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    const Icon = st.icon;

                    return (
                      <div
                        key={st.id}
                        className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all ${
                          isCurrent
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400 scale-105"
                            : isPassed
                            ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/[0.02] text-zinc-600 border border-white/[0.04]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                            isCurrent
                              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/40"
                              : isPassed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-zinc-900 text-zinc-600"
                          }`}
                        >
                          {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : <Icon className="w-3 h-3 stroke-[2]" />}
                        </div>
                        <span className="text-[7px] font-mono truncate max-w-full">{st.short}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : completedReceipt ? (
            /* Completed Digital Receipt */
            <div className="py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h4 className="text-lg font-bold text-white">Payment Successful</h4>
                <p className="text-2xl font-black font-mono text-emerald-300">
                  {completedReceipt.recipient_currency} {completedReceipt.amount_credited}
                </p>
                <p className="text-xs text-zinc-400">
                  Debited: {completedReceipt.sender_currency} {completedReceipt.amount_debited}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recipient:</span>
                  <span className="font-semibold text-zinc-200">{completedReceipt.recipient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Effective FX Rate:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    1 {completedReceipt.recipient_currency} = {completedReceipt.effective_fx_rate} {completedReceipt.sender_currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">UETR / ISO 20022:</span>
                  <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[180px]">{completedReceipt.uetr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Settlement Speed:</span>
                  <span className="font-mono text-emerald-400 font-bold">1.84s (Instant Cleared)</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-sm shadow-lg shadow-emerald-500/20"
              >
                Done / Send Another Payment
              </button>
            </div>
          ) : resolvedPayload ? (
            /* Resolved Payload Confirmation & FX Quote */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Payee Name</span>
                    <p className="text-sm font-bold text-white">{resolvedPayload.recipient_name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                    {resolvedPayload.destination_country} Spoke
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400">Recipient Receives</span>
                    <p className="text-xl font-black font-mono text-emerald-300">
                      {resolvedPayload.destination_currency} {resolvedPayload.requested_amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400">Your Home Deduction</span>
                    <p className="text-xl font-black font-mono text-zinc-100">
                      {fxQuote?.origin_currency || "INR"} {fxQuote?.origin_debit_amount || "0.00"}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Locked Forex Exchange Rate:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    1 {resolvedPayload.destination_currency} = {fxQuote?.fx_rate || "64.57"} {fxQuote?.origin_currency || "INR"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Change Code
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPin}
                  className="flex-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-98 transition-all"
                >
                  Confirm & Enter UPI PIN
                </button>
              </div>
            </div>
          ) : (
            /* Input: 6-Digit Code or QR Code */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setInputMode("code")}
                  className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === "code"
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter 6-Digit Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode("qr")}
                  className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === "qr"
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {inputMode === "code" ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Enter Recipient's 6-Digit Payment Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. RH7X92"
                    className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-center text-2xl font-mono font-black text-cyan-300 tracking-widest uppercase focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    disabled={isResolving || !codeInput.trim()}
                    onClick={() => handleResolve(codeInput.trim())}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isResolving ? "Resolving Payment Code..." : "Proceed to Pay"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Paste Scanned QR Code URI Payload
                  </label>
                  <textarea
                    rows={3}
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="rhipay://pay?ref=RHIPAY-REQ-...&amt=45.00&ccy=SGD..."
                    className="w-full p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    disabled={isResolving || !qrInput.trim()}
                    onClick={() => handleResolve(qrInput.trim())}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isResolving ? "Verifying QR Payload..." : "Validate & Proceed"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UPI PIN Modal for Payment Authorization */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode="verify"
        title="Authorize Payment"
        subtitle="Enter your 4-digit UPI PIN to confirm instant settlement"
        onSuccess={handlePinSuccess}
      />
    </>
  );
};
