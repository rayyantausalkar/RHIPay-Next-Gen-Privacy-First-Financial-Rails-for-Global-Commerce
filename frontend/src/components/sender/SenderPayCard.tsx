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
  Sparkles,
  ClipboardPaste,
  RotateCcw,
  Globe2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import {
  ProxyResolutionRequest,
  ProxyResolutionResponse,
  SpokeNetworkConfig,
  DynamicPaymentRequestResponse,
} from "@/types/payment";
import { UserProfile, PRESET_P2P_PROFILES } from "@/types/user";
import {
  resolveProxyAlias,
  getNetworkSpokes,
  listRecentRequests,
  markRequestScanned,
} from "@/lib/api";
import { toast } from "sonner";

interface SenderPayCardProps {
  onProceedToAuthorize?: (resolution: ProxyResolutionResponse, amount: number) => void;
}

export const SenderPayCard: React.FC<SenderPayCardProps> = ({
  onProceedToAuthorize,
}) => {
  // Logged-in Sender (Default: Rahul Sharma / India Spoke A)
  const [currentSender, setCurrentSender] = useState<UserProfile>(PRESET_P2P_PROFILES[1]);
  const [showSenderSwitcher, setShowSenderSwitcher] = useState<boolean>(false);

  // Spoke registry
  const [spokes, setSpokes] = useState<SpokeNetworkConfig[]>([]);

  // Input Mode: "qr" vs "manual"
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");

  // Form State
  const [rawQrPayload, setRawQrPayload] = useState<string>("");
  const [destinationCountry, setDestinationCountry] = useState<string>("SG");
  const [proxyType, setProxyType] = useState<string>("MOBILE");
  const [proxyValue, setProxyValue] = useState<string>("+6591234567");
  const [sendAmount, setSendAmount] = useState<string>("45.00");
  const [sendCurrency, setSendCurrency] = useState<string>("SGD");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [scannedRefId, setScannedRefId] = useState<string | null>(null);

  // Resolution State
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolvedResult, setResolvedResult] = useState<ProxyResolutionResponse | null>(null);

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

  // Parse QR URI payload when entered or pasted
  const handleParseQrPayload = async (payloadStr: string) => {
    const cleanStr = payloadStr.trim();
    if (!cleanStr) return;

    try {
      if (cleanStr.startsWith("rhipay://pay?")) {
        const url = new URL(cleanStr.replace("rhipay://", "https://"));
        const ref = url.searchParams.get("ref");
        const proxy = url.searchParams.get("proxy");
        const pType = url.searchParams.get("type") || url.searchParams.get("proxyType") || "MOBILE";
        const country = url.searchParams.get("country") || "SG";
        const ccy = url.searchParams.get("ccy") || "SGD";
        const amt = url.searchParams.get("amt") || "45.00";
        const noteParam = url.searchParams.get("note") || "";

        if (ref) setScannedRefId(ref);
        if (proxy) setProxyValue(proxy);
        setProxyType(pType);
        setDestinationCountry(country);
        setSendCurrency(ccy);
        setSendAmount(amt);
        if (noteParam) setPaymentNote(noteParam);

        toast.info("Dynamic QR Scanned & Parsed!", {
          description: `Resolving recipient name in ${country} (${ccy})...`,
        });

        // Automatically resolve
        await executeResolution(pType, proxy || "+6591234567", country, ref);
      } else {
        // Fallback: search recent requests by ref ID
        const recent = await listRecentRequests(10);
        const matched = recent.find((r) => r.reference_id === cleanStr || cleanStr.includes(r.reference_id));
        if (matched) {
          setScannedRefId(matched.reference_id);
          setProxyValue(matched.recipient_proxy_value);
          setProxyType(matched.recipient_proxy_type);
          setDestinationCountry(matched.destination_country);
          setSendCurrency(matched.destination_currency);
          setSendAmount(Number(matched.requested_amount).toFixed(matched.currency_decimals ?? 2));
          if (matched.note) setPaymentNote(matched.note);

          await executeResolution(
            matched.recipient_proxy_type,
            matched.recipient_proxy_value,
            matched.destination_country,
            matched.reference_id
          );
        } else {
          toast.error("Unrecognized QR payload format. Please check the URI.");
        }
      }
    } catch {
      toast.error("Failed to parse QR payload string");
    }
  };

  // 1-Click Load Latest Dynamic Request
  const handleLoadLatestRequest = async () => {
    try {
      const recent = await listRecentRequests(1);
      if (recent.length > 0) {
        const latest = recent[0];
        setRawQrPayload(latest.qr_payload);
        await handleParseQrPayload(latest.qr_payload);
      } else {
        toast.info("No recent dynamic requests found. Generate one in the Receive tab first!");
      }
    } catch {
      toast.error("Failed to load latest request");
    }
  };

  // Execute Resolution
  const executeResolution = async (
    pType: string,
    pValue: string,
    dCountry: string,
    refId?: string | null
  ) => {
    setIsResolving(true);
    try {
      // If a reference ID exists, notify backend that payer has scanned QR
      if (refId) {
        markRequestScanned(refId).catch(() => {});
      }

      const payload: ProxyResolutionRequest = {
        proxy_type: pType,
        proxy_value: pValue.replace(/\s+/g, ""),
        destination_country: dCountry.toUpperCase(),
        origin_country: currentSender.country_code,
      };

      const result = await resolveProxyAlias(payload);
      setResolvedResult(result);
      toast.success("Recipient Identity & Bank Routing Code Verified!", {
        description: `Beneficiary: ${result.masked_legal_name} • ${result.destination_bank_name}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Proxy resolution failed";
      toast.error(msg);
    } finally {
      setIsResolving(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeResolution(proxyType, proxyValue, destinationCountry, scannedRefId);
  };

  const handleReset = () => {
    setResolvedResult(null);
    setRawQrPayload("");
    setScannedRefId(null);
  };

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
                {currentSender.proxy_value} • {currentSender.ips_network} (Spoke A)
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

      {/* Main State: Unresolved Input vs Resolved Recipient Card */}
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
              <span>Scan Dynamic QR</span>
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
              <span>Enter Proxy Alias</span>
            </button>
          </div>

          {/* Mode A: Scan / Paste Dynamic QR */}
          {inputMode === "qr" && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Paste Dynamic QR Payload / Payment URI
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
                        await handleParseQrPayload(clipText);
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

              <button
                type="button"
                onClick={() => handleParseQrPayload(rawQrPayload)}
                disabled={isResolving || !rawQrPayload.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isResolving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Resolving Recipient Routing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    <span>Resolve & Verify Payee Name</span>
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
                disabled={isResolving || !proxyValue.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isResolving ? (
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
        /* 2. Step 2 Result: Verified Name Inquiry & Bank Routing Card */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 2: Recipient Verified</span>
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
              <ShieldCheck className="w-3 h-3" /> Central Bank Verified Payee
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

          {/* Routing & Institution Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06]">
              <span className="text-[10px] font-medium text-zinc-500 uppercase block mb-1">
                Destination Clearing Spoke
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

            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06] col-span-2">
              <span className="text-[10px] font-medium text-zinc-500 uppercase block mb-0.5">
                Underlying Settlement Institution
              </span>
              <span className="font-medium text-zinc-300">
                {resolvedResult.destination_bank_name} ({resolvedResult.masked_account_number})
              </span>
            </div>
          </div>

          {/* Proceed to Step 3 Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Recipient Confirmed! Ready for Step 3: ZK Proof Authorization");
              if (onProceedToAuthorize) {
                onProceedToAuthorize(resolvedResult, parseFloat(sendAmount));
              }
            }}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm Recipient & Authorize Payment</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};
