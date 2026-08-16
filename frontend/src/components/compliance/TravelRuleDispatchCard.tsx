"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  Layers,
  Scale,
  Sparkles,
  Zap,
  Lock,
  Check,
  Globe2,
  Eye,
  EyeOff,
  FileText,
  UserCheck,
  ArrowLeftRight,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  PIIEnvelopeEncryptResponse,
  SpokeBExecutionResponse,
  TravelRuleDispatchResponse,
  PIIEnvelopeDecryptResponse,
} from "@/types/payment";
import { dispatchTravelRuleEnvelope, decryptPIIEnvelope } from "@/lib/api";
import { toast } from "sonner";

interface TravelRuleDispatchCardProps {
  pacs008: Pacs008MessageResponse;
  envelope: PIIEnvelopeEncryptResponse;
  spokeBResult: SpokeBExecutionResponse;
  onProceedToNullifierInscription: (dispatchRes: TravelRuleDispatchResponse) => void;
  onBack: () => void;
}

export const TravelRuleDispatchCard: React.FC<TravelRuleDispatchCardProps> = ({
  pacs008,
  envelope,
  spokeBResult,
  onProceedToNullifierInscription,
  onBack,
}) => {
  const [isDispatching, setIsDispatching] = useState<boolean>(true);
  const [dispatchResult, setDispatchResult] = useState<TravelRuleDispatchResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [decryptedAudit, setDecryptedAudit] = useState<PIIEnvelopeDecryptResponse | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const runTravelRuleDispatch = useCallback(async () => {
    setIsDispatching(true);
    try {
      const res = await dispatchTravelRuleEnvelope({
        uetr: pacs008.uetr,
        envelope_id: envelope.envelope_id,
        recipient_regulator_id: envelope.recipient_regulator_id,
        destination_spoke: envelope.destination_spoke,
        origin_spoke: "IN",
        encrypted_aes_key: envelope.encrypted_aes_key,
        encrypted_pii_ciphertext: envelope.encrypted_pii_ciphertext,
        iv: envelope.iv,
        auth_tag: envelope.auth_tag,
        settlement_id: spokeBResult.disbursement_id,
      });

      setDispatchResult(res);
      setIsDispatching(false);

      toast.success("FATF Travel Rule Envelope Dispatched!", {
        description: `Delivered to ${res.recipient_regulator_node} • Ack: ${res.regulatory_acknowledgement_token.slice(0, 18)}...`,
      });
    } catch (err: unknown) {
      setIsDispatching(false);
      const msg = err instanceof Error ? err.message : "Travel Rule dispatch failed";
      toast.error(msg);
    }
  }, [envelope.auth_tag, envelope.destination_spoke, envelope.encrypted_aes_key, envelope.encrypted_pii_ciphertext, envelope.envelope_id, envelope.iv, envelope.recipient_regulator_id, pacs008.uetr, spokeBResult.disbursement_id]);

  useEffect(() => {
    runTravelRuleDispatch();
  }, [runTravelRuleDispatch]);

  const handleToggleAuditInspection = async () => {
    if (isInspecting) {
      setIsInspecting(false);
      return;
    }

    setIsInspecting(true);
    if (!decryptedAudit) {
      setIsDecrypting(true);
      try {
        const dec = await decryptPIIEnvelope({
          destination_spoke: envelope.destination_spoke,
          envelope_id: envelope.envelope_id,
          encrypted_aes_key: envelope.encrypted_aes_key,
          encrypted_pii_ciphertext: envelope.encrypted_pii_ciphertext,
          iv: envelope.iv,
          auth_tag: envelope.auth_tag,
        });
        setDecryptedAudit(dec);
        toast.info("Statutory Node Audit Decryption Complete", {
          description: "Authorized regulatory HSM inspection log retrieved",
        });
      } catch {
        toast.error("Failed to decrypt compliance audit payload");
      } finally {
        setIsDecrypting(false);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400 font-mono">
            Compliance Node Dispatcher
          </span>
        </div>
      </div>

      {isDispatching ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Direct Dispatch to Recipient Compliance Node</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">mTLS v1.3 Zero-Knowledge Travel Rule Handshake</p>
          </div>
        </div>
      ) : dispatchResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  FATF Recommendation 16 Satisfied
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {dispatchResult.receipt_id} ({dispatchResult.dispatch_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              COMPLIANT
            </span>
          </div>

          {/* Regulator Handshake Tunnel Card */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Regulatory Node Handshake
              </span>
              <span className="text-emerald-400 font-mono text-[10px] font-bold">
                mTLS TLS 1.3 Tunnel
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Origin Node
                </span>
                <span className="text-xs font-bold text-white block truncate">
                  RBI-IN-COMPLIANCE-01
                </span>
                <span className="text-[9px] text-zinc-400 block">
                  India Spoke Authority
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  Beneficiary Node
                </span>
                <span className="text-xs font-bold text-emerald-400 block truncate">
                  {dispatchResult.recipient_regulator_node}
                </span>
                <span className="text-[9px] text-zinc-400 block">
                  Singapore MAS Spoke
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Regulatory Ack Token:</span>
              <span className="text-emerald-400 font-bold truncate max-w-[190px]">
                {dispatchResult.regulatory_acknowledgement_token}
              </span>
            </div>
          </div>

          {/* Sanction Screening & Privacy Preservation Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Sanction Screening: {dispatchResult.sanction_screening_status}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  Zero PII exposed to payment rails or Hub
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleAuditInspection}
              className="px-2 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-semibold text-zinc-300 border border-white/[0.08] flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              {isInspecting ? <EyeOff className="w-3 h-3 text-emerald-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
              <span>{isInspecting ? "Hide" : "Inspect"}</span>
            </button>
          </div>

          {/* Optional Interactive Decrypted Statutory Audit View */}
          {isInspecting && (
            <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-2 text-xs font-mono animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Statutory Node Decrypted Audit View</span>
                </div>
                <span>CONFIDENTIAL</span>
              </div>

              {isDecrypting ? (
                <div className="py-3 text-center text-zinc-400 animate-pulse">
                  Decrypting via MAS Compliance Node RSA Private Key...
                </div>
              ) : decryptedAudit && decryptedAudit.is_valid ? (
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block uppercase">Payer / Originator:</span>
                    <div className="font-bold text-white">{decryptedAudit.originator_name}</div>
                    <div className="text-[10px] text-zinc-400">ID: {decryptedAudit.originator_national_id} • {decryptedAudit.originator_proxy}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{decryptedAudit.originator_address}</div>
                  </div>

                  <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block uppercase">Payee / Beneficiary:</span>
                    <div className="font-bold text-emerald-400">{decryptedAudit.beneficiary_name}</div>
                    <div className="text-[10px] text-zinc-400">Proxy: {decryptedAudit.beneficiary_proxy} • BIC: {decryptedAudit.beneficiary_bic}</div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("FATF Travel Rule Dispatched! Proceeding to Step 19: Nullifier State Permanent Inscription");
              onProceedToNullifierInscription(dispatchResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Nullifier Inscription</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
