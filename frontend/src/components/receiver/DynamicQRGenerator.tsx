"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Globe2,
  SlidersHorizontal,
} from "lucide-react";
import {
  DynamicPaymentRequestCreate,
  DynamicPaymentRequestResponse,
  SpokeNetworkConfig,
} from "@/types/payment";
import { createPaymentRequest, validateProxy, getNetworkSpokes } from "@/lib/api";
import { toast } from "sonner";

interface DynamicQRGeneratorProps {
  onRequestGenerated: (request: DynamicPaymentRequestResponse) => void;
}

export const DynamicQRGenerator: React.FC<DynamicQRGeneratorProps> = ({
  onRequestGenerated,
}) => {
  const [spokes, setSpokes] = useState<SpokeNetworkConfig[]>([]);
  const [isCustomIsoMode, setIsCustomIsoMode] = useState<boolean>(false);

  const [destinationCountry, setDestinationCountry] = useState<string>("SG");
  const [destinationCurrency, setDestinationCurrency] = useState<string>("SGD");
  const [originSpoke, setOriginSpoke] = useState<string>("IN");
  const [recipientName, setRecipientName] = useState<string>("Marina Bay Delights");
  const [proxyType, setProxyType] = useState<string>("MOBILE");
  const [proxyValue, setProxyValue] = useState<string>("+6591234567");
  const [amount, setAmount] = useState<string>("45.00");
  const [note, setNote] = useState<string>("Cross-Border P2P Settlement");
  const [expirySeconds, setExpirySeconds] = useState<number>(900);
  const [purposeCode, setPurposeCode] = useState<string>("P2P_TRANSFER");

  const [proxyValidation, setProxyValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: true });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleSpokeSelect = (code: string) => {
    setDestinationCountry(code);
    const selected = spokes.find((s) => s.country_code === code);
    if (selected) {
      setDestinationCurrency(selected.currency);
      if (selected.default_proxy_example) {
        setProxyValue(selected.default_proxy_example);
      }
      if (selected.supported_proxy_types.length > 0) {
        setProxyType(selected.supported_proxy_types[0]);
      }
    }
  };

  useEffect(() => {
    if (!proxyValue.trim()) {
      setProxyValidation({ isValid: false, error: "Proxy value cannot be empty" });
      return;
    }

    const timer = setTimeout(async () => {
      const result = await validateProxy({
        proxy_type: proxyType,
        proxy_value: proxyValue,
        country: destinationCountry,
      });
      setProxyValidation({
        isValid: result.is_valid,
        error: result.error_message,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [proxyValue, proxyType, destinationCountry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDestCountry = destinationCountry.trim().toUpperCase();
    const cleanDestCurrency = destinationCurrency.trim().toUpperCase();
    const cleanOriginSpoke = originSpoke.trim().toUpperCase() || undefined;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid requested amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DynamicPaymentRequestCreate = {
        recipient_name: recipientName.trim(),
        recipient_proxy_type: proxyType.toUpperCase(),
        recipient_proxy_value: proxyValue.trim(),
        destination_country: cleanDestCountry,
        destination_currency: cleanDestCurrency,
        origin_spoke: cleanOriginSpoke,
        requested_amount: parsedAmount,
        note: note.trim() || undefined,
        expiry_seconds: expirySeconds,
        purpose_code: purposeCode,
      };

      const result = await createPaymentRequest(payload);
      toast.success("Payment QR Generated!", {
        description: `Corridor: ${cleanOriginSpoke || "Global"} → ${cleanDestCountry} (${cleanDestCurrency})`,
      });
      onRequestGenerated(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate request";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#09090b] rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dynamic Payment Request Generator
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Universal standard supporting ANY two country spokes (ISO 3166-1) and currencies (ISO 4217)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomIsoMode(!isCustomIsoMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isCustomIsoMode
              ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20 font-bold"
              : "bg-zinc-950 text-zinc-300 border-white/[0.08] hover:bg-zinc-900"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isCustomIsoMode ? "Custom ISO Mode Active" : "Enter Any ISO Pair"}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {!isCustomIsoMode ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                Destination Spoke (Settlement Country)
              </label>
              <span className="text-[11px] text-zinc-400">
                {spokes.length} Connected Rails in Nexus Registry
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {spokes.map((spoke) => {
                const isSelected = destinationCountry === spoke.country_code;
                return (
                  <button
                    key={spoke.country_code}
                    type="button"
                    onClick={() => handleSpokeSelect(spoke.country_code)}
                    className={`p-3 rounded-2xl border flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                        : "bg-zinc-950 border-white/[0.08] text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <span className="text-2xl">{spoke.flag_emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">
                        {spoke.country_name}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{spoke.country_code}</span>
                        <span>•</span>
                        <span className="font-bold">{spoke.currency}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Custom Universal ISO Corridor Inputs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Destination Country (ISO 3166-1)
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. JP, AE, CH, BR, AU"
                  className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-xl text-sm font-mono text-emerald-300 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Destination Currency (ISO 4217)
                </label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={destinationCurrency}
                  onChange={(e) => setDestinationCurrency(e.target.value.toUpperCase())}
                  placeholder="e.g. JPY, AED, CHF, BRL"
                  className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-xl text-sm font-mono text-emerald-300 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Origin Spoke (Optional ISO 3166-1)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={originSpoke}
                  onChange={(e) => setOriginSpoke(e.target.value.toUpperCase())}
                  placeholder="e.g. IN, SG, US, GB"
                  className="w-full px-3 py-2 bg-black border border-white/[0.08] rounded-xl text-sm font-mono text-zinc-200 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Recipient Name
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Recipient Name"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Proxy Scheme Type
            </label>
            <select
              value={proxyType}
              onChange={(e) => setProxyType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="MOBILE">MOBILE (E.164 / Domestic)</option>
              <option value="VPA">VPA / UPI Identifier (name@handle)</option>
              <option value="EMAIL">EMAIL (user@domain.com)</option>
              <option value="NATIONAL_ID">NATIONAL_ID (NRIC / Aadhaar / Thai ID)</option>
              <option value="IBAN">IBAN (International Bank Account)</option>
              <option value="UEN">UEN / Business Registry</option>
              <option value="ALIAS">ALIAS (Custom Scheme Proxy)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Destination Proxy Value ({destinationCountry})
              </label>
              {proxyValidation.isValid ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid Format
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {proxyValidation.error}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={proxyValue}
              onChange={(e) => setProxyValue(e.target.value)}
              placeholder="e.g. +6591234567, name@bank, payee@domain.com"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/[0.08] rounded-xl text-sm font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-white/[0.08] space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Requested Amount ({destinationCurrency})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400 font-mono">
              {destinationCurrency}
            </span>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-20 pr-4 py-3 bg-black border border-white/[0.08] rounded-xl text-xl font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !proxyValidation.isValid}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 group"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Generating Payload...</span>
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Generate Dynamic Payment QR ({destinationCurrency})</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
