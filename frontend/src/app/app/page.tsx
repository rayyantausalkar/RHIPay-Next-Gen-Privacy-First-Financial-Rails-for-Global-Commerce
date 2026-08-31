"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AppTopNavbar } from "@/components/layout/AppTopNavbar";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { HomeHeaderInfo } from "@/components/home/HomeHeaderInfo";
import { CreativeHeroBanner } from "@/components/home/CreativeHeroBanner";
import { ActionCardsHub } from "@/components/home/ActionCardsHub";
import { FinancialGridBox } from "@/components/home/FinancialGridBox";
import { RecentTransactionsFeed } from "@/components/home/RecentTransactionsFeed";
import { HistoryView } from "@/components/history/HistoryView";
import { SettingsView } from "@/components/settings/SettingsView";
import { CorrespondentBankAdminDashboard } from "@/components/admin/CorrespondentBankAdminDashboard";
import { ModernSendModal } from "@/components/send/ModernSendModal";
import { ModernReceiveModal } from "@/components/receive/ModernReceiveModal";
import { JourneyPlanningModal } from "@/components/journey/JourneyPlanningModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AppPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"home" | "history" | "settings" | "admin">("home");
  const [isSendOpen, setIsSendOpen] = useState<boolean>(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState<boolean>(false);
  const [isJourneyOpen, setIsJourneyOpen] = useState<boolean>(false);
  const [activeJourney, setActiveJourney] = useState<any>(null);

  // Redirect to login if user not logged in
  useEffect(() => {
    const token = localStorage.getItem("rhipay_token");
    if (!token && !user) {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch active user journey status
  const fetchUserJourney = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/journey/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveJourney(data);
      }
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchUserJourney();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.info("Logged out of RHI Pay");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#040D14] text-zinc-100 relative selection:bg-emerald-500/30 selection:text-emerald-200 pb-24 sm:pb-28">
      {/* 1. Top Navbar: RHI Pay Brand, Notification Drawer, Profile Avatar */}
      <AppTopNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNavigateToJourney={() => setIsJourneyOpen(true)}
      />

      {/* 2. Main Responsive Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {/* VIEW 1: HOME SCREEN (Default Post-Login Interface) */}
        {activeTab === "home" && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
            {/* Top Fixed Header: Selected Country, Bank & Select/Start Journey */}
            <HomeHeaderInfo
              activeJourney={activeJourney}
              onOpenJourneyModal={() => setIsJourneyOpen(true)}
            />

            {/* Creative Minimal Decorative Element */}
            <CreativeHeroBanner />

            {/* Side-by-Side Action Cards: Send Money & Receive Money */}
            <ActionCardsHub
              onOpenSend={() => setIsSendOpen(true)}
              onOpenReceive={() => setIsReceiveOpen(true)}
            />

            {/* Financial Grid: Check Balance (with UPI PIN) & Dynamic Forex Rates */}
            <FinancialGridBox />

            {/* Recent Transactions List with "See All" */}
            <RecentTransactionsFeed
              onSeeAll={() => setActiveTab("history")}
            />
          </div>
        )}

        {/* VIEW 2: HISTORY (Complete Payment & Settlement Logs) */}
        {activeTab === "history" && <HistoryView />}

        {/* VIEW 3: SETTINGS (Security, Notifications, Guides, Logout) */}
        {activeTab === "settings" && <SettingsView onLogout={handleLogout} />}

        {/* VIEW 4: ADMIN / CORRESPONDENT BANK CONTROL ROOM */}
        {activeTab === "admin" && <CorrespondentBankAdminDashboard />}
      </main>

      {/* 3. Bottom Sticky Navigation Dock (Home, History, Settings) */}
      <AppBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* 4. Modals */}
      {/* Send Money Modal (QR Scan / 6-Digit Code, FX Quote, UPI PIN, 3-5s Telemetry) */}
      <ModernSendModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onPaymentCompleted={() => {
          setIsSendOpen(false);
          refreshUser();
          fetchUserJourney();
        }}
      />

      {/* Receive Money Modal (2-Minute Single Active Code / QR) */}
      <ModernReceiveModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        onPaymentReceived={() => {
          refreshUser();
          fetchUserJourney();
        }}
      />

      {/* Journey Planning Modal (Passport Upload, Currency Converter, Admin Review Queue) */}
      <JourneyPlanningModal
        isOpen={isJourneyOpen}
        onClose={() => setIsJourneyOpen(false)}
        onJourneyUpdated={() => {
          fetchUserJourney();
          refreshUser();
        }}
      />
    </div>
  );
}
