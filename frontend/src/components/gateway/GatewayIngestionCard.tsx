"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Zap,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Layers,
  Cpu,
  TrendingUp,
  Globe2,
  Building,
  CheckCircle2,
  Lock,
  Binary,
  Split,
  Bug,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  GatewayIngestResponse,
} from "@/types/payment";
import { ingestGatewayTransmission } from "@/lib/api";
import { toast } from "sonner";

interface GatewayIngestionCardProps {
  pacs008: Pacs008MessageResponse;
  originSpoke: string;
  onProceedToVerification: (gatewayData: GatewayIngestResponse) => void;
  onBack: () => void;
}

export const GatewayIngestionCard: React.FC<GatewayIngestionCardProps> = ({
  pacs008,
  originSpoke,
  onProceedToVerification,
  onBack,
}) => {
  const [isIngesting, setIsIngesting] = useState<boolean>(true);
  const [ingestData, setIngestData] = useState<GatewayIngestResponse | null>(null);
  const [activeStreamTab, setActiveStreamTab] = useState<"financial" | "routing" | "crypto">("financial");
  const [isTestingDuplicate, setIsTestingDuplicate] = useState<boolean>(false);
  const [idempotencyKey] = useState<string>(() => `idem-key-${pacs008.uetr.slice(0, 8)}-${Date.now()}`);

  useEffect(() => {
    let isMounted = true;

    const runGatewayIngestion = async () => {
      setIsIngesting(true);
      try {
        const res = await ingestGatewayTransmission(
          {
            pacs008_message: pacs008,
            transmission_channel: "NEXUS_HTTPS_TLS13",
            client_timestamp: new Date().toISOString(),
          },
          idempotencyKey,
          originSpoke
        );

        if (!isMounted) return;
        setIngestData(res);
        setIsIngesting(false);

        toast.success("API Gateway Ingested & Isolated!", {
          description: `Latency: ${res.ingestion_latency_ms}ms • Status 202 Accepted`,
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsIngesting(false);
        const msg = err instanceof Error ? err.message : "Gateway ingestion failed";
        toast.error(msg);
      }
    };

    runGatewayIngestion();
    return () => {
      isMounted = false;
    };
  }, [idempotencyKey, originSpoke, pacs008]);

  // Interactive Idempotency Duplicate Replay Test
  const handleTestIdempotencyDuplicate = async () => {
    if (!ingestData) return;
    setIsTestingDuplicate(true);
    try {
      toast.loading("Simulating Duplicate Network Transmission...", { id: "idem" });
      const replayRes = await ingestGatewayTransmission(
        {
          pacs008_message: pacs008,
          transmission_channel: "NEXUS_HTTPS_TLS13",
        },
        idempotencyKey,
        originSpoke
      );

      toast.dismiss("idem");
      if (replayRes.is_idempotent_replay) {
        toast.info("Idempotent Packet Deduplicated!", {
          description: "Gateway recognized cached signature & prevented double processing.",
        });
      }
    } catch {
      toast.dismiss("idem");
      toast.error("Duplicate test error");
    } finally {
      setIsTestingDuplicate(false);
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
            Gateway Ingestion & Isolation
          </span>
        </div>
      </div>

      {isIngesting ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Ingesting at Central Nexus Gateway</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Disaggregating Financial, Routing & ZK Streams</p>
          </div>
        </div>
      ) : ingestData ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Status & Latency Badge */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Transmission Ingested ({ingestData.ingestion_latency_ms}ms)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                  {ingestData.ingestion_id}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500 text-black flex-shrink-0">
              202 Accepted
            </span>
          </div>

          {/* 3-Stream Concurrency Disaggregation Tab Switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveStreamTab("financial")}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                activeStreamTab === "financial"
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Financial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStreamTab("routing")}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                activeStreamTab === "routing"
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Routing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStreamTab("crypto")}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                activeStreamTab === "crypto"
                  ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Crypto ZK</span>
            </button>
          </div>

          {/* Stream 1: Financial Instruction Queue */}
          {activeStreamTab === "financial" && (
            <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Split className="w-3.5 h-3.5" />
                  Financial Queue ({ingestData.pipeline_isolation.financial_queue})
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Instructed Debit:</span>
                  <span className="font-mono font-bold text-white">
                    {ingestData.financial_payload.instructed_amount.toFixed(2)} {ingestData.financial_payload.instructed_currency}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Settlement Credit:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {ingestData.financial_payload.settlement_amount.toFixed(2)} {ingestData.financial_payload.settlement_currency}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Locked Rate:</span>
                  <span className="font-mono text-zinc-300">
                    1 {ingestData.financial_payload.settlement_currency} = {ingestData.financial_payload.exchange_rate.toFixed(6)} {ingestData.financial_payload.instructed_currency}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[11px]">
                  <span className="text-zinc-400 flex-shrink-0">UETR:</span>
                  <span className="font-mono text-zinc-300 truncate text-right">
                    {ingestData.financial_payload.uetr}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stream 2: Routing Instruction Queue */}
          {activeStreamTab === "routing" && (
            <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Globe2 className="w-3.5 h-3.5" />
                  Routing Channel ({ingestData.routing_payload.clearing_channel})
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Origin Spoke:</span>
                  <span className="font-mono font-bold text-white">
                    {ingestData.routing_payload.origin_spoke} ({ingestData.routing_payload.origin_bic})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Destination Spoke:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {ingestData.routing_payload.destination_spoke} ({ingestData.routing_payload.destination_bic})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Settlement Protocol:</span>
                  <span className="font-mono text-zinc-300">
                    {ingestData.routing_payload.settlement_method} (Central Bank Clearing)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stream 3: Cryptographic ZK Queue */}
          {activeStreamTab === "crypto" && (
            <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                  Isolated Pool ({ingestData.pipeline_isolation.crypto_queue})
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 flex-shrink-0">Nullifier:</span>
                  <span className="font-mono text-emerald-400 truncate text-right">
                    {ingestData.crypto_payload.nullifier_hash}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 flex-shrink-0">Merkle Root:</span>
                  <span className="font-mono text-zinc-300 truncate text-right">
                    {ingestData.crypto_payload.merkle_root.slice(0, 16)}...
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 flex-shrink-0">Compliance Node:</span>
                  <span className="font-mono text-zinc-300 truncate text-right">
                    {ingestData.crypto_payload.recipient_regulator_id}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Idempotency Duplicate Replay Test Button */}
          <button
            type="button"
            onClick={handleTestIdempotencyDuplicate}
            disabled={isTestingDuplicate}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-emerald-300 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTestingDuplicate ? "animate-spin" : ""}`} />
            <span>Test Idempotency: Re-transmit Duplicate Packet</span>
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Gateway Validated! Ready for Message Routing & ZKP Verification");
              onProceedToVerification(ingestData);
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Proceed to Routing & ZKP Verification</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
