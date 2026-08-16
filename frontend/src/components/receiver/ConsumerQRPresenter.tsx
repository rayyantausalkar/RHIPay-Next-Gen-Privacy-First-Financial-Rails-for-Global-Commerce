"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  Download,
  RotateCcw,
  Clock,
  CheckCircle2,
  Link as LinkIcon,
  Zap,
} from "lucide-react";
import { DynamicPaymentRequestResponse, RequestStatus } from "@/types/payment";
import { getPaymentRequest, markRequestScanned, completePaymentRequest } from "@/lib/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ConsumerQRPresenterProps {
  request: DynamicPaymentRequestResponse;
  onReset: () => void;
}

export const ConsumerQRPresenter: React.FC<ConsumerQRPresenterProps> = ({
  request: initialRequest,
  onReset,
}) => {
  const [request, setRequest] = useState<DynamicPaymentRequestResponse>(initialRequest);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    initialRequest.time_remaining_seconds
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0 || request.status === "COMPLETED") return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRequest((r) => ({ ...r, status: "EXPIRED" }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, request.status]);

  // WebSocket live telemetry stream listener
  useEffect(() => {
    if (request.status === "COMPLETED" || request.status === "EXPIRED") return;

    let ws: WebSocket | null = null;
    try {
      const wsUrl = `ws://localhost:8000/api/v1/telemetry/ws/${encodeURIComponent(request.recipient_proxy_value)}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.event === "PAYMENT_CREDITED_FUNDS_AVAILABLE" ||
            payload.status === "ACCP_SETTLED_FUNDS_AVAILABLE" ||
            payload.status === "COMPLETED"
          ) {
            setRequest((prev) => ({ ...prev, status: "COMPLETED" }));
            toast.success("Payment Received & Cleared Instantly!", {
              description: `Credited ${Number(request.requested_amount).toFixed(request.currency_decimals ?? 2)} ${request.destination_currency} via Host IPS`,
            });
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#10b981", "#34d399", "#059669", "#ffffff"],
            });
          }
        } catch {
          // Ignore json parse error
        }
      };
    } catch {
      // WebSocket fallback to polling
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [request.destination_currency, request.recipient_proxy_value, request.requested_amount, request.currency_decimals, request.status]);

  // Polling for live status changes
  useEffect(() => {
    if (request.status === "COMPLETED" || request.status === "EXPIRED") return;

    const poller = setInterval(async () => {
      try {
        const updated = await getPaymentRequest(request.reference_id);
        if (updated && updated.status !== request.status) {
          setRequest(updated);
          if (updated.status === "SCANNED") {
            toast.info("Payer scanned your QR code!", {
              description: "Verifying zero-knowledge proof on Nexus Hub...",
            });
          } else if (updated.status === "COMPLETED") {
            toast.success("Payment Received & Settled!", {
              description: `Credited ${Number(updated.requested_amount).toFixed(updated.currency_decimals ?? 2)} ${updated.destination_currency}`,
            });
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#10b981", "#34d399", "#059669", "#ffffff"],
            });
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 1200);

    return () => clearInterval(poller);
  }, [request.reference_id, request.status]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(request.qr_payload);
    setCopiedLink(true);
    toast.success("Payment link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = request.qr_code_base64;
    link.download = `RHIPay-${request.reference_id}.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  // Test simulation: triggers instant scan and settlement
  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      toast.loading("Simulating Payer Scan & ZK Witness Generation...", { id: "sim" });
      await markRequestScanned(request.reference_id);
      
      setTimeout(async () => {
        toast.loading("Verifying Merkle Root & Executing Nexus Settlement...", { id: "sim" });
        await completePaymentRequest(request.reference_id);
        const updated = await getPaymentRequest(request.reference_id);
        setRequest(updated);
        toast.dismiss("sim");
        toast.success("Settlement Complete!", {
          description: `Credited ${Number(updated.requested_amount).toFixed(updated.currency_decimals ?? 2)} ${updated.destination_currency}`,
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#059669", "#ffffff"],
        });
        setIsSimulating(false);
      }, 1500);
    } catch {
      toast.dismiss("sim");
      toast.error("Simulation failed");
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden text-center">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls: Expiry & Reset */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Expires in {formatTime(secondsRemaining)}</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium border border-white/[0.08] transition-colors active:scale-95"
        >
          <RotateCcw className="w-3 h-3 text-emerald-400" />
          <span>New</span>
        </button>
      </div>

      {/* Recipient Avatar & Name */}
      <div className="mt-3 sm:mt-4 flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-500 flex items-center justify-center font-bold text-lg sm:text-xl text-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30 mb-2 sm:mb-3">
          {request.recipient_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
          {request.recipient_name}
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-0.5">
          {request.recipient_proxy_value} • {request.destination_country} Spoke
        </p>

        {/* Requested Amount Hero */}
        <div className="mt-3 sm:mt-4 mb-1 sm:mb-2 flex items-baseline justify-center gap-1.5">
          <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            {Number(request.requested_amount).toFixed(request.currency_decimals ?? 2)}
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {request.destination_currency}
          </span>
        </div>

        {request.note && (
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-950 border border-white/[0.08] text-xs text-zinc-300 mb-2 truncate max-w-full">
            &ldquo;{request.note}&rdquo;
          </div>
        )}
      </div>

      {/* High-Contrast QR Card Container */}
      <div className="my-3 sm:my-4 relative flex justify-center">
        <div className="p-3 sm:p-4 bg-white rounded-3xl shadow-2xl shadow-emerald-950/40 border-4 border-zinc-800/80 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={request.qr_code_base64}
            alt="RHIPay Dynamic Payment QR"
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
          />

          {request.status === "EXPIRED" && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4">
              <Clock className="w-8 h-8 text-rose-400 mb-2" />
              <p className="text-sm font-semibold text-white">QR Expired</p>
              <button
                onClick={onReset}
                className="mt-3 px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors"
              >
                Create New Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Radar Pulse Indicator in Emerald */}
      <div className="flex items-center justify-center gap-2 text-xs font-medium mb-4 sm:mb-5">
        {request.status === "ACTIVE" && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-emerald-500/25">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>Waiting for payment...</span>
          </div>
        )}

        {request.status === "SCANNED" && (
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-amber-500/25">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Payer Scanned • Verifying ZKP</span>
          </div>
        )}

        {request.status === "COMPLETED" && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/15 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settled Instantly</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Copy Link & Save QR */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
        <button
          onClick={copyPaymentLink}
          className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] text-xs font-semibold transition-all active:scale-95"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={downloadQR}
          className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Save QR</span>
        </button>
      </div>

      {/* Demo Simulation Action Button */}
      {request.status === "ACTIVE" && (
        <button
          onClick={handleSimulatePayment}
          disabled={isSimulating}
          className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-500/30 text-[11px] text-zinc-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors group active:scale-98"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Simulate Payer Scan & Instant Settlement</span>
        </button>
      )}
    </div>
  );
};
