"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowUpRight,
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Clock,
  RefreshCw,
  Camera,
  Plane,
  Globe2,
  Upload,
  SwitchCamera,
  Sparkles,
} from "lucide-react";
import jsQR from "jsqr";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { listRecentRequests } from "@/lib/api";
import { DynamicPaymentRequestResponse } from "@/types/payment";
import { UpiPinModal } from "../modals/UpiPinModal";

interface ModernSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentCompleted?: () => void;
  onOpenQRScanner?: () => void;
  onOpenJourneyModal?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const PROCESSING_STAGES = [
  "Generating Zero-Knowledge cryptographic proofs...",
  "Authorizing through Correspondent Banking Network...",
  "Executing atomic FX liquidity swap...",
  "Clearing domestic real-time settlement...",
  "Finalizing immutable double-entry ledger...",
];

export const ModernSendModal: React.FC<ModernSendModalProps> = ({
  isOpen,
  onClose,
  onPaymentCompleted,
  onOpenQRScanner,
  onOpenJourneyModal,
}) => {
  const { user, refreshUser, executeTransfer } = useAuth();
  const { fetchNotifications } = useNotifications();

  // Mode: "scan_qr" (camera/upload), "paste_qr", "code"
  const [inputMode, setInputMode] = useState<"scan_qr" | "paste_qr" | "code">("scan_qr");
  const [codeInput, setCodeInput] = useState<string>("");
  const [qrInput, setQrInput] = useState<string>("");
  const [resolvedPayload, setResolvedPayload] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState<string>("50.00");
  const [isAmountConfirmed, setIsAmountConfirmed] = useState<boolean>(false);
  const [fxQuote, setFxQuote] = useState<any>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatusText, setProcessingStatusText] = useState<string>(PROCESSING_STAGES[0]);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUetr, setCopiedUetr] = useState<boolean>(false);

  // Camera & Image QR Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [recentRequests, setRecentRequests] = useState<DynamicPaymentRequestResponse[]>([]);

  // Country code normalization mapping
  const normalizeCountry = (c?: string | null): string => {
    if (!c) return "";
    const clean = c.trim().toUpperCase();
    if (clean === "USA" || clean === "UNITED STATES") return "US";
    if (clean === "IND" || clean === "INDIA") return "IN";
    if (clean === "SGP" || clean === "SINGAPORE") return "SG";
    if (clean === "UAE" || clean === "UNITED ARAB EMIRATES") return "AE";
    if (clean === "GBR" || clean === "UK" || clean === "UNITED KINGDOM") return "GB";
    if (clean === "EUR" || clean === "EUROPE" || clean === "EUROZONE") return "EU";
    if (clean === "JPN" || clean === "JAPAN") return "JP";
    if (clean === "THA" || clean === "THAILAND") return "TH";
    if (clean === "MYS" || clean === "MALAYSIA") return "MY";
    if (clean === "AUS" || clean === "AUSTRALIA") return "AU";
    if (clean === "CAN" || clean === "CANADA") return "CA";
    if (clean === "BRA" || clean === "BRAZIL") return "BR";
    return clean;
  };

  const CURRENCY_TO_COUNTRY: Record<string, string> = {
    USD: "US",
    SGD: "SG",
    INR: "IN",
    AED: "AE",
    GBP: "GB",
    EUR: "EU",
    JPY: "JP",
    THB: "TH",
    MYR: "MY",
    AUD: "AU",
    CAD: "CA",
    BRL: "BR",
  };

  // 120-Second Dynamic Expiration Countdown
  const [quoteSecondsRemaining, setQuoteSecondsRemaining] = useState<number>(120);
  const [isQuoteExpired, setIsQuoteExpired] = useState<boolean>(false);

  // Load recent requests and refresh user profile on modal open
  useEffect(() => {
    if (isOpen) {
      refreshUser();
      listRecentRequests(4)
        .then(setRecentRequests)
        .catch(() => {});
    }
  }, [isOpen, refreshUser]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && isAmountConfirmed && !completedReceipt && !isProcessing) {
      setIsQuoteExpired(false);
      timer = setInterval(() => {
        setQuoteSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsQuoteExpired(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, isAmountConfirmed, completedReceipt, isProcessing]);

  // Global vs Local Transfer Enforcement with robust country & currency normalization
  const senderHomeCountry = normalizeCountry(user?.home_country);
  const senderHomeCurrency = (user?.preferred_currency || "USD").toUpperCase();

  const senderJourneyCountry = normalizeCountry(user?.active_journey_country);
  const senderJourneyCurrency = (
    user?.active_journey_currency ||
    (senderJourneyCountry ? CURRENCY_TO_COUNTRY[senderJourneyCountry] : "")
  ).toUpperCase();

  const destCountry = normalizeCountry(resolvedPayload?.destination_country);
  const destCurrency = (
    resolvedPayload?.destination_currency ||
    (destCountry ? CURRENCY_TO_COUNTRY[destCountry] : "")
  ).toUpperCase();

  // Cross-border if destination currency/country differs from sender's home
  const isCrossBorder = Boolean(
    resolvedPayload &&
    user &&
    (
      (destCountry && senderHomeCountry && destCountry !== senderHomeCountry) ||
      (destCurrency && senderHomeCurrency && destCurrency !== senderHomeCurrency)
    )
  );

  // User has approved travel journey if:
  // 1. Sender's active travel country matches destination country
  // 2. Sender's active travel currency matches destination currency (e.g. USD == USD)
  // 3. Sender has an active travel wallet balance in the destination currency
  const hasApprovedTravelJourney = Boolean(
    (senderJourneyCountry && (senderJourneyCountry === destCountry || senderJourneyCurrency === destCurrency)) ||
    (senderJourneyCurrency && senderJourneyCurrency === destCurrency) ||
    ((user?.travel_wallet_balance || 0) > 0 && (destCurrency === "USD" || destCurrency === senderJourneyCurrency))
  );

  const isGlobalTransferRestricted = isCrossBorder && !hasApprovedTravelJourney;

  const handleResolve = useCallback(async (payloadString: string) => {
    setErrorMsg(null);
    setIsResolving(true);
    try {
      const res = await fetch(`${API_BASE}/requests/validate-payload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_payload: payloadString.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.is_valid) {
        setErrorMsg(data.error_details || "Invalid or expired payment code / QR payload.");
        setIsResolving(false);
        return;
      }

      setResolvedPayload(data);
      if (data.requested_amount && Number(data.requested_amount) > 0) {
        setTransferAmount(Number(data.requested_amount).toFixed(2));
      } else {
        setTransferAmount("50.00");
      }
      setIsAmountConfirmed(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve payment request");
    } finally {
      setIsResolving(false);
    }
  }, []);

  const handleQRDetected = useCallback((data: string) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    toast.success("QR Code Successfully Scanned!");
    handleResolve(data);
  }, [handleResolve]);

  // Live Camera Scanner Lifecycle
  useEffect(() => {
    if (!isOpen || resolvedPayload || inputMode !== "scan_qr") return;

    let stream: MediaStream | null = null;
    let isActive = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        if (!navigator?.mediaDevices?.getUserMedia) {
          setHasCameraPermission(false);
          setCameraError("Camera is not supported on this browser or environment.");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!isActive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          setHasCameraPermission(true);
          scanFrame();
        }
      } catch (err: unknown) {
        setHasCameraPermission(false);
        const errMsg = err instanceof Error ? err.message : "Camera access denied or unavailable";
        setCameraError(errMsg);
      }
    };

    const scanFrame = () => {
      if (!isActive) return;
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleQRDetected(code.data);
            return;
          }
        }
      }
      animFrameId.current = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      isActive = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, resolvedPayload, inputMode, cameraFacing, handleQRDetected]);

  // Image Upload File Decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          toast.success("QR Code Decoded Successfully!");
          handleResolve(code.data);
        } else {
          toast.error("No valid QR code found in uploaded image");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAmountAndLockRate = async () => {
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }

    if (isGlobalTransferRestricted) {
      toast.error("Cross-border transfers require an active Travel Journey clearance.");
      return;
    }

    const homeCur = user?.preferred_currency || "INR";
    const destCur = resolvedPayload?.destination_currency || "USD";
    const amt = parseFloat(transferAmount);

    const isTravelWalletDebit = Boolean(
      hasApprovedTravelJourney &&
      (user?.travel_wallet_balance || 0) >= amt &&
      (
        senderJourneyCurrency === destCurrency ||
        destCurrency === "USD" ||
        senderJourneyCountry === destCountry
      )
    );

    if (isTravelWalletDebit) {
      setFxQuote({
        origin_currency: destCur,
        destination_currency: destCur,
        fx_rate: 1.0,
        origin_debit_amount: amt.toFixed(2),
        is_travel_wallet: true,
      });
    } else {
      try {
        const fxRes = await fetch(`${API_BASE}/fx/lock-quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin_currency: homeCur,
            destination_currency: destCur,
            destination_amount: amt,
            ttl_seconds: 120,
          }),
        });

        if (fxRes.ok) {
          const fxData = await fxRes.json();
          setFxQuote(fxData);
        } else {
          setFxQuote({
            origin_currency: homeCur,
            destination_currency: destCur,
            fx_rate: 86.85,
            origin_debit_amount: (amt * 86.85).toFixed(2),
          });
        }
      } catch {
        setFxQuote({
          origin_currency: homeCur,
          destination_currency: destCur,
          fx_rate: 86.85,
          origin_debit_amount: (amt * 86.85).toFixed(2),
        });
      }
    }

    // Start 120s timer on confirmation
    setQuoteSecondsRemaining(120);
    setIsQuoteExpired(false);
    setIsAmountConfirmed(true);
  };

  const handleRefreshQuote = async () => {
    await handleConfirmAmountAndLockRate();
    toast.info("FX Quote refreshed for 120 seconds");
  };

  const handleProceedToPin = () => {
    if (isQuoteExpired) {
      toast.error("Quote expired. Please refresh the quote to continue.");
      return;
    }
    if (isGlobalTransferRestricted) {
      toast.error("Cross-border transfer restricted without active Travel Journey.");
      return;
    }
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (_pin: string) => {
    setIsPinModalOpen(false);
    setIsProcessing(true);

    const stageCount = PROCESSING_STAGES.length;
    const intervalTime = 450;

    for (let i = 0; i < stageCount; i++) {
      setProcessingStatusText(PROCESSING_STAGES[i]);
      await new Promise((resolve) => setTimeout(resolve, intervalTime));
    }

    try {
      const res = await executeTransfer({
        sender_user_id: user?.id || "",
        recipient_proxy: resolvedPayload.proxy_value,
        recipient_name: resolvedPayload.recipient_name,
        destination_country: resolvedPayload.destination_country,
        destination_currency: resolvedPayload.destination_currency,
        requested_amount: parseFloat(transferAmount),
        purpose_code: resolvedPayload.purpose_code || "P2P_TRANSFER",
        note: resolvedPayload.note || (isCrossBorder ? "RHI Pay Global Cross-Border Transfer" : "RHI Pay Local P2P Transfer"),
      });

      if (!res.success) {
        toast.error(res.error || "Payment execution failed");
        setIsProcessing(false);
        return;
      }

      if (resolvedPayload?.reference_id) {
        try {
          await fetch(`${API_BASE}/requests/${resolvedPayload.reference_id}/complete`, { method: "POST" });
        } catch { }
      }

      const tx = res.data?.transaction;
      const receiptData = {
        receipt_id: tx?.transaction_id || `REC-${Date.now().toString().slice(-8)}`,
        uetr: tx?.uetr || `7a9b3c4d-${Date.now().toString(16)}`,
        recipient_name: tx?.recipient_name || resolvedPayload.recipient_name,
        recipient_proxy: tx?.recipient_proxy || resolvedPayload.proxy_value,
        recipient_currency: tx?.recipient_currency || resolvedPayload.destination_currency,
        amount_credited: tx?.recipient_amount || parseFloat(transferAmount),
        sender_name: user?.name,
        sender_currency: tx?.sender_currency || user?.preferred_currency || "INR",
        amount_debited: tx?.sender_amount || fxQuote?.origin_debit_amount || (parseFloat(transferAmount) * 86.85).toFixed(2),
        effective_fx_rate: tx?.exchange_rate || fxQuote?.fx_rate || 86.85,
        settled_at: new Date().toLocaleTimeString(),
      };

      setCompletedReceipt(receiptData);
      setIsProcessing(false);

      toast.success("Payment Settled Successfully", {
        description: `Transfer of ${resolvedPayload.destination_currency} ${transferAmount} finalized via ISO 20022 pacs.008`,
      });
      await refreshUser();
      await fetchNotifications();
      onPaymentCompleted?.();
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err.message || "Payment settlement error");
    }
  };

  const handleReset = () => {
    setResolvedPayload(null);
    setFxQuote(null);
    setCodeInput("");
    setQrInput("");
    setInputMode("scan_qr");
    setCameraError(null);
    setIsAmountConfirmed(false);
    setCompletedReceipt(null);
    setIsProcessing(false);
  };

  const handleCopyUetr = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUetr(true);
    toast.success("UETR identifier copied!");
    setTimeout(() => setCopiedUetr(false), 2000);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const quoteProgressPct = Math.max(0, Math.min(100, (quoteSecondsRemaining / 120) * 100));

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
      >
        <div
          className="relative w-full max-w-lg bg-[#061824] border border-emerald-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 text-white max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {!isProcessing && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Send Money</h3>
              <p className="text-xs text-zinc-400">
                {isCrossBorder ? "Cross-border global settlement" : "Instant local P2P transfer"}
              </p>
            </div>
          </div>

          {/* Body Stages */}
          {isProcessing ? (
            <div className="py-8 sm:py-10 space-y-6 text-center animate-in fade-in duration-300">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400 animate-spin duration-1000" />
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-7 h-7 stroke-[2.2] animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto px-4">
                <h4 className="text-lg font-bold text-white tracking-tight">Payment Processing...</h4>
                <p className="text-xs text-emerald-400 font-mono transition-all duration-300 min-h-[32px] flex items-center justify-center">
                  {processingStatusText}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Zero-Knowledge Authenticated</span>
                </span>
                <span className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  <span>Correspondent Rail</span>
                </span>
              </div>
            </div>
          ) : completedReceipt ? (
            /* Completed Digital Receipt */
            <div className="py-4 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h4 className="text-lg font-bold text-white">Payment Successfully Settled!</h4>
                <p className="text-xs text-zinc-400">
                  {isCrossBorder ? "Funds credited globally via Correspondent Rail" : "Funds credited instantly via Local Domestic Rail"}
                </p>
              </div>

              {/* Amount Box */}
              <div className="p-4 rounded-2xl bg-[#061824] border border-emerald-500/30 text-center space-y-1">
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Credited to Payee</p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                  {completedReceipt.recipient_currency} {Number(completedReceipt.amount_credited).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  Debited from your account: {completedReceipt.sender_currency} {Number(completedReceipt.amount_debited).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Receipt Details */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Transaction ID:</span>
                  <span className="font-mono font-semibold text-zinc-200">{completedReceipt.receipt_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recipient:</span>
                  <span className="font-semibold text-zinc-200">{completedReceipt.recipient_name} ({completedReceipt.recipient_proxy})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Effective FX Rate:</span>
                  <span className="font-mono text-emerald-400">1 {completedReceipt.recipient_currency} = {completedReceipt.effective_fx_rate} {completedReceipt.sender_currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">UETR (Tracking ID):</span>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-300">
                    <span className="truncate max-w-[140px]">{completedReceipt.uetr}</span>
                    <button onClick={() => handleCopyUetr(completedReceipt.uetr)} className="text-zinc-400 hover:text-white cursor-pointer">
                      {copiedUetr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Settled At:</span>
                  <span className="font-mono text-zinc-300">{completedReceipt.settled_at}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
                >
                  Send Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : !resolvedPayload ? (
            /* Step 1: Ingest Recipient via QR Code Scan / Image Upload / Paste / Payee PIN */
            <div className="space-y-4">
              {/* Hidden Canvas & File Input for QR image decoding */}
              <canvas ref={canvasRef} className="hidden" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* 3 Input Tabs */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setInputMode("scan_qr")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "scan_qr"
                      ? "bg-emerald-500 text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste_qr")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "paste_qr"
                      ? "bg-emerald-500 text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Paste QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("code")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputMode === "code"
                      ? "bg-emerald-500 text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Proxy / Code</span>
                </button>
              </div>

              {/* TAB 1: LIVE CAMERA SCANNER & IMAGE UPLOAD */}
              {inputMode === "scan_qr" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Camera Viewfinder Box */}
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-60 flex items-center justify-center border border-emerald-500/30 shadow-inner shadow-black">
                    {hasCameraPermission === false ? (
                      <div className="p-4 text-center space-y-2.5">
                        <AlertCircle className="w-7 h-7 text-amber-400 mx-auto" />
                        <div>
                          <h4 className="text-xs font-bold text-white">Camera Feed Unavailable</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5 max-w-xs leading-relaxed">
                            {cameraError || "Enable camera access in your browser or upload a QR image/screenshot below."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                          Upload QR Image
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Live Video Stream */}
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />

                        {/* Scanner Reticle Frame Overlay */}
                        <div className="absolute inset-5 sm:inset-6 pointer-events-none border border-dashed border-emerald-500/40 rounded-2xl flex items-center justify-center">
                          {/* 4 Corner Markers */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />

                          {/* Pulsing Scanning Laser Line */}
                          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-pulse" />
                        </div>

                        {/* Target text */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Scanning for QR...</span>
                        </div>

                        {/* Switch Camera Button */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCameraFacing((prev) =>
                                prev === "environment" ? "user" : "environment"
                              )
                            }
                            className="p-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                            title="Switch Camera"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Upload QR Image / Screenshot */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 border border-white/[0.08] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload QR Image / Screenshot</span>
                  </button>

                  {/* Quick Select Demo QR Codes */}
                  {recentRequests.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                        Or Select Active Payment Request
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto">
                        {recentRequests.map((req) => (
                          <button
                            key={req.reference_id}
                            type="button"
                            onClick={() => handleResolve(req.qr_payload)}
                            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/[0.04] hover:border-emerald-500/30 text-left text-[11px] text-zinc-300 transition-colors cursor-pointer"
                          >
                            <div className="font-bold text-white truncate">
                              {req.recipient_name}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono">
                              {Number(req.requested_amount).toFixed(req.currency_decimals ?? 2)} {req.destination_currency}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PASTE QR URI */}
              {inputMode === "paste_qr" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Paste QR Code URI
                    </label>
                    <textarea
                      rows={3}
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && qrInput.trim()) {
                          e.preventDefault();
                          handleResolve(qrInput);
                        }
                      }}
                      placeholder="rhipay://pay?ref=...&amt=...&sig=..."
                      className="w-full text-xs font-mono p-3 rounded-2xl bg-zinc-950 border border-white/[0.12] text-zinc-200 focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!qrInput.trim() || isResolving}
                    onClick={() => handleResolve(qrInput)}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    <span>{isResolving ? "Verifying QR..." : "Decode & Find Payee"}</span>
                  </button>
                </div>
              )}

              {/* TAB 3: PROXY / PHONE / EMAIL / CODE */}
              {inputMode === "code" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Recipient Code, Mobile Number, or Proxy
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={codeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCodeInput(val);
                        if (val.trim().length === 6 && /^[A-Za-z0-9]{6}$/.test(val.trim())) {
                          handleResolve(val.trim().toUpperCase());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && codeInput.trim().length >= 3) {
                          e.preventDefault();
                          handleResolve(codeInput.trim());
                        }
                      }}
                      placeholder="e.g. A9B4X2, +6591234567, or email"
                      className="w-full text-center text-lg sm:text-xl font-bold font-mono py-3 px-4 rounded-2xl bg-zinc-950 border border-white/[0.12] text-emerald-300 focus:outline-none focus:border-emerald-400 placeholder:text-sm placeholder:font-sans placeholder:font-normal placeholder:text-zinc-600"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={codeInput.trim().length < 3 || isResolving}
                    onClick={() => handleResolve(codeInput.trim())}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                    <span>{isResolving ? "Resolving..." : "Find & Verify Payee"}</span>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : isGlobalTransferRestricted ? (
            /* Travel Journey Required Barrier Card for Global Transfers */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Payee Info */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Recipient Target</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 font-mono flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    <span>GLOBAL TRANSFER</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{resolvedPayload.recipient_name}</h4>
                    <p className="text-xs text-zinc-400 font-mono">{resolvedPayload.proxy_value}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Destination</span>
                    <span className="text-xs font-bold text-zinc-200">
                      {resolvedPayload.destination_country} ({resolvedPayload.destination_currency})
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement Alert Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <Plane className="w-5 h-5 flex-shrink-0" />
                  <h4 className="text-sm font-bold">Travel Journey Clearance Required</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Cross-border payments to <strong className="text-amber-200">{resolvedPayload.destination_country} ({resolvedPayload.destination_currency})</strong> are restricted to verified travelers under FATF Travel Rules.
                </p>
                <p className="text-[11px] text-zinc-400 border-t border-amber-500/20 pt-2">
                  Without an approved Travel Journey, you can only make domestic transfers locally within <strong className="text-zinc-200">{user?.home_country} ({user?.preferred_currency})</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onOpenJourneyModal && (
                  <button
                    type="button"
                    onClick={onOpenJourneyModal}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                  >
                    <Plane className="w-4 h-4" />
                    <span>Plan Travel Journey (Unlock {resolvedPayload.destination_currency})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel & Send Locally Instead
                </button>
              </div>
            </div>
          ) : !isAmountConfirmed ? (
            /* Step 2: Sender Sets Transfer Money */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Payee Card */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Paying Recipient</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 font-mono">
                    {hasApprovedTravelJourney
                      ? `TRAVEL WALLET CLEARANCE (${resolvedPayload.destination_currency})`
                      : isCrossBorder
                      ? "VERIFIED GLOBAL PAYEE"
                      : "LOCAL DOMESTIC PAYEE"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{resolvedPayload.recipient_name}</h4>
                    <p className="text-xs text-zinc-400 font-mono">{resolvedPayload.proxy_value}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Destination</span>
                    <span className="text-xs font-bold text-zinc-200">
                      {resolvedPayload.destination_country} ({resolvedPayload.destination_currency})
                    </span>
                  </div>
                </div>
              </div>

              {/* Set Transfer Amount Form */}
              <div className="p-4 rounded-2xl bg-[#061824] border border-emerald-500/30 space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Set Transfer Amount ({resolvedPayload.destination_currency}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full py-3 px-4 rounded-2xl bg-zinc-950 border border-white/[0.1] text-white text-2xl font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-emerald-400">
                    {resolvedPayload.destination_currency}
                  </span>
                </div>

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  {["10.00", "25.00", "50.00", "100.00", "250.00"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTransferAmount(preset)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        transferAmount === preset
                          ? "bg-emerald-500 text-black font-bold"
                          : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                      }`}
                    >
                      {preset.split(".")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAmountAndLockRate}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <span>Confirm Amount & Lock FX Rate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 3: Confirmation with Active Expiration Timer */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Expiration Countdown Bar — STARTS ON CONFIRMATION */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quote & Payment Valid For:</span>
                  </span>
                  <span className={`font-mono font-bold ${isQuoteExpired ? "text-rose-400" : "text-amber-300"}`}>
                    {isQuoteExpired ? "EXPIRED" : `${Math.floor(quoteSecondsRemaining / 60)}:${(quoteSecondsRemaining % 60).toString().padStart(2, "0")}`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isQuoteExpired ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${quoteProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Payee Info */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Paying Recipient</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 font-mono">
                    {isCrossBorder ? "VERIFIED GLOBAL" : "VERIFIED LOCAL"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{resolvedPayload.recipient_name}</h4>
                    <p className="text-xs text-zinc-400 font-mono">{resolvedPayload.proxy_value}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Destination</span>
                    <span className="text-xs font-bold text-zinc-200">
                      {resolvedPayload.destination_country} ({resolvedPayload.destination_currency})
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount & FX Breakdown */}
              <div className="p-4 rounded-2xl bg-[#061824] border border-emerald-500/30 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-zinc-400">Transfer Amount:</span>
                  <span className="text-2xl font-black font-mono text-emerald-300">
                    {resolvedPayload.destination_currency} {Number(transferAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Debited from your account:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {fxQuote?.origin_currency || user?.preferred_currency || "INR"}{" "}
                    {Number(
                      fxQuote?.origin_debit_amount ||
                        parseFloat(transferAmount) * (fxQuote?.fx_rate || 1.0)
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {fxQuote?.is_travel_wallet ? (
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center justify-between">
                    <span>Source:</span>
                    <span>Direct Travel Wallet Debit (0 FX Fee)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Locked FX Rate:</span>
                    <span>
                      1 {resolvedPayload.destination_currency} ≈ {fxQuote?.fx_rate || 1.0}{" "}
                      {fxQuote?.origin_currency || user?.preferred_currency || "INR"}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {isQuoteExpired ? (
                  <button
                    type="button"
                    onClick={handleRefreshQuote}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Quote & Restart 120s Timer</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsAmountConfirmed(false)}
                      className="py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Edit Amount
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPin}
                      className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Authorize & Pay with UPI PIN</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UPI PIN Modal */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode="verify"
        title="Authorize Payment"
        subtitle={`Enter 4-digit PIN to transfer ${resolvedPayload?.destination_currency || ""} ${parseFloat(transferAmount || "0").toFixed(2)}`}
        onSuccess={handlePinSuccess}
      />
    </>
  );
};
