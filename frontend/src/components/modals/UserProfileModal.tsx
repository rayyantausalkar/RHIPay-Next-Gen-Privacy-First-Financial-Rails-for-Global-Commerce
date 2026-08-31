"use client";

import React, { useState } from "react";
import {
  User,
  X,
  ShieldCheck,
  Building2,
  Globe,
  Mail,
  Phone,
  KeyRound,
  Copy,
  Check,
  Fingerprint,
  CreditCard,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { UpiPinModal } from "./UpiPinModal";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  SG: "🇸🇬",
  IN: "🇮🇳",
  AE: "🇦🇪",
  US: "🇺🇸",
  GB: "🇬🇧",
  EU: "🇪🇺",
  JP: "🇯🇵",
  TH: "🇹🇭",
  MY: "🇲🇾",
  AU: "🇦🇺",
  CA: "🇨🇦",
  BR: "🇧🇷",
};

const COUNTRY_NAMES: Record<string, string> = {
  SG: "Singapore",
  IN: "India",
  AE: "United Arab Emirates",
  US: "United States",
  GB: "United Kingdom",
  EU: "Eurozone",
  JP: "Japan",
  TH: "Thailand",
  MY: "Malaysia",
  AU: "Australia",
  CA: "Canada",
  BR: "Brazil",
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-[#08131d] border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-emerald-950/40 text-white flex flex-col max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Profile Info */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight truncate">{user.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>KYC Verified</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate">{user.email}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3.5">
            {/* Selected Home Country (Unchangeable) */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-lg">
                  {COUNTRY_FLAGS[user.home_country] || "🌐"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-zinc-400 font-medium">Home Country</p>
                    <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-md font-mono">Unchangeable</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {COUNTRY_NAMES[user.home_country] || user.home_country} ({user.home_country})
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-500/20">
                {user.preferred_currency}
              </span>
            </div>

            {/* Selected Member Bank (Unchangeable) */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-zinc-400 font-medium">Clearing Member Bank</p>
                    <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-md font-mono">Unchangeable</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100 truncate">{user.bank_name}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-white/10 flex-shrink-0">
                {user.bic || user.ifsc_or_bic || "SWIFT"}
              </span>
            </div>

            {/* Allocated Unique Bank Account Number */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-emerald-400/80 font-medium">Allocated Bank Account Number</p>
                  <p className="text-sm font-bold font-mono tracking-wider text-emerald-200">{user.account_number}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(user.account_number, "Account Number")}
                className="p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-500/20 transition-colors"
                title="Copy Account Number"
              >
                {copiedField === "Account Number" ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Unique User ID & Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-emerald-400" />
                  <span>Unique User ID</span>
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-mono font-semibold text-zinc-200 truncate max-w-[120px]">{user.id}</p>
                  <button
                    onClick={() => handleCopy(user.id, "User ID")}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {copiedField === "User ID" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Contact Number</span>
                </p>
                <p className="text-xs font-mono font-semibold text-zinc-200 mt-1 truncate">{user.contact_number}</p>
              </div>
            </div>

            {/* Set / Change UPI PIN Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
              >
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>Set / Change UPI PIN</span>
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] text-center text-[10px] text-zinc-500">
            Account verified under RHI Pay Nexus Correspondent Clearing Protocol V2.0
          </div>
        </div>
      </div>

      {/* Change UPI PIN Modal */}
      <UpiPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode="change"
        onSuccess={() => {
          setIsPinModalOpen(false);
          toast.success("New UPI PIN has been successfully set!");
        }}
      />
    </>
  );
};
