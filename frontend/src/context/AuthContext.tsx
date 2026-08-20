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
  account_type: string;
  preferred_currency: string;
  proxy_type: string;
  proxy_value: string;
  kyc_status: string;
  created_at: string;
}

export interface BankItem {
  name: string;
  bic: string;
  country_code: string;
  popular?: boolean;
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
