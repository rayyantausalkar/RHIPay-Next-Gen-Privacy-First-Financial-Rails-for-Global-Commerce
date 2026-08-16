"use client";

import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ConsumerReceiveCard } from "@/components/receiver/ConsumerReceiveCard";
import { ConsumerQRPresenter } from "@/components/receiver/ConsumerQRPresenter";
import { RecentRequestsList } from "@/components/receiver/RecentRequestsList";
import { SenderPayCard } from "@/components/sender/SenderPayCard";
import { AdminComplianceDashboard } from "@/components/admin/AdminComplianceDashboard";
import { DynamicPaymentRequestResponse } from "@/types/payment";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"receive" | "send" | "nexus">("receive");
  const [activeRequest, setActiveRequest] = useState<DynamicPaymentRequestResponse | null>(null);
  const [refreshListCount, setRefreshListCount] = useState<number>(0);

  const handleRequestGenerated = (req: DynamicPaymentRequestResponse) => {
    setActiveRequest(req);
    setRefreshListCount((prev) => prev + 1);
  };

  const handleResetRequest = () => {
    setActiveRequest(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100 relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation Bar */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Tab 1: Receive Money / Request Dynamic QR */}
        {activeTab === "receive" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {activeRequest ? (
              <div className="space-y-6">
                <ConsumerQRPresenter
                  request={activeRequest}
                  onReset={handleResetRequest}
                />
                <RecentRequestsList
                  onSelectRequest={(req) => setActiveRequest(req)}
                  refreshTrigger={refreshListCount}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <ConsumerReceiveCard
                  onRequestGenerated={handleRequestGenerated}
                />
                <div className="max-w-md mx-auto">
                  <RecentRequestsList
                    onSelectRequest={(req) => setActiveRequest(req)}
                    refreshTrigger={refreshListCount}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Send Money / Proxy Resolution & Name Inquiry */}
        {activeTab === "send" && (
          <div className="animate-in fade-in duration-200">
            <SenderPayCard />
          </div>
        )}

        {/* Tab 3: Nexus Telemetry & Compliance Hub */}
        {activeTab === "nexus" && (
          <div className="animate-in fade-in duration-200">
            <AdminComplianceDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-4 text-center text-xs text-zinc-500 bg-black">
        RHIPay Nexus V2.0 — Instant Cross-Border P2P Settlement & Zero-Knowledge Proofs
      </footer>
    </div>
  );
}
