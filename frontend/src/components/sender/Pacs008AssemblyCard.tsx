"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Lock,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  Code,
  FileCode,
  Globe2,
  Sparkles,
  ShieldCheck,
  Building2,
} from "lucide-react";
import {
  FXQuoteResponse,
  ProxyResolutionResponse,
  ZKProofGenerateResponse,
  NullifierComputeResponse,
  PIIEnvelopeEncryptResponse,
  Pacs008MessageResponse,
} from "@/types/payment";
import { UserProfile } from "@/types/user";
import { assemblePacs008 } from "@/lib/api";
import { toast } from "sonner";

interface Pacs008AssemblyCardProps {
  quote: FXQuoteResponse;
  recipient: ProxyResolutionResponse;
  zkProof: ZKProofGenerateResponse;
  nullifier: NullifierComputeResponse;
  envelope: PIIEnvelopeEncryptResponse;
  sender: UserProfile;
  onProceedToSettlement: (pacs008: Pacs008MessageResponse) => void;
  onBack: () => void;
}

export const Pacs008AssemblyCard: React.FC<Pacs008AssemblyCardProps> = ({
  quote,
  recipient,
  zkProof,
  nullifier,
  envelope,
  sender,
  onProceedToSettlement,
  onBack,
}) => {
  const [isAssembling, setIsAssembling] = useState<boolean>(true);
  const [pacsMessage, setPacsMessage] = useState<Pacs008MessageResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"xml" | "json">("xml");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const runAssembly = async () => {
      setIsAssembling(true);
      try {
        const res = await assemblePacs008({
          quote_id: quote.quote_id,
          sender_proxy: sender.proxy_value,
          sender_spoke: sender.country_code,
          sender_currency: sender.currency,
          sender_bic: "HDFCINBBXXX",
          recipient_proxy: recipient.proxy_value,
          recipient_spoke: recipient.destination_country,
          recipient_currency: recipient.destination_currency,
          recipient_bic: recipient.destination_bic,
          recipient_name: recipient.masked_legal_name,
          destination_amount: Number(quote.destination_amount),
          origin_debit_amount: Number(quote.origin_debit_amount),
          fx_rate: Number(quote.fx_rate),
          zk_proof: zkProof.proof,
          nullifier_hash: nullifier.nullifier_hash,
          encrypted_envelope: envelope as unknown as Record<string, unknown>,
          purpose_code: "P2PR",
          payment_note: "Cross-Border Instant Settlement",
        });

        if (!isMounted) return;
        setPacsMessage(res);
        setIsAssembling(false);

        toast.success("ISO 20022 pacs.008 Assembled!", {
          description: `UETR: ${res.uetr.slice(0, 16)}...`,
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsAssembling(false);
        const msg = err instanceof Error ? err.message : "Failed to assemble ISO 20022 message";
        toast.error(msg);
      }
    };

    runAssembly();
    return () => {
      isMounted = false;
    };
  }, [envelope, nullifier, quote, recipient, sender, zkProof]);

  const handleCopyPayload = () => {
    if (!pacsMessage) return;
    const textToCopy =
      activeTab === "xml"
        ? pacsMessage.xml_payload
        : JSON.stringify(pacsMessage.canonical_json, null, 2);

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success(
      activeTab === "xml" ? "Copied raw ISO 20022 XML" : "Copied canonical JSON"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400 font-mono">
            ISO 20022 Messaging
          </span>
        </div>
      </div>

      {isAssembling ? (
        <div className="my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Packaging ISO 20022 pacs.008</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Embedding ZK Proof & Supplementary Data</p>
          </div>
        </div>
      ) : pacsMessage ? (
        <div className="space-y-4 my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Standard Metadata Header Pill */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">
                  {pacsMessage.message_type}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  Clearing: {pacsMessage.clearing_system} ({pacsMessage.settlement_method})
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Valid XML Schema
            </span>
          </div>

          {/* Transaction Summary Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06]">
              <span className="text-[10px] font-medium text-zinc-500 uppercase block mb-0.5">
                Instructed Debit
              </span>
              <span className="font-extrabold text-sm text-white font-mono">
                {Number(pacsMessage.instructed_amount).toFixed(2)} {pacsMessage.instructed_currency}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06]">
              <span className="text-[10px] font-medium text-zinc-500 uppercase block mb-0.5">
                Settlement Credit
              </span>
              <span className="font-extrabold text-sm text-emerald-400 font-mono">
                {Number(pacsMessage.settlement_amount).toFixed(2)} {pacsMessage.settlement_currency}
              </span>
            </div>
          </div>

          {/* UETR & Message ID */}
          <div className="p-3 rounded-2xl bg-zinc-950 border border-white/[0.06] space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-sans">UETR (RFC 4122):</span>
              <span className="text-emerald-400 font-bold truncate max-w-[190px]">
                {pacsMessage.uetr}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-sans">Message Id:</span>
              <span className="text-zinc-300 truncate max-w-[190px]">
                {pacsMessage.message_id}
              </span>
            </div>
          </div>

          {/* Dual XML & JSON Inspector Box */}
          <div className="rounded-2xl bg-zinc-950 border border-white/[0.08] overflow-hidden">
            <div className="flex items-center justify-between p-2 px-3 border-b border-white/[0.06] bg-black/40">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("xml")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    activeTab === "xml"
                      ? "bg-emerald-500 text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Raw XML
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("json")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    activeTab === "json"
                      ? "bg-emerald-500 text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Canonical JSON
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <pre className="p-3 text-[10px] font-mono text-emerald-300/90 max-h-44 overflow-y-auto overflow-x-auto leading-relaxed select-all">
              {activeTab === "xml"
                ? pacsMessage.xml_payload
                : JSON.stringify(pacsMessage.canonical_json, null, 2)}
            </pre>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Ready for Final Hub Settlement!");
              onProceedToSettlement(pacsMessage);
            }}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Submit to Nexus Hub for Final Settlement</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
