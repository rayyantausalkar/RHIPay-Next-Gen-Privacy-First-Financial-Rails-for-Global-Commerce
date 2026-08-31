"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowDownLeft,
  X,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DynamicPaymentRequestResponse } from "@/types/payment";

interface ModernReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentReceived?: (amount: number, currency: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const ModernReceiveModal: React.FC<ModernReceiveModalProps> = ({
  isOpen,
  onClose,
  onPaymentReceived,
}) => {
  const { user, refreshUser } = useAuth();

  const [amount, setAmount] = useState<string>("45.00");
  const [formatMode, setFormatMode] = useState<"code" | "qr">("code");
  const [activeRequest, setActiveRequest] = useState<DynamicPaymentRequestResponse | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSettled, setIsSettled] = useState<boolean>(false);

  const activeCurrency = user?.active_journey_currency || user?.preferred_currency || "SGD";
  const activeCountry = user?.active_journey_country || user?.home_country || "SG";

  // Check if there is already an active request
  useEffect(() => {
    if (!isOpen || !user) return;

    const checkExisting = async () => {
      try {
        const res = await fetch(`${API_BASE}/requests/`);
        if (res.ok) {
          const list: DynamicPaymentRequestResponse[] = await res.json();
          const cleanProxy = user.proxy_value.trim().toLowerCase();
          const match = list.find(
            (r) =>
              r.recipient_proxy_value.toLowerCase() === cleanProxy &&
              r.status === "ACTIVE" &&
              r.time_remaining_seconds > 0
          );
          if (match) {
            setActiveRequest(match);
            setSecondsRemaining(match.time_remaining_seconds);
          }
        }
      } catch {
        // safe fallback
      }
    };
    checkExisting();
  }, [isOpen, user]);

  // Countdown timer for 2 minutes (120s)
  useEffect(() => {
    if (!activeRequest || isSettled) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveRequest(null);
          toast.error("Payment request has expired. Please generate a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRequest, isSettled]);

  // Poll request state to detect payment settlement
  useEffect(() => {
    if (!activeRequest || isSettled) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/requests/${activeRequest.reference_id}`);
        if (res.ok) {
          const data: DynamicPaymentRequestResponse = await res.json();
          if (data.status === "COMPLETED") {
            setIsSettled(true);
            try {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.6 },
                colors: ["#10B981", "#34D399", "#22D3EE", "#FFFFFF"],
              });
            } catch {}
            toast.success("Payment Received Successfully!", {
              description: `Received ${activeCurrency} ${parseFloat(amount).toFixed(2)}`,
            });
            await refreshUser();
            onPaymentReceived?.(parseFloat(amount), activeCurrency);
          }
        }
      } catch {
        // safe fallback
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [activeRequest, isSettled, amount, activeCurrency, refreshUser, onPaymentReceived]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        recipient_name: user.name,
        recipient_proxy_type: user.proxy_type,
        recipient_proxy_value: user.proxy_value,
        destination_country: activeCountry,
        destination_currency: activeCurrency,
        requested_amount: numAmount,
        expiry_seconds: 120, // 2 minutes
        purpose_code: "P2P_TRANSFER",
      };

      const res = await fetch(`${API_BASE}/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to generate payment request");
        setIsLoading(false);
        return;
      }

      setActiveRequest(data);
      setSecondsRemaining(data.time_remaining_seconds || 120);
      setIsSettled(false);
      toast.success("Payment Request Generated!", {
        description: `Valid for 2 minutes (Code: ${data.short_code || "RH7X92"})`,
      });
    } catch (err: any) {
      toast.error(err.message || "Network error generating request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeRequest) return;
    const code = activeRequest.short_code || activeRequest.reference_id.slice(-6);
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success("Payment code copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setActiveRequest(null);
    setIsSettled(false);
    setSecondsRemaining(120);
  };

  if (!isOpen) return null;

  const progressPct = Math.max(0, Math.min(100, (secondsRemaining / 120) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#08131d] border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 text-white flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Receive Money</h3>
            <p className="text-xs text-zinc-400">Generate 2-min single payment code or QR</p>
          </div>
        </div>

        {/* Settled State */}
        {isSettled ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Payment Received!</h4>
              <p className="text-2xl font-black font-mono text-emerald-300 mt-1">
                + {activeCurrency} {parseFloat(amount).toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Funds settled and credited to your account instantly.</p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all"
            >
              Receive Another Payment
            </button>
          </div>
        ) : activeRequest ? (
          /* Active Request Presenter (Code / QR with 2-minute countdown) */
          <div className="space-y-4">
            {/* Format Toggle (6-digit Code vs QR Code) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setFormatMode("code")}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  formatMode === "code"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>6-Digit Code</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatMode("qr")}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  formatMode === "qr"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Dynamic QR</span>
              </button>
            </div>

            {/* Countdown Expiry Bar */}
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires in:</span>
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* View 1: 6-Digit Alphanumeric Code */}
            {formatMode === "code" ? (
              <div className="p-5 rounded-3xl bg-emerald-950/25 border border-emerald-500/30 text-center space-y-3">
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Share this 6-digit payment code with sender
                </p>

                <div className="flex items-center justify-center gap-2">
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-300 bg-zinc-950/80 px-4 py-2 rounded-2xl border border-emerald-500/40">
                    {activeRequest.short_code || activeRequest.reference_id.slice(-6)}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-emerald-500/20 text-xs font-semibold text-zinc-200 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* View 2: Dynamic QR Code */
              <div className="p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeRequest.qr_code_base64}
                    alt="RHI Pay Dynamic QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                </div>
                <p className="text-xs text-zinc-400 font-mono">Scan via RHI Pay Camera Scanner</p>
              </div>
            )}

            {/* Requested Amount Banner */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-zinc-400">Requested Amount:</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                {activeCurrency} {parseFloat(amount).toFixed(2)}
              </span>
            </div>

            {/* Live Listening Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Waiting for sender payment... (1 active payment at a time)</span>
            </div>

            {/* Cancel Request Button */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-2xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.06] hover:border-rose-500/30 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors"
            >
              Cancel & Generate New Request
            </button>
          </div>
        ) : (
          /* Generate Form */
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Amount to Receive ({activeCurrency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="45.00"
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-white text-lg font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400">
                  {activeCurrency}
                </span>
              </div>
            </div>

            {/* Method Choice */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormatMode("code")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  formatMode === "code"
                    ? "bg-emerald-950/30 border-emerald-500/50 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04]"
                }`}
              >
                <KeyRound className="w-5 h-5 text-emerald-400 mb-1" />
                <p className="text-xs font-bold text-zinc-200">6-Digit Code</p>
                <p className="text-[10px] text-zinc-500">Quick code for sender</p>
              </button>

              <button
                type="button"
                onClick={() => setFormatMode("qr")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  formatMode === "qr"
                    ? "bg-emerald-950/30 border-emerald-500/50 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04]"
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-400 mb-1" />
                <p className="text-xs font-bold text-zinc-200">Dynamic QR</p>
                <p className="text-[10px] text-zinc-500">Scannable payload</p>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate 2-Minute Payment Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
