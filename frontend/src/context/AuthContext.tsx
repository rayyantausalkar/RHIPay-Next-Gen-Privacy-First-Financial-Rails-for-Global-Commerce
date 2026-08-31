"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  contact_number: string;
  home_country: string;
  bank_name: string;
  bic?: string | null;
  account_number: string;
  ifsc_or_bic?: string | null;
  account_type: string;
  preferred_currency: string;
  proxy_type: string;
  proxy_value: string;
  kyc_status: string;
  wallet_balance: number;
  travel_wallet_balance: number;
  active_journey_country?: string | null;
  active_journey_currency?: string | null;
  role: "USER" | "ADMIN";
  is_blocked: boolean;
  has_upi_pin: boolean;
  created_at: string;
}

export interface BankItem {
  name: string;
  bic: string;
  country_code: string;
  popular?: boolean;
}

export interface AdminUserItem {
  user_id: string;
  name: string;
  email: string;
  contact_number: string;
  home_country: string;
  bank_name: string;
  account_number: string;
  wallet_balance: number;
  travel_wallet_balance: number;
  active_journey_country?: string | null;
  kyc_status: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

export interface BalanceData {
  user_id: string;
  home_currency: string;
  wallet_balance: number;
  wallet_balance_formatted: string;
  active_journey_country?: string | null;
  active_journey_currency?: string | null;
  travel_wallet_balance: number;
  travel_wallet_balance_formatted?: string | null;
  verified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (formData: SignupFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  bankDirectory: Record<string, BankItem[]>;
  fetchBanks: () => Promise<void>;
  updateUpiPin: (currentPin: string | undefined, newPin: string) => Promise<{ success: boolean; error?: string }>;
  verifyUpiPin: (pin: string) => Promise<boolean>;
  checkBalance: (pin: string) => Promise<{ success: boolean; data?: BalanceData; error?: string }>;
  refreshUser: () => Promise<void>;
  getAllUsers: () => Promise<AdminUserItem[]>;
  toggleBlockUser: (userId: string) => Promise<{ success: boolean; is_blocked?: boolean; error?: string }>;
}

export interface SignupFormData {
  name: string;
  contact_number: string;
  home_country: string;
  bank_name: string;
  email: string;
  password: string;
  confirm_password: string;
  account_type?: string;
  preferred_currency?: string;
  proxy_type?: string;
  proxy_value?: string;
  upi_pin?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bankDirectory, setBankDirectory] = useState<Record<string, BankItem[]>>({});

  // Hydrate auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("rhipay_token");
      const storedUser = localStorage.getItem("rhipay_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse stored auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/banks`);
      if (res.ok) {
        const data = await res.json();
        if (data.banks) {
          setBankDirectory(data.banks);
        }
      }
    } catch (err) {
      console.warn("Could not fetch banks from backend, using defaults:", err);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/auth/user/${user.id}`);
      if (res.ok) {
        const freshUser = await res.json();
        setUser(freshUser);
        localStorage.setItem("rhipay_user", JSON.stringify(freshUser));
      }
    } catch (err) {
      console.warn("Could not refresh user:", err);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Authentication failed. Please check credentials." };
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("rhipay_token", data.access_token);
      localStorage.setItem("rhipay_user", JSON.stringify(data.user));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Backend server may be offline." };
    }
  };

  const signup = async (formData: SignupFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Registration failed. Please check fields." };
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("rhipay_token", data.access_token);
      localStorage.setItem("rhipay_user", JSON.stringify(data.user));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Backend server may be offline." };
    }
  };

  const updateUpiPin = async (currentPin: string | undefined, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not logged in" };
    try {
      const res = await fetch(`${API_BASE}/auth/change-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, current_pin: currentPin, new_pin: newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Failed to update UPI PIN" };
      }
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update UPI PIN" };
    }
  };

  const verifyUpiPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, pin }),
      });
      const data = await res.json();
      return data.verified === true;
    } catch {
      return false;
    }
  };

  const checkBalance = async (pin: string): Promise<{ success: boolean; data?: BalanceData; error?: string }> => {
    if (!user) return { success: false, error: "Not logged in" };
    try {
      const res = await fetch(`${API_BASE}/auth/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Incorrect UPI PIN." };
      }
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || "Could not check balance." };
    }
  };

  const getAllUsers = async (): Promise<AdminUserItem[]> => {
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch {
      return [];
    }
  };

  const toggleBlockUser = async (userId: string): Promise<{ success: boolean; is_blocked?: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/toggle-block`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Failed to toggle user block status." };
      }
      return { success: true, is_blocked: data.is_blocked };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("rhipay_token");
    localStorage.removeItem("rhipay_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        bankDirectory,
        fetchBanks,
        updateUpiPin,
        verifyUpiPin,
        checkBalance,
        refreshUser,
        getAllUsers,
        toggleBlockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
