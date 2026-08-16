"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Search,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ClipboardPaste,
  RotateCcw,
  Globe2,
  RefreshCw,
  FileCheck,
  KeyRound,
  Clock,
  Check,
  Bug,
  TrendingUp,
  Camera,
} from "lucide-react";
import {
  ProxyResolutionRequest,
  ProxyResolutionResponse,
  PayloadValidationResponse,
  FXQuoteResponse,
  ZKProofGenerateResponse,
  NullifierComputeResponse,
  PIIEnvelopeEncryptResponse,
  Pacs008MessageResponse,
  SpokeNetworkConfig,
} from "@/types/payment";
import { UserProfile, PRESET_P2P_PROFILES } from "@/types/user";
import {
  resolveProxyAlias,
  validatePaymentPayload,
  lockFXQuote,
  getNetworkSpokes,
  listRecentRequests,
  markRequestScanned,
} from "@/lib/api";
import { FXQuoteLockCard } from "./FXQuoteLockCard";
import { ZKProofGenerationCard } from "./ZKProofGenerationCard";
import { NullifierComputationCard } from "./NullifierComputationCard";
import { PIIEnvelopeCard } from "./PIIEnvelopeCard";
import { Pacs008AssemblyCard } from "./Pacs008AssemblyCard";
import { CameraQRScannerModal } from "./CameraQRScannerModal";
import { toast } from "sonner";

interface SenderPayCardProps {
  onPaymentComplete?: () => void;
}

export const SenderPayCard: React.FC<SenderPayCardProps> = ({
  onPaymentComplete,
}) => {
  // Logged-in Sender (Default: Rahul Sharma / India Spoke A)
  const [currentSender, setCurrentSender] = useState<UserProfile>(PRESET_P2P_PROFILES[1]);
  const [showSenderSwitcher, setShowSenderSwitcher] = useState<boolean>(false);

  // Spoke registry
  const [spokes, setSpokes] = useState<SpokeNetworkConfig[]>([]);

  // Input Mode: "qr" vs "manual"
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");

  // Camera QR Scanner Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  // Form State
  const [rawQrPayload, setRawQrPayload] = useState<string>("");
  const [destinationCountry, setDestinationCountry] = useState<string>("SG");
  const [proxyType, setProxyType] = useState<string>("MOBILE");
  const [proxyValue, setProxyValue] = useState<string>("+6591234567");
  const [sendAmount, setSendAmount] = useState<string>("45.00");
  const [sendCurrency, setSendCurrency] = useState<string>("SGD");
  const [paymentNote, setPaymentNote] = useState<string>("");

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<PayloadValidationResponse | null>(null);
  const [resolvedResult, setResolvedResult] = useState<ProxyResolutionResponse | null>(null);

  // Step 4 Locked FX Quote State
  const [activeFXQuote, setActiveFXQuote] = useState<FXQuoteResponse | null>(null);

  // Step 5 ZK-SNARK Prover State
  const [showZKProver, setShowZKProver] = useState<boolean>(false);
  const [activeZKProof, setActiveZKProof] = useState<ZKProofGenerateResponse | null>(null);

  // Step 6 Nullifier State
  const [showNullifierCard, setShowNullifierCard] = useState<boolean>(false);
  const [activeNullifier, setActiveNullifier] = useState<NullifierComputeResponse | null>(null);

  // Step 7 PII Envelope State
  const [showEnvelopeCard, setShowEnvelopeCard] = useState<boolean>(false);
  const [activeEnvelope, setActiveEnvelope] = useState<PIIEnvelopeEncryptResponse | null>(null);

  // Step 8 ISO 20022 pacs.008 State
  const [showISO20022Card, setShowISO20022Card] = useState<boolean>(false);
  const [activePacs008, setActivePacs008] = useState<Pacs008MessageResponse | null>(null);

  // Fetch spokes on mount
  useEffect(() => {
    const fetchSpokes = async () => {
      try {
        const res = await getNetworkSpokes();
        setSpokes(res.spokes);
      } catch {
        // Handled in API
      }
    };
    fetchSpokes();
  }, []);

  // Step 3: Ingest and cryptographically validate QR payload
  const handleIngestAndValidate = async (payloadToTest: string) => {
    const cleanStr = payloadToTest.trim();
    if (!cleanStr) {
      toast.error("Please enter or paste a payment URI");
      return;
    }

    setIsProcessing(true);
    setValidationResult(null);
    setResolvedResult(null);
    setActiveFXQuote(null);
    setShowZKProver(false);
    setActiveZKProof(null);
    setShowNullifierCard(false);
    setActiveNullifier(null);
    setShowEnvelopeCard(false);
    setActiveEnvelope(null);
    setShowISO20022Card(false);
    setActivePacs008(null);

    try {
      toast.loading("Ingesting & Verifying Cryptographic Signature...", { id: "ingest" });
      
      const valRes = await validatePaymentPayload(cleanStr);
      setValidationResult(valRes);

      if (!valRes.is_valid) {
        toast.dismiss("ingest");
        toast.error("Security Alert: QR Validation Failed!", {
          description: valRes.error_details || "Payload signature or expiry invalid",
        });
        setIsProcessing(false);
        return;
      }

      toast.dismiss("ingest");
      toast.success("Signature Integrity & Schema Verified!", {
        description: `Reference: ${valRes.reference_id}`,
      });

      setDestinationCountry(valRes.destination_country);
      setSendCurrency(valRes.destination_currency);
      setProxyType(valRes.proxy_type);
      setProxyValue(valRes.proxy_value);
      setSendAmount(Number(valRes.requested_amount).toFixed(valRes.currency_decimals ?? 2));
      if (valRes.note) setPaymentNote(valRes.note);

      if (valRes.reference_id) {
        markRequestScanned(valRes.reference_id).catch(() => {});
      }

      // Step 2: Resolve proxy name & bank routing code
      const resolvePayload: ProxyResolutionRequest = {
        proxy_type: valRes.proxy_type,
        proxy_value: valRes.proxy_value,
        destination_country: valRes.destination_country,
        origin_country: currentSender.country_code,
      };
      const resResult = await resolveProxyAlias(resolvePayload);
      setResolvedResult(resResult);
    } catch (err: unknown) {
      toast.dismiss("ingest");
      const msg = err instanceof Error ? err.message : "Validation failed";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Load Latest Dynamic Request
  const handleLoadLatestRequest = async () => {
    try {
      const recent = await listRecentRequests(1);
      if (recent.length > 0) {
        const latest = recent[0];
        setRawQrPayload(latest.qr_payload);
        await handleIngestAndValidate(latest.qr_payload);
      } else {
        toast.info("No recent dynamic requests found. Generate one in the Receive tab first!");
      }
    } catch {
      toast.error("Failed to load latest request");
    }
  };

  // Interactive Tamper Attack Test
  const handleSimulateTamperedAttack = async () => {
    if (!rawQrPayload) {
      toast.info("Load a valid QR first, then test tampering");
      return;
    }
    const tampered = rawQrPayload
      .replace("amt=45.00", "amt=1.00")
      .replace("amt=45.0", "amt=1.00")
      .replace("amt=50", "amt=1")
      .replace("ccy=SGD", "ccy=USD");
    
    setRawQrPayload(tampered);
    toast.warning("Tampered payload parameters (Amount altered to 1.00 without re-signing)");
    await handleIngestAndValidate(tampered);
  };

  // Manual Direct Resolution
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload: ProxyResolutionRequest = {
        proxy_type: proxyType,
        proxy_value: proxyValue.replace(/\s+/g, ""),
        destination_country: destinationCountry.toUpperCase(),
        origin_country: currentSender.country_code,
      };
      const result = await resolveProxyAlias(payload);
      setResolvedResult(result);
      toast.success("Recipient Identity & Bank Routing Verified!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Resolution failed";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4: Lock FX Quote Request
  const handleLockFXQuote = async () => {
    if (!resolvedResult) return;
    setIsProcessing(true);
    try {
      toast.loading("Locking guaranteed FX quote with liquidity desk...", { id: "fx" });
      const quote = await lockFXQuote({
        origin_currency: currentSender.currency,
        destination_currency: resolvedResult.destination_currency,
        destination_amount: parseFloat(sendAmount) || 45.0,
        sender_spoke: currentSender.country_code,
        recipient_spoke: resolvedResult.destination_country,
        ttl_seconds: 60,
      });
      setActiveFXQuote(quote);
      toast.dismiss("fx");
      toast.success("Guaranteed Zero-Slippage Rate Locked!");
    } catch (err: unknown) {
      toast.dismiss("fx");
      const msg = err instanceof Error ? err.message : "Failed to lock FX quote";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setValidationResult(null);
    setResolvedResult(null);
    setActiveFXQuote(null);
    setShowZKProver(false);
    setActiveZKProof(null);
    setShowNullifierCard(false);
    setActiveNullifier(null);
    setShowEnvelopeCard(false);
    setActiveEnvelope(null);
    setShowISO20022Card(false);
    setActivePacs008(null);
    setRawQrPayload("");
  };

  // 1. If Step 8 ISO 20022 Card is active:
  if (showISO20022Card && activeFXQuote && resolvedResult && activeZKProof && activeNullifier && activeEnvelope) {
    return (
      <Pacs008AssemblyCard
        quote={activeFXQuote}
        recipient={resolvedResult}
        zkProof={activeZKProof}
        nullifier={activeNullifier}
        envelope={activeEnvelope}
        sender={currentSender}
        onProceedToSettlement={(pacs) => {
          setActivePacs008(pacs);
          toast.success("Message dispatched to BIS Nexus Hub!");
        }}
        onBack={() => setShowISO20022Card(false)}
      />
    );
  }

  // 2. If Step 7 PII Envelope Card is active:
  if (showEnvelopeCard && activeFXQuote && resolvedResult && activeZKProof && activeNullifier) {
    return (
      <PIIEnvelopeCard
        quote={activeFXQuote}
        recipient={resolvedResult}
        zkProof={activeZKProof}
        nullifier={activeNullifier}
        sender={currentSender}
        onProceedToISO={(env) => {
          setActiveEnvelope(env);
          setShowISO20022Card(true);
        }}
        onBack={() => setShowEnvelopeCard(false)}
      />
    );
  }

  // 3. If Step 6 Nullifier Card is active:
  if (showNullifierCard && activeFXQuote && resolvedResult && activeZKProof) {
    return (
      <NullifierComputationCard
        quote={activeFXQuote}
        recipient={resolvedResult}
        zkProof={activeZKProof}
        senderProxy={currentSender.proxy_value}
        senderCountry={currentSender.country_code}
        onProceedToEnvelope={(nullifier) => {
          setActiveNullifier(nullifier);
          setShowEnvelopeCard(true);
        }}
        onBack={() => setShowNullifierCard(false)}
      />
    );
  }

  // 4. If Step 5 ZK-SNARK Prover is active:
  if (showZKProver && activeFXQuote && resolvedResult) {
    return (
      <ZKProofGenerationCard
        quote={activeFXQuote}
        recipient={resolvedResult}
        senderProxy={currentSender.proxy_value}
        senderCountry={currentSender.country_code}
        onProceedToEnvelope={(proof) => {
          setActiveZKProof(proof);
          setShowNullifierCard(true);
        }}
        onBack={() => setShowZKProver(false)}
      />
    );
  }

  // 5. If Step 4 FX Quote is locked:
  if (activeFXQuote && resolvedResult) {
    return (
      <FXQuoteLockCard
        initialQuote={activeFXQuote}
        recipient={resolvedResult}
        senderCurrency={currentSender.currency}
        senderCountry={currentSender.country_code}
        onProceedToZKP={() => {
          setShowZKProver(true);
        }}
        onBack={() => setActiveFXQuote(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Logged-in Sender Top Card */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-sm text-black shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40">
              {currentSender.avatar_initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  {currentSender.name}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <UserCheck className="w-3 h-3" /> Payer
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {currentSender.proxy_value} • {currentSender.ips_network} ({currentSender.country_code})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSenderSwitcher(!showSenderSwitcher)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-300 border border-white/[0.08] transition-colors"
            title="Switch sender identity"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] hidden sm:inline">Switch</span>
          </button>
        </div>

        {/* Sender Switcher */}
        {showSenderSwitcher && (
          <div className="absolute top-full left-0 right-0 mt-2 z-20 p-2 bg-black border border-white/10 rounded-2xl shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Select Payer Identity
            </div>
            {PRESET_P2P_PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCurrentSender(p);
                  setShowSenderSwitcher(false);
                  toast.info(`Switched payer to ${p.name}`);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                  currentSender.id === p.id
                    ? "bg-emerald-500/15 text-white font-semibold border border-emerald-500/30"
                    : "hover:bg-white/[0.04] text-zinc-300 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{p.flag_emoji}</span>
                  <div>
                    <div className="text-xs font-semibold">{p.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.proxy_value}</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{p.currency}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main State: Ingestion Input vs Verified Recipient & Security Card */}
      {!resolvedResult ? (
        <div className="space-y-6">
          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setInputMode("qr")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                inputMode === "qr"
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Ingest & Verify QR</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                inputMode === "manual"
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Manual Proxy</span>
            </button>
          </div>

          {/* Mode A: Step 3 QR / Payload Ingestion & Validation */}
          {inputMode === "qr" && (
            <div className="space-y-4 animate-in fade-in">
              {/* Camera Scan Hero Button */}
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="w-full py-4 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 text-white flex items-center justify-center gap-3 transition-all group shadow-inner"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                    Scan with Camera
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Live camera viewfinder & QR photo upload
                  </div>
                </div>
              </button>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Or Paste Payment URI / Raw Payload</span>
                  <span className="text-[10px] text-emerald-400 font-mono">HMAC-SHA256 Signed</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={rawQrPayload}
                    onChange={(e) => setRawQrPayload(e.target.value)}
                    placeholder="Paste rhipay://pay?ref=... or payment intent tag"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-2xl text-xs font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clipText = await navigator.clipboard.readText();
                      if (clipText) {
                        setRawQrPayload(clipText);
                        await handleIngestAndValidate(clipText);
                      }
                    } catch {
                      toast.info("Please paste the URI directly into the text box");
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Paste Clipboard</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadLatestRequest}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Load Latest QR</span>
                </button>
              </div>

              {/* Interactive Tamper Attack Test */}
              {rawQrPayload && (
                <button
                  type="button"
                  onClick={handleSimulateTamperedAttack}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  <span>Test Security: Simulate Tampered Amount Attack</span>
                </button>
              )}

              {/* Validation Failure Alert */}
              {validationResult && !validationResult.is_valid && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-left space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <XCircle className="w-4 h-4" />
                    <span>Payload Cryptographic Validation Failed</span>
                  </div>
                  <p className="text-xs text-rose-200">
                    {validationResult.error_details}
                  </p>
                  <div className="pt-2 border-t border-rose-500/20 text-[11px] font-mono text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Signature Integrity:</span>
                      <span className={validationResult.validation_checks.signature_integrity ? "text-emerald-400" : "text-rose-400 font-bold"}>
                        {validationResult.validation_checks.signature_integrity ? "VERIFIED" : "TAMPERED / MISMATCH"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiry Freshness:</span>
                      <span className={validationResult.validation_checks.expiry_validity ? "text-emerald-400" : "text-rose-400 font-bold"}>
                        {validationResult.validation_checks.expiry_validity ? "ACTIVE" : "EXPIRED"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleIngestAndValidate(rawQrPayload)}
                disabled={isProcessing || !rawQrPayload.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Verifying Integrity & Resolving Payee...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Ingest & Cryptographically Validate</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mode B: Manual Recipient Proxy Entry */}
          {inputMode === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Destination Spoke
                  </label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => {
                      setDestinationCountry(e.target.value);
                      const sp = spokes.find((s) => s.country_code === e.target.value);
                      if (sp) setSendCurrency(sp.currency);
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {spokes.map((s) => (
                      <option key={s.country_code} value={s.country_code}>
                        {s.flag_emoji} {s.country_name} ({s.country_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Proxy Scheme Type
                  </label>
                  <select
                    value={proxyType}
                    onChange={(e) => setProxyType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="MOBILE">MOBILE (E.164 / Phone)</option>
                    <option value="VPA">VPA / UPI ID (name@bank)</option>
                    <option value="EMAIL">EMAIL</option>
                    <option value="NATIONAL_ID">NATIONAL_ID / NRIC</option>
                    <option value="IBAN">IBAN</option>
                    <option value="UEN">UEN (Business ID)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Destination Proxy Value
                </label>
                <input
                  type="text"
                  required
                  value={proxyValue}
                  onChange={(e) => setProxyValue(e.target.value)}
                  placeholder="e.g. +6591234567, rahul@okhdfcbank"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-2xl text-xs font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.08]">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                  Transfer Amount ({sendCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-extrabold text-white font-mono focus:outline-none placeholder-zinc-700"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !proxyValue.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Resolving Recipient Routing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    <span>Inquire Name & Routing Code</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* 2. Step 3 & Step 2 Verified Card */
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Payment Integrity Verified</span>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium border border-white/[0.08] transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" />
              <span>Re-scan</span>
            </button>
          </div>

          {/* Masked Legal Name Hero */}
          <div className="p-5 rounded-3xl bg-zinc-950/90 border border-emerald-500/30 text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-2 text-black font-bold text-lg shadow-lg shadow-emerald-500/20">
              {resolvedResult.masked_legal_name.slice(0, 1)}
            </div>

            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-1.5">
              <CheckCircle2 className="w-3 h-3" /> Central Bank Verified Payee
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight font-mono">
              {resolvedResult.masked_legal_name}
            </h3>

            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Proxy: {resolvedResult.proxy_value}
            </p>

            {/* Amount Banner */}
            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-baseline justify-center gap-1.5">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Paying:
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {parseFloat(sendAmount).toFixed(2)} {resolvedResult.destination_currency}
              </span>
            </div>

            {paymentNote && (
              <p className="text-xs text-zinc-400 italic mt-1">
                &ldquo;{paymentNote}&rdquo;
              </p>
            )}
          </div>

          {/* Cryptographic Validation Telemetry Checks */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06] space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-400" />
              Protocol Integrity & Signature Verification
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>HMAC-SHA256 Signature</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>ISO 20022 Schema</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>TTL Expiry Window</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Proxy Standard Norm</span>
              </div>
            </div>

            {validationResult && (
              <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500 truncate">
                Digest: {validationResult.payload_digest.slice(0, 24)}...
              </div>
            )}
          </div>

          {/* Routing & Institution Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06]">
              <span className="text-[10px] font-medium text-zinc-500 uppercase block mb-1">
                Destination Spoke
              </span>
              <span className="font-semibold text-zinc-200 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                {resolvedResult.destination_country} • {resolvedResult.destination_spoke_scheme}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06]">
              <span className="text-[10px] font-medium text-zinc-500 uppercase block mb-1">
                Routing Bank (BIC)
              </span>
              <span className="font-mono font-semibold text-emerald-400 truncate block">
                {resolvedResult.destination_bic}
              </span>
            </div>
          </div>

          {/* Lock FX Quote Action Button */}
          <button
            type="button"
            onClick={handleLockFXQuote}
            disabled={isProcessing}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Locking Guaranteed FX Quote...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                <span>Lock Guaranteed FX Rate</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <CameraQRScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScanSuccess={(detectedUri) => {
          setRawQrPayload(detectedUri);
          handleIngestAndValidate(detectedUri);
        }}
      />
    </div>
  );
};
