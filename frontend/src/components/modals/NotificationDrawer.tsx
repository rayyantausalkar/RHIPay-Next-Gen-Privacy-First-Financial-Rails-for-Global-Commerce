"use client";

import React from "react";
import {
  Bell,
  X,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNotifications, NotificationItem } from "@/context/NotificationContext";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToJourney?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToJourney,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "JOURNEY_APPROVAL":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "JOURNEY_REJECTION":
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case "PAYMENT_RECEIVED":
        return <ArrowDownLeft className="w-5 h-5 text-emerald-400" />;
      case "PAYMENT_SENT":
        return <ArrowUpRight className="w-5 h-5 text-cyan-400" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#08131d] border-l border-white/[0.08] shadow-2xl p-5 text-white flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-black rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">Authority alerts & transaction updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-white/[0.04] transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 mb-3">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">No notifications yet</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[220px]">
                Travel approvals, payment confirmations, and authority alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notification_id}
                onClick={() => !n.is_read && markAsRead(n.notification_id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  !n.is_read
                    ? "bg-emerald-950/20 border-emerald-500/30 shadow-sm shadow-emerald-950/30"
                    : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          !n.is_read ? "text-emerald-300" : "text-zinc-200"
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>

                    {/* Rejection Reason Notice & Re-plan CTA */}
                    {n.type === "JOURNEY_REJECTION" && onNavigateToJourney && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onNavigateToJourney();
                        }}
                        className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 transition-colors"
                      >
                        <span>Re-plan Travel Journey</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.06] text-center text-[10px] text-zinc-500 flex-shrink-0">
          RHI Pay Nexus Real-time Push Delivery Engine
        </div>
      </div>
    </div>
  );
};
