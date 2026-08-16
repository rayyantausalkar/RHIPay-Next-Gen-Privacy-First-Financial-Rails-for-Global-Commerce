"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Copy,
  Check,
  Download,
  RotateCcw,
  Code2,
  ArrowRightLeft,
  Globe2,
} from "lucide-react";
import { DynamicPaymentRequestResponse, RequestStatus } from "@/types/payment";
import { getPaymentRequest } from "@/lib/api";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface QRPresenterCardProps {
  request: DynamicPaymentRequestResponse;
  onReset: () => void;
}

export const QRPresenterCard: React.FC<QRPresenterCardProps> = ({
  request: initialRequest,
  onReset,
}) => {
  const [request, setRequest] = useState<DynamicPaymentRequestResponse>(initialRequest);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    initialRequest.time_remaining_seconds
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [showPayloadDetails, setShowPayloadDetails] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"uri" | "json">("uri");

  // Countdown timer effect
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

  // Polling for live status changes
  useEffect(() => {
    if (request.status === "COMPLETED" || request.status === "EXPIRED") return;

    const poller = setInterval(async () => {
      try {
        const updated = await getPaymentRequest(request.reference_id);
        if (updated.status !== request.status) {
          setRequest(updated);
          if (updated.status === "SCANNED") {
            toast.info("Payer wallet has scanned the dynamic QR!", {
              description: "Verifying ZKP Merkle proof on Hub...",
            });
          } else if (updated.status === "COMPLETED") {
            toast.success("Payment Settled Instantly via Nexus Hub!", {
              description: `Received ${updated.requested_amount} ${updated.destination_currency}`,
            });
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 2500);

    return () => clearInterval(poller);
  }, [request.reference_id, request.status]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const copyPayload = () => {
    const textToCopy =
      viewMode === "uri"
        ? request.qr_payload
        : JSON.stringify(request.qr_payload_json, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = request.qr_code_base64;
    link.download = `RHIPay-QR-${request.reference_id}.png`;
    link.click();
    toast.success("QR code downloaded");
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Waiting for Payer Scan
          </span>
        );
      case "SCANNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Payer Scanned (Verifying ZKP)
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            <ArrowRightLeft className="w-3.5 h-3.5 animate-spin" />
            Nexus Settlement in Progress
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40">
            <Check className="w-3.5 h-3.5" />
            Settled & Credited
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            QR Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient gradients */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Payment Request QR
            </h2>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-cyan-300 rounded font-mono border border-slate-700">
              {request.reference_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            Corridor:{" "}
            <span className="font-semibold text-slate-200">
              {request.origin_spoke ? `${request.origin_spoke} → ` : "Universal → "}
              {request.destination_country} ({request.destination_currency})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(request.status)}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
            title="Create new request"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: QR Code Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative group p-4 bg-white rounded-2xl shadow-xl shadow-cyan-950/30 border-4 border-slate-700/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.qr_code_base64}
              alt="RHIPay Universal Dynamic QR Code"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
            />

            {request.status === "EXPIRED" && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <Clock className="w-10 h-10 text-rose-400 mb-2" />
                <p className="text-sm font-semibold text-white">QR Code Expired</p>
                <button
                  onClick={onReset}
                  className="mt-3 px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
                >
                  Generate New QR
                </button>
              </div>
            )}
          </div>

          {/* Action buttons under QR */}
          <div className="flex items-center gap-2 mt-4 w-full max-w-[260px]">
            <button
              onClick={copyPayload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>

            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save PNG</span>
            </button>
          </div>
        </div>

        {/* Right Column: Request Details */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {/* Amount Card */}
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Requested Amount
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Valid for: {formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                {Number(request.requested_amount).toFixed(request.currency_decimals ?? 2)}
              </span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {request.destination_currency}
              </span>
              <span className="text-xs text-slate-500 font-mono ml-2">
                ({request.amount_in_cents} minor units)
              </span>
            </div>

            {request.note && (
              <p className="text-xs text-slate-400 mt-2 italic border-t border-slate-800/60 pt-2">
                Note: &ldquo;{request.note}&rdquo;
              </p>
            )}
          </div>

          {/* Recipient & Corridor Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Payee Display Name</span>
              <span className="font-semibold text-slate-200 truncate block">
                {request.recipient_name}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">
                Proxy ({request.recipient_proxy_type})
              </span>
              <span className="font-semibold font-mono text-cyan-300 truncate block">
                {request.recipient_proxy_value}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">Destination Country (Spoke B)</span>
              <span className="font-semibold text-slate-200 font-mono">
                {request.destination_country} (ISO 3166-1)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-slate-500 block mb-1">ISO 20022 Purpose Code</span>
              <span className="font-semibold text-slate-200">
                {request.purpose_code}
              </span>
            </div>
          </div>

          {/* Machine-Readable Payload Viewer (URI / JSON switch) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowPayloadDetails(!showPayloadDetails)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>
                  {showPayloadDetails ? "Hide" : "Inspect"} Machine-Readable Payload
                </span>
              </button>

              {showPayloadDetails && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setViewMode("uri")}
                    className={`px-2 py-0.5 rounded font-mono ${
                      viewMode === "uri"
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    URI Scheme
                  </button>
                  <button
                    onClick={() => setViewMode("json")}
                    className={`px-2 py-0.5 rounded font-mono ${
                      viewMode === "json"
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Structured JSON
                  </button>
                </div>
              )}
            </div>

            {showPayloadDetails && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-auto">
                {viewMode === "uri" ? (
                  <div className="break-all text-cyan-400 selection:bg-cyan-900">
                    {request.qr_payload}
                  </div>
                ) : (
                  <pre className="text-emerald-400 whitespace-pre-wrap selection:bg-emerald-950">
                    {JSON.stringify(request.qr_payload_json, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
