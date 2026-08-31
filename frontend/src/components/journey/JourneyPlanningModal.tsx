"use client";

import React, { useState, useEffect } from "react";
import {
  Plane,
  X,
  Globe,
  ArrowRightLeft,
  Calendar,
  FileUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileCheck,
  Sparkles,
  RefreshCcw,
  Building2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

interface JourneyPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJourneyUpdated?: () => void;
}

interface DestinationCountry {
  code: string;
  name: string;
  flag: string;
  currency: string;
  rateToUSD: number;
}

const DESTINATION_COUNTRIES: DestinationCountry[] = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", rateToUSD: 1.0 },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", rateToUSD: 1.345 },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", rateToUSD: 3.6725 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", rateToUSD: 0.785 },
  { code: "EU", name: "Eurozone", flag: "🇪🇺", currency: "EUR", rateToUSD: 0.925 },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", rateToUSD: 153.2 },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", rateToUSD: 34.5 },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", currency: "MYR", rateToUSD: 4.45 },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", rateToUSD: 1.54 },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", rateToUSD: 1.39 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", rateToUSD: 5.75 },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const JourneyPlanningModal: React.FC<JourneyPlanningModalProps> = ({
  isOpen,
  onClose,
  onJourneyUpdated,
}) => {
  const { user, refreshUser, cancelJourney } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [destCountry, setDestCountry] = useState<string>("US");
  const [purpose, setPurpose] = useState<string>("Tourism & Vacation");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [homeAmount, setHomeAmount] = useState<string>("50000");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [existingJourney, setExistingJourney] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState<boolean>(true);

  const selectedDest = DESTINATION_COUNTRIES.find((c) => c.code === destCountry) || DESTINATION_COUNTRIES[0];
  const homeCurrency = user?.preferred_currency || "INR";

  // Fetch active journey status
  const fetchJourney = async () => {
    if (!user) return;
    setLoadingExisting(true);
    try {
      const res = await fetch(`${API_BASE}/journey/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setExistingJourney(data);
      } else {
        setExistingJourney(null);
      }
    } catch {
      setExistingJourney(null);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJourney();
      setShowCancelConfirm(false);
    }
  }, [user, isOpen]);

  // FX conversion rates lookup
  const getExchangeRate = () => {
    const rates: Record<string, number> = {
      USD: 1.0,
      SGD: 1.345,
      INR: 86.85,
      AED: 3.6725,
      GBP: 0.785,
      EUR: 0.925,
      JPY: 153.2,
      THB: 34.5,
      MYR: 4.45,
      AUD: 1.54,
      CAD: 1.39,
      BRL: 5.75,
    };

    const homeRate = rates[homeCurrency] || 86.85;
    const destRate = rates[selectedDest.currency] || 1.0;
    return destRate / homeRate;
  };

  const calculatedDestAmount = () => {
    const num = parseFloat(homeAmount) || 0;
    const rate = getExchangeRate();
    return (num * rate).toFixed(2);
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success(`Passport "${file.name}" uploaded successfully`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!startDate || !endDate) {
      toast.error("Please select travel start and end dates.");
      return;
    }

    const numAmount = parseFloat(homeAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid initial required amount.");
      return;
    }

    if (!passportFile && !passportPreview) {
      toast.error("Please upload your passport document.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        destination_country: destCountry,
        purpose_of_travel: purpose,
        start_date: startDate,
        end_date: endDate,
        home_amount_requested: numAmount,
        passport_data_url: passportPreview || "data:image/png;base64,demo_passport_scan",
        passport_filename: passportFile?.name || "passport_document.pdf",
      };

      const res = await fetch(`${API_BASE}/journey/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to submit journey request");
        setIsSubmitting(false);
        return;
      }

      toast.success("Journey Request Submitted!", {
        description: "Your request is under review by RHI Pay Correspondent Bank authorities.",
      });

      setExistingJourney(data);
      await refreshUser();
      await fetchNotifications();
      onJourneyUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Requirement: Cancel Journey Option with 2.5% penalty deduction and refund to bank
  const handleConfirmCancelJourney = async () => {
    if (!user) return;
    setIsCancelling(true);
    try {
      const res = await cancelJourney(user.id, "Trip Cancelled by User");
      if (res.success && res.data) {
        toast.success("Travel Journey Cancelled", {
          description: res.data.message,
        });
        await refreshUser();
        await fetchNotifications();
        onJourneyUpdated?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to cancel journey");
      }
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  const isApprovedJourney = existingJourney?.status === "APPROVED" || Boolean(user?.active_journey_country);
  const isPendingJourney = existingJourney?.status === "PENDING";
  const activeDestCountry = user?.active_journey_country || existingJourney?.destination_country;
  const activeDestCountryObj = DESTINATION_COUNTRIES.find((c) => c.code === activeDestCountry);

  // Penalty Calculation Breakdown for active travel wallet balance
  const travelBalance = user?.travel_wallet_balance || 0;
  const exchangeRateUsed = existingJourney?.exchange_rate || 0.0115;
  const grossRefundHome = travelBalance > 0
    ? exchangeRateUsed > 0
      ? travelBalance / exchangeRateUsed
      : travelBalance * 86.85
    : 0;
  const penaltyFee = grossRefundHome * 0.025;
  const netRefund = Math.max(0, grossRefundHome - penaltyFee);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#08131d] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
            <Plane className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Travel Journey Management</h3>
            <p className="text-xs text-zinc-400">Cross-Border Forex Wallet & Clearance Rail</p>
          </div>
        </div>

        {/* VIEW 1: ACTIVE / APPROVED JOURNEY (With Cancel Journey Option) */}
        {isApprovedJourney && activeDestCountry ? (
          <div className="space-y-4 py-2">
            {/* Active Destination Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#09221b] to-[#041310] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span>{activeDestCountryObj?.flag || "✈️"}</span>
                  <span>Active Travel Destination</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 font-mono">
                  CLEARANCE ACTIVE
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-xl font-bold text-white">
                    {activeDestCountryObj?.name || activeDestCountry} ({user?.active_journey_currency || existingJourney?.destination_currency})
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Dates: {existingJourney?.start_date || "Current"} to {existingJourney?.end_date || "Active"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Travel Balance</span>
                  <span className="text-lg font-mono font-black text-cyan-300">
                    {user?.active_journey_currency || "USD"} {Number(user?.travel_wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* If user clicked Cancel Journey: Show Penalty Breakdown */}
            {showCancelConfirm ? (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <h4 className="text-sm font-bold text-white">Confirm Journey Cancellation & Bank Refund</h4>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Cancelling this journey will convert your remaining travel balance back to your home currency (
                  {homeCurrency}) and credit it directly to your primary bank account ({user?.bank_name}).
                </p>

                {/* Breakdown Table */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/[0.08] space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Remaining Travel Wallet:</span>
                    <span className="text-white">
                      {user?.active_journey_currency} {travelBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Gross Home Currency Value:</span>
                    <span className="text-white">
                      {homeCurrency} {grossRefundHome.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Reconversion Penalty Fee (2.5%):</span>
                    <span>- {homeCurrency} {penaltyFee.toFixed(2)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/10 flex justify-between font-bold text-sm">
                    <span className="text-emerald-400">Net Credited to Bank Account:</span>
                    <span className="text-emerald-300">
                      + {homeCurrency} {netRefund.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Back / Keep Journey
                  </button>
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={handleConfirmCancelJourney}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCancelling ? (
                      <span>Processing Refund...</span>
                    ) : (
                      <>
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Confirm & Refund Bank</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Active Journey Actions */
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Cancel Journey & Refund to Bank (with 2.5% penalty)</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : isPendingJourney ? (
          /* VIEW 2: PENDING REVIEW JOURNEY */
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Journey Request Under Correspondent Review</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Your travel request to{" "}
                  <span className="font-semibold text-white">
                    {DESTINATION_COUNTRIES.find((c) => c.code === existingJourney.destination_country)?.flag}{" "}
                    {existingJourney.destination_country}
                  </span>{" "}
                  for{" "}
                  <span className="font-mono font-bold text-amber-300">
                    {existingJourney.destination_currency} {existingJourney.destination_amount_calculated?.toLocaleString()}
                  </span>{" "}
                  ({existingJourney.home_currency} {existingJourney.home_amount_requested?.toLocaleString()}) is currently
                  being reviewed by Correspondent Bank administrators.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Request ID:</span>
                <span className="font-mono font-semibold text-zinc-200">{existingJourney.request_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Travel Dates:</span>
                <span className="font-medium text-zinc-200">
                  {existingJourney.start_date} to {existingJourney.end_date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Purpose:</span>
                <span className="font-medium text-zinc-200">{existingJourney.purpose_of_travel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Passport Document:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <FileCheck className="w-3.5 h-3.5" />
                  {existingJourney.passport_filename || "Verified Scan"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancelJourney}
                disabled={isCancelling}
                className="flex-1 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isCancelling ? "Cancelling..." : "Cancel Request"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 3: FORM TO SUBMIT NEW JOURNEY REQUEST */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Destination Country */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Destination / Tourism Country</span>
              </label>
              <select
                value={destCountry}
                onChange={(e) => setDestCountry(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                {DESTINATION_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Instant Dynamic Live Currency Converter */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Live Currency Converter</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  1 {homeCurrency} ≈ {getExchangeRate().toFixed(4)} {selectedDest.currency}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-950/60 p-2 rounded-xl border border-white/10">
                  <span className="text-[10px] text-zinc-400 block">Amount to Spend ({homeCurrency})</span>
                  <input
                    type="number"
                    value={homeAmount}
                    onChange={(e) => setHomeAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-transparent text-sm font-bold text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 bg-zinc-950/60 p-2 rounded-xl border border-white/10">
                  <span className="text-[10px] text-zinc-400 block">Allocated Travel Wallet ({selectedDest.currency})</span>
                  <p className="text-sm font-bold text-emerald-300 font-mono">{calculatedDestAmount()}</p>
                </div>
              </div>
            </div>

            {/* Step 3: Purpose of Travel */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Purpose of Travel</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="Tourism & Vacation">🏖️ Tourism & Leisure Vacation</option>
                <option value="Business Conference & Meetings">💼 Business Meetings & Global Commerce</option>
                <option value="Higher Education & Academic">🎓 Higher Education & Studies</option>
                <option value="Medical & Healthcare">🏥 Medical Treatment & Healthcare</option>
                <option value="Family Visit & Personal">👨‍👩‍👧 Family Visit & Personal Travel</option>
              </select>
            </div>

            {/* Step 4: Start Date & End Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Step 5: Upload Passport Document */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Passport Document</span>
              </label>

              <label className="border-2 border-dashed border-white/[0.12] hover:border-emerald-500/50 rounded-2xl p-3.5 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-emerald-500/5 transition-all text-center">
                <input type="file" accept="image/*,application/pdf" onChange={handlePassportUpload} className="hidden" />
                {passportFile ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <FileCheck className="w-4 h-4" />
                    <span className="truncate max-w-[220px]">{passportFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5 text-zinc-400" />
                    <span className="text-xs text-zinc-300 font-medium">Click to select passport scan / photo</span>
                    <span className="text-[10px] text-zinc-500">Supports PDF, PNG, JPG (Max 10MB)</span>
                  </div>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <Plane className="w-4 h-4" />
                    <span>Submit Passport & Request Currency</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
