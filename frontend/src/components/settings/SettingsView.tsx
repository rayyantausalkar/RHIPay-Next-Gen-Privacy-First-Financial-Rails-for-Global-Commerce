"use client";

import React, { useState } from "react";
import {
  Settings,
  Bell,
  KeyRound,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  Smartphone,
  BookOpen,
  Lock,
  MessageSquare,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { UpiPinModal } from "../modals/UpiPinModal";

interface SettingsViewProps {
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [activeGuideModal, setActiveGuideModal] = useState<string | null>(null);

  const handleTogglePush = () => {
    setPushEnabled(!pushEnabled);
    toast.success(`Push notifications ${!pushEnabled ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-[#061420]/80 border border-white/[0.08] hover:border-emerald-500/20 p-4 sm:p-5 rounded-3xl backdrop-blur-xl shadow-xl shadow-black/30 transition-colors">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Account Settings & Security</span>
        </h2>
        <p className="text-xs text-zinc-400">Manage security preferences, notifications, and clearing parameters</p>
      </div>

      {/* Settings Options Group */}
      <div className="bg-[#061420]/80 border border-white/[0.08] hover:border-emerald-500/20 rounded-3xl p-2 sm:p-3 backdrop-blur-xl divide-y divide-white/[0.05] shadow-xl shadow-black/30 transition-colors">
        {/* 1. Notifications Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Push Notifications</p>
              <p className="text-xs text-zinc-400">Real-time alerts for travel approvals & payments</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTogglePush}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              pushEnabled ? "bg-emerald-500" : "bg-zinc-800"
            }`}
          >
            <div
              className={`w-4.5 h-4.5 rounded-full bg-black shadow-md transform transition-transform duration-200 ease-in-out ${
                pushEnabled ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 2. Change / Set UPI PIN */}
        <div
          onClick={() => setIsPinModalOpen(true)}
          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] rounded-2xl transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                Change UPI PIN
              </p>
              <p className="text-xs text-zinc-400">Update your 4-digit payment authorization PIN</p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        {/* 3. Privacy & Zero-Knowledge Architecture Guide */}
        <div
          onClick={() => setActiveGuideModal("privacy")}
          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] rounded-2xl transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                Zero-Knowledge Privacy Guide
              </p>
              <p className="text-xs text-zinc-400">Learn how your PII and nullifiers are protected</p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        {/* 4. Help & 24/7 Support Desk */}
        <div
          onClick={() => setActiveGuideModal("support")}
          className="p-3.5 flex items-center justify-between hover:bg-white/[0.02] rounded-2xl transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                Help & Correspondent Support
              </p>
              <p className="text-xs text-zinc-400">Contact clearing authorities and dispute resolution</p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* 5. Logout Section (Red Button at Very Last) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-4 rounded-3xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 active:scale-98 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of RHI Pay</span>
        </button>
      </div>

      {/* Change UPI PIN Modal */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode="change"
        onSuccess={() => {
          setIsPinModalOpen(false);
          toast.success("UPI PIN updated successfully!");
        }}
      />

      {/* Guide & Support Modals */}
      {activeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#08131d] border border-white/[0.08] rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-base font-bold text-white">
              {activeGuideModal === "privacy" ? "Zero-Knowledge Proofs Architecture" : "24/7 Correspondent Support"}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {activeGuideModal === "privacy"
                ? "RHI Pay executes Groth16 zk-SNARK circuits over BN254 to prove account solvency and member bank authorization without ever revealing balances or plaintext names to intermediary network nodes."
                : "Need assistance with your travel exchange or cross-border payment? Contact RHI Pay correspondent bank help desk at support@rhipay.io or toll-free at +1-800-RHI-PAY."}
            </p>
            <button
              onClick={() => setActiveGuideModal(null)}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
