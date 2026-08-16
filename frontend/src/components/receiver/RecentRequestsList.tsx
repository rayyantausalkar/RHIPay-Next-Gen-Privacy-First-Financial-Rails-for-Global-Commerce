"use client";

import React, { useEffect, useState } from "react";
import { DynamicPaymentRequestResponse } from "@/types/payment";
import { listRecentRequests } from "@/lib/api";
import { Clock, ArrowRight } from "lucide-react";

interface RecentRequestsListProps {
  onSelectRequest: (request: DynamicPaymentRequestResponse) => void;
  refreshTrigger: number;
}

export const RecentRequestsList: React.FC<RecentRequestsListProps> = ({
  onSelectRequest,
  refreshTrigger,
}) => {
  const [requests, setRequests] = useState<DynamicPaymentRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const data = await listRecentRequests(4);
        setRequests(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [refreshTrigger]);

  if (loading || requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#09090b] rounded-3xl border border-white/[0.08] p-5 backdrop-blur-xl">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
        Recent Payment Requests
      </h3>

      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.reference_id}
            onClick={() => onSelectRequest(req)}
            className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900/90 border border-white/[0.04] hover:border-emerald-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono text-xs font-bold text-emerald-400 group-hover:border-emerald-500/50">
                {req.destination_currency}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white group-hover:text-emerald-300">
                    {req.recipient_name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 font-mono border border-white/[0.06]">
                    {req.destination_country}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                  {req.recipient_proxy_value}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-bold text-white font-mono">
                  {Number(req.requested_amount).toFixed(req.currency_decimals ?? 2)} {req.destination_currency}
                </div>
                <div className="text-[10px] text-zinc-500 capitalize font-medium">
                  {req.status.toLowerCase()}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
