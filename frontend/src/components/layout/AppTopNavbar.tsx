"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  User,
  ShieldAlert,
  Building2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationDrawer } from "../modals/NotificationDrawer";
import { UserProfileModal } from "../modals/UserProfileModal";

interface AppTopNavbarProps {
  activeTab: "home" | "history" | "settings" | "admin" | string;
  onSelectTab: (tab: any) => void;
  onNavigateToJourney?: () => void;
}

export const AppTopNavbar: React.FC<AppTopNavbarProps> = ({
  activeTab,
  onSelectTab,
  onNavigateToJourney,
}) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const isAdmin = user?.role === "ADMIN" || user?.email === "admin.rhipay@gmail.com";

  return (
    <>
      <header className="border-b border-white/[0.08] bg-[#040d14]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-15 sm:h-16 gap-3">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => onSelectTab("home")}
                className="flex items-center gap-2.5 group cursor-pointer text-left"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Image
                    src="/rhi_without_bg.svg"
                    alt="RHI Pay Logo"
                    width={40}
                    height={40}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                      RHI Pay
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/25 tracking-wider font-mono">
                      NEXUS
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:block truncate">
                    Cross-Border P2P & ZKP Settlement
                  </p>
                </div>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Mode Switcher if Admin */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab(activeTab === "admin" ? "home" : "admin")}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === "admin"
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Bank</span>
                </button>
              )}

              {/* Notification Bell Button with Unread Badge */}
              <button
                type="button"
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2 sm:p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile Avatar Button */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/30 text-zinc-200 transition-all flex items-center gap-2 cursor-pointer"
                title="Account Profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-bold text-xs sm:text-sm shadow-sm flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-zinc-100 truncate max-w-[100px]">{user?.name?.split(" ")[0]}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">..{user?.account_number?.slice(-4)}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateToJourney={onNavigateToJourney}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};
