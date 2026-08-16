"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Archive,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Binary,
  Sparkles,
  Zap,
  Check,
  FileSpreadsheet,
  Globe2,
  Lock,
  Boxes,
  FileCode,
  Fingerprint,
  HardDrive,
  BadgeCheck,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  SanctionsScreeningResponse,
  LedgerCommitmentResponse,
  ComplianceArchivalResponse,
} from "@/types/payment";
import { commitComplianceArchival } from "@/lib/api";
import { toast } from "sonner";

interface ComplianceArchivalCardProps {
  pacs008: Pacs008MessageResponse;
  screeningResult: SanctionsScreeningResponse;
  ledgerResult: LedgerCommitmentResponse;
  onProceedToRecipientPush: (archivalRes: ComplianceArchivalResponse) => void;
  onBack: () => void;
}

export const ComplianceArchivalCard: React.FC<ComplianceArchivalCardProps> = ({
  pacs008,
  screeningResult,
  ledgerResult,
  onProceedToRecipientPush,
  onBack,
}) => {
  const [isArchiving, setIsArchiving] = useState<boolean>(true);
  const [archiveResult, setArchiveResult] = useState<ComplianceArchivalResponse | null>(null);

  const runComplianceArchival = useCallback(async () => {
    setIsArchiving(true);
    try {
      const res = await commitComplianceArchival({
        uetr: pacs008.uetr,
        message_id: pacs008.message_id,
        pacs008_xml: pacs008.xml_payload || "<Document>...</Document>",
        zk_public_signals: [
          "0x25890fa389812903829038290382903829038290382903829038290382903829",
          "0x1928301928301928301928301928301928301928301928301928301928301928",
          "0x0987654321098765432109876543210987654321098765432109876543210987",
          "1",
        ],
        zk_proof_id: "RHIPAY-ZKP-PROVEN-01",
        merkle_root: "0x25890fa389812903829038290382903829038290382903829038290382903829",
        nullifier_hash: "0x1928301928301928301928301928301928301928301928301928301928301928",
        travel_rule_receipt_id: "TR-REC-20260816-001",
        regulatory_ack_token: "TR-ACK-SG-MAS01",
        enclave_attestation_id: "MAS-AUDIT-CLEARED-01",
        sanctions_audit_log_id: screeningResult.audit_log_id,
        sanctions_verdict: screeningResult.overall_verdict,
        sanctions_seal_hash: screeningResult.audit_seal_hash,
        ledger_commitment_id: ledgerResult.commitment_id,
        ledger_block_height: ledgerResult.ledger_block_height,
        retention_period_years: 7,
        storage_tier: "WORM_COMPLIANT_SECURE_STORAGE",
      });

      setArchiveResult(res);
      setIsArchiving(false);

      toast.success("Compliance Audit Bundle Archived!", {
        description: `7-year WORM retention committed • ID: ${res.archive_id}`,
      });
    } catch (err: unknown) {
      setIsArchiving(false);
      const msg = err instanceof Error ? err.message : "Compliance archival failed";
      toast.error(msg);
    }
  }, [ledgerResult.commitment_id, ledgerResult.ledger_block_height, pacs008.message_id, pacs008.uetr, pacs008.xml_payload, screeningResult.audit_log_id, screeningResult.audit_seal_hash, screeningResult.overall_verdict]);

  useEffect(() => {
    runComplianceArchival();
  }, [runComplianceArchival]);

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
            WORM Audit Repository
          </span>
        </div>
      </div>

      {isArchiving ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Sealing WORM Compliance Audit Trail</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Creating 7-Year Immutable Regulatory Archival</p>
          </div>
        </div>
      ) : archiveResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status Hero Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Compliance Archival Sealed
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  7-Year WORM Mandate ({archiveResult.archival_latency_ms}ms)
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              IMMUTABLE
            </span>
          </div>

          {/* Persisted Audit Manifest Checklist */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Statutory Audit Manifest</span>
              <span className="text-emerald-400 font-mono font-bold">SHA-256 Digest</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">ISO 20022 pacs.008 Wire Message</span>
                <span className="text-emerald-400 font-bold text-[10px]">PERSISTED</span>
              </div>

              <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">Groth16 ZK Public Signals & Root</span>
                <span className="text-emerald-400 font-bold text-[10px]">PERSISTED</span>
              </div>

              <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">FATF Travel Rule Enclave Receipt</span>
                <span className="text-emerald-400 font-bold text-[10px]">PERSISTED</span>
              </div>

              <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">Sanctions & PEP AML Audit Matrix</span>
                <span className="text-emerald-400 font-bold text-[10px]">PERSISTED</span>
              </div>

              <div className="p-2 rounded-xl bg-black/60 border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-300 text-[11px]">Double-Entry Ledger Commitment</span>
                <span className="text-emerald-400 font-bold text-[10px]">PERSISTED</span>
              </div>
            </div>
          </div>

          {/* WORM Non-Repudiation Certificate Panel */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              <span>WORM Non-Repudiation Certificate</span>
              <span>MAS 626 / RBI PSS</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Archive ID:</span>
                <span className="text-white font-bold">{archiveResult.archive_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Retention Expiry:</span>
                <span className="text-white font-bold">
                  {new Date(archiveResult.worm_retention_until).toLocaleDateString()} (7 Years)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Archive Seal Hash:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[190px]">
                  {archiveResult.archive_seal_hash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Signature:</span>
                <span className="text-zinc-300 font-bold truncate max-w-[190px]">
                  {archiveResult.non_repudiation_signature}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Compliance Audit Sealed! Broadcasting Instant Recipient Push Telemetry.");
              onProceedToRecipientPush(archiveResult);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Recipient Push Telemetry</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
