"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Binary,
  Layers,
  Sparkles,
  Zap,
  Check,
  Globe2,
  FileText,
  UserCheck,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  PIIEnvelopeEncryptResponse,
  TravelRuleDispatchResponse,
  EnclaveDecryptionResponse,
} from "@/types/payment";
import { executeEnclaveDecryption } from "@/lib/api";
import { toast } from "sonner";

interface EnclaveDecryptionCardProps {
  pacs008: Pacs008MessageResponse;
  envelope: PIIEnvelopeEncryptResponse;
  dispatchResult: TravelRuleDispatchResponse;
  onProceedToNullifierInscription: (enclaveRes: EnclaveDecryptionResponse) => void;
  onBack: () => void;
}

export const EnclaveDecryptionCard: React.FC<EnclaveDecryptionCardProps> = ({
  pacs008,
  envelope,
  dispatchResult,
  onProceedToNullifierInscription,
  onBack,
}) => {
  const [isDecrypting, setIsDecrypting] = useState<boolean>(true);
  const [enclaveResult, setEnclaveResult] = useState<EnclaveDecryptionResponse | null>(null);

  const runEnclaveDecryption = useCallback(async () => {
    setIsDecrypting(true);
    try {
      const res = await executeEnclaveDecryption({
        uetr: pacs008.uetr,
        envelope_id: envelope.envelope_id,
        destination_spoke: envelope.destination_spoke,
        encrypted_aes_key: envelope.encrypted_aes_key,
        encrypted_pii_ciphertext: envelope.encrypted_pii_ciphertext,
        iv: envelope.iv,
        auth_tag: envelope.auth_tag,
        auditor_node_id: dispatchResult.recipient_regulator_node,
        enclave_isolation_mode: "HARDWARE_SECURE_ENCLAVE_HSM",
      });

      setEnclaveResult(res);
      setIsDecrypting(false);

      toast.success("Enclave Decryption & AML Screening Complete!", {
        description: `Verified in HSM Enclave • Attestation: ${res.attestation_id.slice(0, 18)}...`,
      });
    } catch (err: unknown) {
      setIsDecrypting(false);
      const msg = err instanceof Error ? err.message : "Enclave decryption failed";
      toast.error(msg);
    }
  }, [dispatchResult.recipient_regulator_node, envelope.auth_tag, envelope.destination_spoke, envelope.encrypted_aes_key, envelope.encrypted_pii_ciphertext, envelope.envelope_id, envelope.iv, pacs008.uetr]);

  useEffect(() => {
    runEnclaveDecryption();
  }, [runEnclaveDecryption]);

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
            HSM Secure Enclave
          </span>
        </div>
      </div>

      {isDecrypting ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Decrypting in Hardware Secure Enclave</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">RSA-OAEP-256 + AES-256-GCM Compliance Inspection</p>
          </div>
        </div>
      ) : enclaveResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Enclave Inspection Approved
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {enclaveResult.enclave_security_tier} ({enclaveResult.decryption_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              AUDITED
            </span>
          </div>

          {/* Secure Enclave Isolation Architecture Banner */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Enclave Security Boundary</span>
              <span className="text-emerald-400 font-mono font-bold">{enclaveResult.auditor_node_id}</span>
            </div>

            <div className="text-[11px] text-zinc-300 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500">Asymmetric Decryption:</span>
                <span className="text-white font-bold">RSA-OAEP-256 (Private Key)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500">Symmetric Decryption:</span>
                <span className="text-emerald-400 font-bold">AES-256-GCM (128-bit Auth Tag)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500">Network Privacy:</span>
                <span className="text-white font-semibold">0% PII leaked to Rails / Hub</span>
              </div>
            </div>
          </div>

          {/* Decrypted Statutory AML Inspection Log */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <div className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Statutory Decrypted PII Payload</span>
              </div>
              <span className="text-zinc-500">Recommendation 16</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Originator / Payer */}
              <div className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
                  Payer / Originator
                </span>
                <div className="font-bold text-white text-xs">{enclaveResult.originator_name}</div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {enclaveResult.originator_proxy} • {enclaveResult.originator_national_id}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {enclaveResult.originator_address} • BIC: {enclaveResult.originator_bic}
                </div>
              </div>

              {/* Beneficiary / Payee */}
              <div className="p-2.5 rounded-2xl bg-black/60 border border-white/[0.04] space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
                  Payee / Beneficiary
                </span>
                <div className="font-bold text-emerald-400 text-xs">{enclaveResult.beneficiary_name}</div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {enclaveResult.beneficiary_proxy} • BIC: {enclaveResult.beneficiary_bic}
                </div>
              </div>
            </div>
          </div>

          {/* Automated Real-Time Sanction & AML Screening Matrix */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.06] space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Automated AML / CFT Matrix</span>
              <span className="text-emerald-400 font-mono">{enclaveResult.sanction_screening.aml_tier}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
              <div className="p-1.5 rounded-xl bg-black/50 border border-white/[0.04]">
                <span className="text-[9px] text-zinc-500 block uppercase">Sanctions</span>
                <span className="text-emerald-400 font-bold">{enclaveResult.sanction_screening.status}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-black/50 border border-white/[0.04]">
                <span className="text-[9px] text-zinc-500 block uppercase">PEP Check</span>
                <span className="text-emerald-400 font-bold">NEGATIVE</span>
              </div>
              <div className="p-1.5 rounded-xl bg-black/50 border border-white/[0.04]">
                <span className="text-[9px] text-zinc-500 block uppercase">Risk Score</span>
                <span className="text-emerald-400 font-bold">{enclaveResult.sanction_screening.risk_score}</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-white/[0.04] text-[10px] font-mono text-zinc-500 truncate">
              Attestation: {enclaveResult.attestation_id}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Enclave Decryption Verified! Proceeding to Step 20: Nullifier State Permanent Inscription");
              onProceedToNullifierInscription(enclaveResult);
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
