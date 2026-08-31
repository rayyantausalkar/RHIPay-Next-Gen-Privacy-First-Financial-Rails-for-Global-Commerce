"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface NotificationItem {
  id?: number;
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: "JOURNEY_APPROVAL" | "JOURNEY_REJECTION" | "PAYMENT_RECEIVED" | "PAYMENT_SENT" | "ADMIN_ALERT" | "SYSTEM";
  is_read: boolean;
  metadata_json?: string | null;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  broadcastNotification: (title: string, message: string, type?: string, targetUserId?: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/notifications/user/${user.id}?limit=30`);
      if (res.ok) {
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
        const unread = data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);

        // Toast on new notification
        if (data.length > 0) {
          const newest = data[0];
          if (lastNotifId && newest.notification_id !== lastNotifId && !newest.is_read) {
            if (newest.type === "JOURNEY_APPROVAL") {
              toast.success(newest.title, { description: newest.message, duration: 6000 });
            } else if (newest.type === "JOURNEY_REJECTION") {
              toast.error(newest.title, { description: newest.message, duration: 8000 });
            } else {
              toast.info(newest.title, { description: newest.message });
            }
          }
          setLastNotifId(newest.notification_id);
        }
      }
    } catch {
      // safe fallback
    }
  }, [user, lastNotifId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_BASE}/notifications/${notificationId}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Could not mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/notifications/user/${user.id}/read-all`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      console.warn("Could not mark all as read:", err);
    }
  };

  const broadcastNotification = async (
    title: string,
    message: string,
    type: string = "ADMIN_ALERT",
    targetUserId: string = "ALL"
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/notifications/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: targetUserId,
          title,
          message,
          type,
        }),
      });
      if (res.ok) {
        toast.success("Broadcast announcement dispatched successfully!");
        fetchNotifications();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        broadcastNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
