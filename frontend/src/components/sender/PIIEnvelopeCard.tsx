"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  RotateCcw,
  Building,
  KeyRound,
  FileCheck2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Layers,
  FileCode2,
} from "lucide-react";
import {
  FXQuoteResponse,
  ProxyResolutionResponse,
  ZKProofGenerateResponse,
  NullifierComputeResponse,
  PIIEnvelopeEncryptResponse,
  PIIEnvelopeDecryptResponse,
} from "@/types/payment";
import { UserProfile } from "@/types/user";
import { encryptPIIEnvelope, decryptPIIEnvelope } from "@/lib/api";
import { toast } from "sonner";

interface PIIEnvelopeCardProps {
  quote: FXQuoteResponse;
  recipient: ProxyResolutionResponse;
  zkProof: ZKProofGenerateResponse;
  nullifier: NullifierComputeResponse;
  sender: UserProfile;
  onProceedToISO: (envelope: PIIEnvelopeEncryptResponse) => void;
  onBack: () => void;
}

export const PIIEnvelopeCard: React.FC<PIIEnvelopeCardProps> = ({
  quote,
  recipient,
  zkProof,
  nullifier,
  sender,
  onProceedToISO,
  onBack,
}) => {
  const [isEncrypting, setIsEncrypting] = useState<boolean>(true);
  const [envelope, setEnvelope] = useState<PIIEnvelopeEncryptResponse | null>(null);
  const [decryptedPreview, setDecryptedPreview] = useState<PIIEnvelopeDecryptResponse | null>(null);
  const [isTestingDecryption, setIsTestingDecryption] = useState<boolean>(false);
  const [showRawCiphertext, setShowRawCiphertext] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const runPIIEncryption = async () => {
      setIsEncrypting(true);
      try {
        const enc = await encryptPIIEnvelope({
          destination_spoke: recipient.destination_country,
          quote_id: quote.quote_id,
          originator_name: sender.name,
          originator_proxy: sender.proxy_value,
          originator_address: `${sender.country_name}, Capital District`,
          originator_national_id: `NAT-ID-${sender.country_code}-8912`,
          originator_bic: "HDFCINBBXXX",
          beneficiary_name: recipient.masked_legal_name,
          beneficiary_proxy: recipient.proxy_value,
          beneficiary_bic: recipient.destination_bic,
        });

        if (!isMounted) return;
        setEnvelope(enc);
        setIsEncrypting(false);

        toast.success("FATF Travel Rule PII Encrypted!", {
          description: `Target: ${enc.recipient_regulator_id} (${enc.encryption_algorithm})`,
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsEncrypting(false);
        const msg = err instanceof Error ? err.message : "Encryption failed";
        toast.error(msg);
      }
    };

    runPIIEncryption();
    return () => {
      isMounted = false;
    };
  }, [quote.quote_id, recipient, sender]);

  // Simulate Statutory Regulatory Node Decryption
  const handleTestRegulatoryDecryption = async () => {
    if (!envelope) return;
    setIsTestingDecryption(true);

    try {
      toast.loading("Simulating Regulatory Compliance Node Decryption...", { id: "dec" });
      const dec = await decryptPIIEnvelope({
        destination_spoke: envelope.destination_spoke,
        envelope_id: envelope.envelope_id,
        encrypted_aes_key: envelope.encrypted_aes_key,
        encrypted_pii_ciphertext: envelope.encrypted_pii_ciphertext,
        iv: envelope.iv,
        auth_tag: envelope.auth_tag,
      });

      setDecryptedPreview(dec);
      toast.dismiss("dec");
      toast.success("Regulatory Compliance Node Verified!", {
        description: "FATF Travel Rule AML/CFT fields fully validated.",
      });
    } catch {
      toast.dismiss("dec");
      toast.error("Decryption failed");
    } finally {
      setIsTestingDecryption(false);
    }
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
            FATF Travel Rule Envelope
          </span>
        </div>
      </div>

      {isEncrypting ? (
        <div className="my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Encrypting Asymmetric Compliance Envelope</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">RSA-OAEP-256 + AES-256-GCM</p>
          </div>
        </div>
      ) : envelope ? (
        <div className="space-y-4 my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Target Regulatory Node Badge */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {envelope.recipient_regulator_id}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  {envelope.encryption_algorithm}
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              RSA-2048 HSM
            </span>
          </div>

          {/* FATF Travel Rule Encrypted Data Summary */}
          <div className="p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                FATF Travel Rule Compliance Payload
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">Zero-Knowledge Transit</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Originator (Payer):</span>
                <span className="font-semibold text-zinc-200">{sender.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Originator BIC:</span>
                <span className="font-mono text-emerald-400">HDFCINBBXXX</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Beneficiary (Payee):</span>
                <span className="font-mono text-zinc-200">{recipient.masked_legal_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Beneficiary BIC:</span>
                <span className="font-mono text-emerald-400">{recipient.destination_bic}</span>
              </div>
            </div>

            {/* Zero-Knowledge Routing Guarantee */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Intermediate routing hubs cannot read sender PII; only authorized regulatory HSM can decrypt.</span>
            </div>
          </div>

          {/* Expandable Ciphertext Inspector */}
          <div className="rounded-2xl bg-zinc-950/60 border border-white/[0.06] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawCiphertext(!showRawCiphertext)}
              className="w-full p-3 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors text-left"
            >
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inspect Encrypted Ciphertext & GCM Tag</span>
              </div>
              {showRawCiphertext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {showRawCiphertext && (
              <div className="p-3 pt-0 text-[10px] font-mono text-zinc-400 space-y-2 border-t border-white/[0.04] max-h-36 overflow-y-auto">
                <div>
                  <span className="text-emerald-400 font-bold">Encrypted AES Key (RSA-OAEP):</span>
                  <div className="truncate text-zinc-500">{envelope.encrypted_aes_key}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">PII Ciphertext (AES-256-GCM):</span>
                  <div className="truncate text-zinc-500">{envelope.encrypted_pii_ciphertext}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">GCM Nonce / IV:</span>
                  <div className="truncate text-zinc-500">{envelope.iv}</div>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Digest:</span> {envelope.envelope_digest}
                </div>
              </div>
            )}
          </div>

          {/* Test Regulatory Node Decryption Button */}
          <button
            type="button"
            onClick={handleTestRegulatoryDecryption}
            disabled={isTestingDecryption}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/30 text-xs font-semibold text-zinc-300 hover:text-emerald-300 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Destination Regulator Node Inspection</span>
          </button>

          {/* Regulatory Decryption Success Modal/Banner */}
          {decryptedPreview && (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Regulatory Node Decryption & FATF Audit Passed</span>
              </div>
              <div className="text-[11px] text-zinc-300 font-mono">
                Decrypted Originator: {decryptedPreview.originator_name} ({decryptedPreview.originator_proxy})
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Envelope Sealed! Ready for ISO 20022 Settlement");
              onProceedToISO(envelope);
            }}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Proceed to ISO 20022 Settlement</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
