"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BellRing,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Zap,
  Check,
  Globe2,
  Landmark,
  Radio,
  Coins,
  Receipt,
  Sparkles,
  UserCheck,
  Building2,
} from "lucide-react";
import {
  Pacs008MessageResponse,
  ComplianceArchivalResponse,
  RecipientPushNotificationResponse,
} from "@/types/payment";
import { dispatchRecipientPush } from "@/lib/api";
import { toast } from "sonner";

interface RecipientPushToastModalProps {
  pacs008: Pacs008MessageResponse;
  archivalResult?: ComplianceArchivalResponse;
  onProceedToSenderReceipt?: (pushRes: RecipientPushNotificationResponse) => void;
  onDone: () => void;
  onBack?: () => void;
}

export const RecipientPushToastModal: React.FC<RecipientPushToastModalProps> = ({
  pacs008,
  archivalResult,
  onProceedToSenderReceipt,
  onDone,
  onBack,
}) => {
  const [isPushing, setIsPushing] = useState<boolean>(true);
  const [pushResult, setPushResult] = useState<RecipientPushNotificationResponse | null>(null);

  const runPushNotification = useCallback(async () => {
    setIsPushing(true);
    try {
      const res = await dispatchRecipientPush({
        uetr: pacs008.uetr,
        recipient_proxy: "+6591234567",
        recipient_name: "Tan Wei Ling",
        recipient_currency: pacs008.settlement_currency || "SGD",
        amount_credited: pacs008.settlement_amount || 45.0,
        amount_credited_cents: Math.round((pacs008.settlement_amount || 45.0) * 100),
        origin_currency: pacs008.instructed_currency || "INR",
        origin_amount: pacs008.instructed_amount || 2835.0,
        sender_masked_name: "Rahul Sharma",
        sender_proxy: "+919876543210",
        host_ips_reference: `PAYNOW/RHIPAY/20260816/${pacs008.uetr.slice(0, 8).toUpperCase()}`,
        settlement_status: "ACCP_SETTLED_FUNDS_AVAILABLE",
      });

      setPushResult(res);
      setIsPushing(false);

      toast.success("Push Notification Delivered to Recipient!", {
        description: `Instant cleared funds available • ID: ${res.notification_id}`,
      });
    } catch (err: unknown) {
      setIsPushing(false);
      const msg = err instanceof Error ? err.message : "Push notification failed";
      toast.error(msg);
    }
  }, [pacs008.instructed_amount, pacs008.instructed_currency, pacs008.settlement_amount, pacs008.settlement_currency, pacs008.uetr]);

  useEffect(() => {
    runPushNotification();
  }, [runPushNotification]);

  return (
    <div className="w-full max-w-md mx-auto bg-[#09090b] border border-white/[0.08] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08]">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Real-Time WebSocket Stream</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-emerald-400 font-mono">
            Push Telemetry
          </span>
        </div>
      </div>

      {isPushing ? (
        <div className="my-8 sm:my-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Broadcasting Real-Time Push Notification</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Instant Cleared Funds Alert on Recipient Interface</p>
          </div>
        </div>
      ) : pushResult ? (
        <div className="space-y-3.5 sm:space-y-4 my-2 sm:my-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Hero Credited Funds Confirmation Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/90 border border-emerald-500/40 text-center relative overflow-hidden">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-2 text-black font-bold text-lg shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/40">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-1.5">
              <Sparkles className="w-3 h-3" /> Cleared & Available Instantly
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              +{pushResult.credited_amount_formatted}
            </h2>

            <p className="text-xs text-zinc-400 font-mono mt-1 truncate">
              Credited to Tan Wei Ling ({pushResult.recipient_proxy})
            </p>

            <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
              <span>Updated Balance:</span>
              <span className="text-white font-bold">SGD 5,045.00</span>
            </div>
          </div>

          {/* Inbound Payment Telemetry Grid */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-white/[0.08] space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Settlement Telemetry</span>
              <span className="text-emerald-400 font-mono font-bold">ISO 20022 ACCP</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sender:</span>
                <span className="text-white font-medium">Rahul Sharma (India UPI)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Debited Amount:</span>
                <span className="text-zinc-300">INR 2,835.00 @ 63.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Host IPS Rail:</span>
                <span className="text-emerald-400 font-bold">PayNow Real-Time Settlement</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Host Reference:</span>
                <span className="text-zinc-300 truncate max-w-[190px]">{pushResult.host_ips_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Push Notification ID:</span>
                <span className="text-white font-bold">{pushResult.notification_id}</span>
              </div>
            </div>
          </div>

          {/* WebSocket Channel Telemetry */}
          <div className="p-3 rounded-2xl bg-black/60 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] text-zinc-300 truncate">
                ws://nexus.hub/ws/+6591234567
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold flex-shrink-0">
              {pushResult.push_latency_ms}ms
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              toast.success("Push Confirmed! Generating Sender Wallet Digital Settlement Receipt.");
              if (onProceedToSenderReceipt && pushResult) {
                onProceedToSenderReceipt(pushResult);
              } else {
                onDone();
              }
            }}
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">View Sender Digital Settlement Receipt</span>
            <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform stroke-[2.5] flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
