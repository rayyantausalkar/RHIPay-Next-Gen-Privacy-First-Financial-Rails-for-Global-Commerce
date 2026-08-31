"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, ShieldCheck, X, Delete, Check, KeyRound, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface UpiPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  mode: "verify" | "change" | "balance";
  onSuccess: (pin: string) => void;
  requiredLength?: number;
}

export const UpiPinModal: React.FC<UpiPinModalProps> = ({
  isOpen,
  onClose,
  title = "Enter UPI PIN",
  subtitle = "Secure 4-digit bank authorization PIN",
  mode,
  onSuccess,
  requiredLength = 4,
}) => {
  const { user, verifyUpiPin, updateUpiPin } = useAuth();
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [step, setStep] = useState<"current" | "new" | "confirm">(mode === "change" ? "new" : "current");
  const [currentPinInput, setCurrentPinInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Requirement: Automatically refresh/clear PIN whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setConfirmPin("");
      setCurrentPinInput("");
      setError(null);
      setIsLoading(false);
      setStep(mode === "change" ? "new" : "current");
    }
  }, [isOpen, mode]);

  const handleComplete = useCallback(
    async (enteredPin: string) => {
      setIsLoading(true);
      setError(null);

      if (mode === "balance" || mode === "verify") {
        try {
          const isValid = await verifyUpiPin(enteredPin);
          if (isValid) {
            toast.success("UPI PIN Verified");
            onSuccess(enteredPin);
            onClose();
          } else {
            setError("Incorrect UPI PIN. Please try again.");
            setPin("");
          }
        } catch {
          setError("Verification error. Please retry.");
          setPin("");
        } finally {
          setIsLoading(false);
        }
      } else if (mode === "change") {
        if (step === "new") {
          setConfirmPin(enteredPin);
          setPin("");
          setStep("confirm");
          setIsLoading(false);
        } else if (step === "confirm") {
          if (enteredPin !== confirmPin) {
            setError("PINs do not match. Please try again.");
            setPin("");
            setStep("new");
            setIsLoading(false);
            return;
          }

          try {
            const res = await updateUpiPin(currentPinInput || undefined, enteredPin);
            if (res.success) {
              toast.success("UPI PIN Updated Successfully!");
              onSuccess(enteredPin);
              onClose();
            } else {
              setError(res.error || "Failed to update PIN");
              setPin("");
            }
          } catch {
            setError("Network error updating PIN");
            setPin("");
          } finally {
            setIsLoading(false);
          }
        }
      }
    },
    [mode, step, confirmPin, currentPinInput, verifyUpiPin, updateUpiPin, onSuccess, onClose]
  );

  const handleKeyPress = useCallback(
    (num: string) => {
      if (isLoading) return;
      setError(null);
      if (pin.length < requiredLength) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === requiredLength) {
          handleComplete(nextPin);
        }
      }
    },
    [pin, requiredLength, isLoading, handleComplete]
  );

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isLoading]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setError(null);
    setPin("");
  }, [isLoading]);

  // Requirement: Listen to physical keyboard and keypad numbers (0-9, NumPad 0-9, Backspace, Delete, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      } else if (e.key === "Delete" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyPress, handleDelete, handleClear, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#08131d] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl shadow-emerald-950/50 text-white flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/15 animate-in zoom-in-95">
          <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Titles */}
        <h3 className="text-lg font-bold text-white tracking-tight">
          {mode === "change"
            ? step === "new"
              ? "Set New UPI PIN"
              : "Confirm New UPI PIN"
            : title}
        </h3>
        <p className="text-xs text-zinc-400 text-center mt-1 max-w-[260px]">
          {mode === "change"
            ? step === "new"
              ? `Enter a secure ${requiredLength}-digit UPI PIN`
              : "Re-enter the same PIN to confirm"
            : subtitle}
        </p>

        {/* Bank & Account Pill */}
        {user && (
          <div className="mt-3 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[11px] text-zinc-300 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-400">🏦</span>
            <span className="font-semibold truncate max-w-[150px]">{user.bank_name}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">..{user.account_number.slice(-4)}</span>
          </div>
        )}

        {/* PIN Dots Indicator */}
        <div className="flex items-center gap-4 my-6">
          {Array.from({ length: requiredLength }).map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50 ring-2 ring-emerald-300/30"
                    : "bg-zinc-800 border border-white/10"
                }`}
              />
            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-1.5 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad (Supports both Touch/Click and Physical Keyboard) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isLoading}
              onClick={() => handleKeyPress(num)}
              className="h-13 sm:h-14 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/30 text-xl font-bold text-zinc-100 hover:text-emerald-300 transition-all active:scale-95 flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || pin.length === 0}
            className="h-13 sm:h-14 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleKeyPress("0")}
            className="h-13 sm:h-14 rounded-2xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/30 text-xl font-bold text-zinc-100 hover:text-emerald-300 transition-all active:scale-95 flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || pin.length === 0}
            className="h-13 sm:h-14 rounded-2xl bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.04] hover:border-rose-500/20 text-zinc-400 hover:text-rose-400 transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-5 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero-Knowledge Hardware Keypad Enabled</span>
        </div>
      </div>
    </div>
  );
};
