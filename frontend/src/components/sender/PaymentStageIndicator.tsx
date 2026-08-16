"use client";

import React from "react";
import {
  QrCode,
  TrendingUp,
  Cpu,
  KeyRound,
  Lock,
  FileCode,
  Server,
  GitFork,
  Layers,
  ShieldCheck,
  Check,
  Zap,
  Unlock,
  Building2,
  ArrowLeftRight,
  Landmark,
  FileSpreadsheet,
  Key,
  Scale,
  Boxes,
  Archive,
} from "lucide-react";

export type PaymentStage =
  | "ingest"
  | "quote"
  | "zkp"
  | "nullifier"
  | "envelope"
  | "iso20022"
  | "gateway"
  | "routing"
  | "merkle"
  | "groth16"
  | "anti_replay"
  | "crypto_gate"
  | "spoke_a"
  | "fx_swap"
  | "spoke_b"
  | "travel_rule"
  | "enclave_decryption"
  | "sanctions_screening"
  | "ledger_commit"
  | "compliance_archival";

interface PaymentStageIndicatorProps {
  currentStage: PaymentStage;
  onNavigateStage?: (stage: PaymentStage) => void;
}

interface StageItem {
  id: PaymentStage;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const STAGES: StageItem[] = [
  { id: "ingest", label: "Verify Payee", shortLabel: "Payee", icon: QrCode },
  { id: "quote", label: "FX Rate Lock", shortLabel: "Rate", icon: TrendingUp },
  { id: "zkp", label: "ZK Prover", shortLabel: "ZK Proof", icon: Cpu },
  { id: "nullifier", label: "Nullifier", shortLabel: "Nullifier", icon: KeyRound },
  { id: "envelope", label: "FATF Envelope", shortLabel: "Envelope", icon: Lock },
  { id: "iso20022", label: "ISO 20022", shortLabel: "ISO 20022", icon: FileCode },
  { id: "gateway", label: "API Gateway", shortLabel: "Gateway", icon: Server },
  { id: "routing", label: "Stream Routing", shortLabel: "Routing", icon: GitFork },
  { id: "merkle", label: "Merkle Root", shortLabel: "Merkle", icon: Layers },
  { id: "groth16", label: "Circuit Verifier", shortLabel: "Groth16", icon: ShieldCheck },
  { id: "anti_replay", label: "Anti-Replay", shortLabel: "Anti-Replay", icon: Zap },
  { id: "crypto_gate", label: "Crypto Gate", shortLabel: "Gate", icon: Unlock },
  { id: "spoke_a", label: "Spoke A Debit", shortLabel: "Spoke A", icon: Building2 },
  { id: "fx_swap", label: "Atomic FX Swap", shortLabel: "FX Swap", icon: ArrowLeftRight },
  { id: "spoke_b", label: "Spoke B Credit", shortLabel: "Spoke B", icon: Landmark },
  { id: "travel_rule", label: "FATF Dispatch", shortLabel: "FATF", icon: FileSpreadsheet },
  { id: "enclave_decryption", label: "Enclave Decrypt", shortLabel: "Enclave", icon: Key },
  { id: "sanctions_screening", label: "AML Sanctions", shortLabel: "AML", icon: Scale },
  { id: "ledger_commit", label: "Ledger Commitment", shortLabel: "Ledger", icon: Boxes },
  { id: "compliance_archival", label: "WORM Archival", shortLabel: "Archive", icon: Archive },
];

export const PaymentStageIndicator: React.FC<PaymentStageIndicatorProps> = ({
  currentStage,
  onNavigateStage,
}) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full max-w-md mx-auto mb-3 sm:mb-4 bg-zinc-950/80 border border-white/[0.08] p-1.5 sm:p-2 rounded-2xl backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between gap-0.5 sm:gap-1">
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <React.Fragment key={stage.id}>
              {/* Step Button/Pill */}
              <button
                type="button"
                disabled={!isPassed}
                onClick={() => isPassed && onNavigateStage?.(stage.id)}
                className={`flex flex-col items-center gap-0.5 p-0.5 rounded-xl transition-all ${
                  isCurrent
                    ? "text-emerald-400 font-bold scale-105"
                    : isPassed
                    ? "text-zinc-300 hover:text-white cursor-pointer hover:bg-white/[0.04]"
                    : "text-zinc-600 cursor-default opacity-50"
                }`}
                title={stage.label}
              >
                <div
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 ring-1 ring-emerald-400/50"
                      : isPassed
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/[0.03] text-zinc-600 border border-white/[0.04]"
                  }`}
                >
                  {isPassed ? (
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2]" />
                  )}
                </div>

                <span className="text-[6.5px] sm:text-[7px] tracking-tight font-medium hidden sm:block truncate max-w-[17px]">
                  {stage.shortLabel}
                </span>
              </button>

              {/* Connecting Line */}
              {idx < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-colors ${
                    idx < currentIndex ? "bg-emerald-500/50" : "bg-white/[0.06]"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
