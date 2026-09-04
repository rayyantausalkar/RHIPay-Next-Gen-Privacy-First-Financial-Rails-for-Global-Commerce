"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowDownLeft,
  X,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DynamicPaymentRequestResponse } from "@/types/payment";

interface ModernReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentReceived?: (amount: number, currency: string) => void;
}

import { API_BASE } from "@/lib/config";


export const ModernReceiveModal: React.FC<ModernReceiveModalProps> = ({
  isOpen,
  onClose,
  onPaymentReceived,
}) => {
  const { user, refreshUser } = useAuth();

  const [activeRequest, setActiveRequest] = useState<DynamicPaymentRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPayloadCopied, setIsPayloadCopied] = useState<boolean>(false);
  const [isSettled, setIsSettled] = useState<boolean>(false);
  const [settledAmount, setSettledAmount] = useState<number>(0);

  const activeCurrency = user?.active_journey_currency || user?.preferred_currency || "SGD";
  const activeCountry = user?.active_journey_country || user?.home_country || "SG";

  // Create payment QR code helper
  const createPaymentQR = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const payload = {
        recipient_name: user.name,
        recipient_proxy_type: user.proxy_type || "MOBILE",
        recipient_proxy_value: user.proxy_value || user.email,
        destination_country: activeCountry,
        destination_currency: activeCurrency,
        requested_amount: 1.0, // Open base amount, sender specifies exact transfer money
        expiry_seconds: 86400, // 24h persistent receiver QR
        purpose_code: "P2P_TRANSFER",
      };

      const res = await fetch(`${API_BASE}/requests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to generate QR code");
        setIsLoading(false);
        return;
      }

      setActiveRequest(data);
      setIsSettled(false);
    } catch {
      toast.error("Network error generating QR code");
    } finally {
      setIsLoading(false);
    }
  }, [user, activeCountry, activeCurrency]);

  // Load or generate QR code on open
  useEffect(() => {
    if (isOpen) {
      const initQR = async () => {
        if (!user) return;
        try {
          const res = await fetch(`${API_BASE}/requests/`);
          if (res.ok) {
            const list: DynamicPaymentRequestResponse[] = await res.json();
            const cleanProxy = user.proxy_value.trim().toLowerCase();
            const match = list.find(
              (r) =>
                r.recipient_proxy_value.toLowerCase() === cleanProxy &&
                r.status === "ACTIVE"
            );
            if (match) {
              setActiveRequest(match);
              return;
            }
          }
        } catch {}

        createPaymentQR();
      };

      initQR();
    }
  }, [isOpen, user, createPaymentQR]);

  // Poll request state to detect payment settlement
  useEffect(() => {
    if (!activeRequest || isSettled) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/requests/${activeRequest.reference_id}`);
        if (res.ok) {
          const data: DynamicPaymentRequestResponse = await res.json();
          if (data.status === "COMPLETED") {
            const amt = Number(data.requested_amount) || 1.0;
            const cur = data.destination_currency || activeCurrency;
            setIsSettled(true);
            setSettledAmount(amt);
            toast.success("Payment Received & Credited", {
              description: `Credited ${cur} ${amt.toFixed(2)} to your settlement account`,
            });
            await refreshUser();
            onPaymentReceived?.(amt, cur);
          }
        }
      } catch {
        // safe fallback
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [activeRequest, isSettled, activeCurrency, refreshUser, onPaymentReceived]);

  const handleCopyPayload = () => {
    if (!activeRequest) return;
    navigator.clipboard.writeText(activeRequest.qr_payload);
    setIsPayloadCopied(true);
    toast.success("QR Code URI Copied!");
    setTimeout(() => setIsPayloadCopied(false), 2000);
  };

  const handleReset = () => {
    setIsSettled(false);
    createPaymentQR();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-[#08131d] border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 text-white flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Receive Money</h3>
            <p className="text-xs text-zinc-400">Present your QR Code to receive payment</p>
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
                + {activeRequest?.destination_currency || activeCurrency} {settledAmount.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Funds settled and credited to your account instantly.</p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              Receive Another Payment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payee Profile Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                  Beneficiary
                </span>
                <p className="text-sm font-bold text-white">{user?.name}</p>
                <p className="text-[11px] text-zinc-400 font-mono">{user?.proxy_value}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">
                  Receiving In
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {activeCurrency} ({activeCountry})
                </span>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="p-5 rounded-3xl bg-zinc-950 border border-emerald-500/30 flex flex-col items-center justify-center space-y-3 shadow-inner">
              <div className="p-3.5 bg-white rounded-2xl shadow-2xl">
                {activeRequest?.qr_code_base64 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeRequest.qr_code_base64}
                    alt="RHI Pay QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center text-zinc-600 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                    <span className="text-xs font-mono">Generating QR Code...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono text-center">
                Sender will scan and specify transfer amount
              </p>
            </div>

            {/* Live Listening Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Ready for incoming settlement...</span>
            </div>

            {/* Copy Payload Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPayload}
                disabled={!activeRequest}
                className="flex-1 py-3 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-zinc-200 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isPayloadCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isPayloadCopied ? "Copied QR URI" : "Copy QR URI Payload"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
