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
  const { user, refreshUser } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [destCountry, setDestCountry] = useState<string>("US");
  const [purpose, setPurpose] = useState<string>("Tourism & Vacation");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [homeAmount, setHomeAmount] = useState<string>("50000");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingJourney, setExistingJourney] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState<boolean>(true);

  const selectedDest = DESTINATION_COUNTRIES.find((c) => c.code === destCountry) || DESTINATION_COUNTRIES[0];
  const homeCurrency = user?.preferred_currency || "INR";

  // Fetch active journey status
  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchJourney = async () => {
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

    fetchJourney();
  }, [user, isOpen]);

  // Approximate FX conversion calculation
  const getExchangeRate = () => {
    // USD base rates lookup
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

    // 1 Home = (destRate / homeRate) Dest
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
        description: "Your request is under review by RHI Pay authorities.",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#08131d] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
            <Plane className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Plan Travel Journey</h3>
            <p className="text-xs text-zinc-400">Request cross-border travel exchange balance</p>
          </div>
        </div>

        {/* If user has a pending request */}
        {existingJourney && existingJourney.status === "PENDING" ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Journey Request Pending Review</h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Your travel request to{" "}
                  <span className="font-semibold text-white">
                    {DESTINATION_COUNTRIES.find((c) => c.code === existingJourney.destination_country)?.flag}{" "}
                    {existingJourney.destination_country}
                  </span>{" "}
                  for{" "}
                  <span className="font-mono font-bold text-amber-300">
                    {existingJourney.destination_currency} {existingJourney.destination_amount_calculated.toLocaleString()}
                  </span>{" "}
                  ({existingJourney.home_currency} {existingJourney.home_amount_requested.toLocaleString()}) has been
                  submitted and is currently being verified by RHI Pay Correspondent Bank authorities.
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

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-bold text-zinc-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          /* Form to Submit New Journey Request */
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
                  <span className="text-[10px] text-zinc-400 block">Home ({homeCurrency})</span>
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
                  <span className="text-[10px] text-zinc-400 block">Destination ({selectedDest.currency})</span>
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
                className="w-full py-2.5 px-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50"
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
