"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Globe,
  Building2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, SignupFormData } from "@/context/AuthContext";

interface AuthCardProps {
  initialMode?: "login" | "signup";
  onSuccessRedirect?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialMode = "login",
  onSuccessRedirect = "/app",
}) => {
  const router = useRouter();
  const { login, signup, bankDirectory } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form fields
  const [name, setName] = useState("");
  const [dialCode, setDialCode] = useState("+65");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [homeCountry, setHomeCountry] = useState("SG");
  const [bankName, setBankName] = useState("DBS Bank Singapore");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("SGD");

  // Supported countries list with flags, dial codes, native currency, and realistic phone number placeholders
  const countryList = [
    { code: "SG", name: "Singapore", flag: "🇸🇬", dial: "+65", currency: "SGD", defaultBank: "DBS Bank Singapore", phonePlaceholder: "9123 4567" },
    { code: "IN", name: "India", flag: "🇮🇳", dial: "+91", currency: "INR", defaultBank: "HDFC Bank Ltd", phonePlaceholder: "98765 43210" },
    { code: "AE", name: "UAE", flag: "🇦🇪", dial: "+971", currency: "AED", defaultBank: "First Abu Dhabi Bank (FAB)", phonePlaceholder: "50 123 4567" },
    { code: "US", name: "United States", flag: "🇺🇸", dial: "+1", currency: "USD", defaultBank: "JPMorgan Chase Bank", phonePlaceholder: "415 555 0198" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44", currency: "GBP", defaultBank: "Barclays Bank UK", phonePlaceholder: "7911 123456" },
    { code: "EU", name: "Eurozone", flag: "🇪🇺", dial: "+49", currency: "EUR", defaultBank: "Deutsche Bank AG", phonePlaceholder: "151 23456789" },
    { code: "JP", name: "Japan", flag: "🇯🇵", dial: "+81", currency: "JPY", defaultBank: "MUFG Bank Tokyo", phonePlaceholder: "90 1234 5678" },
    { code: "TH", name: "Thailand", flag: "🇹🇭", dial: "+66", currency: "THB", defaultBank: "Bangkok Bank", phonePlaceholder: "81 234 5678" },
    { code: "MY", name: "Malaysia", flag: "🇲🇾", dial: "+60", currency: "MYR", defaultBank: "Maybank (Malayan Banking Bhd)", phonePlaceholder: "12 345 6789" },
    { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", currency: "AUD", defaultBank: "Commonwealth Bank of Australia", phonePlaceholder: "412 345 678" },
    { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", currency: "CAD", defaultBank: "Royal Bank of Canada (RBC)", phonePlaceholder: "416 555 0192" },
    { code: "BR", name: "Brazil", flag: "🇧🇷", dial: "+55", currency: "BRL", defaultBank: "Itaú Unibanco", phonePlaceholder: "11 98765 4321" },
    { code: "CH", name: "Switzerland", flag: "🇨🇭", dial: "+41", currency: "CHF", defaultBank: "UBS Group AG", phonePlaceholder: "78 123 45 67" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰", dial: "+852", currency: "HKD", defaultBank: "HSBC Hong Kong", phonePlaceholder: "9123 4567" },
    { code: "PH", name: "Philippines", flag: "🇵🇭", dial: "+63", currency: "PHP", defaultBank: "BDO Unibank", phonePlaceholder: "917 123 4567" },
    { code: "ID", name: "Indonesia", flag: "🇮🇩", dial: "+62", currency: "IDR", defaultBank: "Bank Mandiri", phonePlaceholder: "812 3456 7890" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳", dial: "+84", currency: "VND", defaultBank: "Vietcombank", phonePlaceholder: "91 234 5678" },
    { code: "KR", name: "South Korea", flag: "🇰🇷", dial: "+82", currency: "KRW", defaultBank: "KB Kookmin Bank", phonePlaceholder: "10 1234 5678" },
    { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dial: "+966", currency: "SAR", defaultBank: "Al Rajhi Bank", phonePlaceholder: "50 123 4567" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "+27", currency: "ZAR", defaultBank: "Standard Bank South Africa", phonePlaceholder: "82 123 4567" },
  ];

  // Country handler - locked country code updates automatically
  const handleCountryChange = (cCode: string) => {
    setHomeCountry(cCode);
    const found = countryList.find((c) => c.code === cCode);
    if (found) {
      setDialCode(found.dial);
      setPreferredCurrency(found.currency);
      setBankName(found.defaultBank);
    }
  };

  const selectedCountryObj = countryList.find((c) => c.code === homeCountry) || countryList[0];

  const currentBanks = bankDirectory[homeCountry] || [
    { name: selectedCountryObj.defaultBank || "Central Clearing Member Bank", bic: `${homeCountry}BANKXX`, country_code: homeCountry },
  ];

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail || !loginPassword) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);

    if (result.success) {
      toast.success("Authenticated successfully", {
        description: "Redirecting to your account dashboard...",
      });
      setTimeout(() => {
        router.push(onSuccessRedirect);
      }, 350);
    } else {
      setErrorMessage(result.error || "Invalid email or password.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage("Please enter your contact number.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const fullContact = `${dialCode}${phoneNumber.replace(/^0+/, "")}`;

    const formData: SignupFormData = {
      name: name.trim(),
      contact_number: fullContact,
      home_country: homeCountry,
      bank_name: bankName,
      email: email.trim().toLowerCase(),
      password,
      confirm_password: confirmPassword,
      account_type: "INDIVIDUAL",
      preferred_currency: preferredCurrency,
      proxy_type: "MOBILE",
      proxy_value: fullContact,
    };

    setLoading(true);
    const result = await signup(formData);
    setLoading(false);

    if (result.success) {
      toast.success("Account registered successfully", {
        description: "Clearing profile initialized. Redirecting to RHI Pay...",
      });
      setTimeout(() => {
        router.push(onSuccessRedirect);
      }, 350);
    } else {
      setErrorMessage(result.error || "Registration failed. Please try again.");
    }
  };

  const toggleMode = (targetMode: "login" | "signup") => {
    if (mode === targetMode) return;
    setErrorMessage(null);
    setMode(targetMode);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Neon Slanted Envelope Card Container */}
      <div className="neon-slant-card relative min-h-[540px] md:h-[560px] flex flex-col md:flex-row overflow-hidden shadow-2xl">

        {/* Dynamic Slanted Decorative Showcase Layer (Desktop, 38% width) */}
        <div
          className={`slanted-envelope-bg hidden md:block ${mode === "login" ? "slant-right-mode" : "slant-left-mode"
            }`}
        >
          {/* Slanted Envelope Decorative Content */}
          <div className="w-full h-full flex flex-col justify-center items-center px-6 text-center transition-all duration-300">
            <div className="space-y-3.5 max-w-[220px]">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto shadow-xl">
                <ShieldCheck className="w-7 h-7 text-emerald-300 stroke-[2.5]" />
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md">
                {mode === "login" ? (
                  <>
                    Welcome <br />
                    <span className="text-emerald-300">Back!</span>
                  </>
                ) : (
                  <>
                    Join <br />
                    <span className="text-emerald-300">RHI Pay!</span>
                  </>
                )}
              </h2>
            </div>
          </div>
        </div>

        {/* ============================================================
            INTERACTIVE FORM PANEL (62% Width on Desktop)
            ============================================================ */}
        <div
          className={`auth-form-panel p-6 sm:p-9 flex flex-col justify-center ${mode === "login" ? "pos-login" : "pos-signup"
            }`}
        >
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ==========================================================
              1. LOGIN VIEW
              ========================================================== */}
          {mode === "login" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Form Title */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Login
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your credentials to access RHI Pay
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="huzaifa.ansari@globalpay.com"
                      className="w-full pr-10 py-2.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-1 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Password
                    </label>
                    <span className="text-[11px] text-emerald-400 hover:underline cursor-pointer">
                      Forgot?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pr-10 py-2.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-3 text-zinc-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="pt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/[0.05] border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-pressable w-full py-3 rounded-full font-bold text-sm text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#22D3EE] hover:brightness-110 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Toggle to Signup Link */}
                <div className="text-center pt-2">
                  <p className="text-xs text-zinc-400">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => toggleMode("signup")}
                      className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors ml-1 cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            </div>
          ) : (
            /* ==========================================================
               2. SIGNUP VIEW
               ========================================================== */
            <div className="space-y-3.5 animate-in fade-in duration-300">
              {/* Form Title */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Sign Up
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create your RHI Pay account
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                {/* Full Name */}
                <div className="space-y-0.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rayyan Tausalkar"
                      className="w-full pr-8 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Country & Bank Selection Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Country</span>
                    </label>
                    <select
                      value={homeCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full py-1.5 bg-transparent border-b border-white/20 text-xs sm:text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                    >
                      {countryList.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#040D14] text-white">
                          {c.flag} {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-emerald-400" />
                      <span>Member Bank</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full py-1.5 bg-transparent border-b border-white/20 text-xs sm:text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer truncate"
                    >
                      {currentBanks.map((b, i) => (
                        <option key={i} value={b.name} className="bg-[#040D14] text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact Number with Locked Dial Code Prefix */}
                <div className="space-y-0.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Contact Number
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Locked Dial Code Badge */}
                    <div className="flex items-center gap-1.5 py-1.5 px-2 bg-white/[0.04] border-b border-white/20 select-none rounded-t-sm">
                      <span className="text-sm leading-none">{selectedCountryObj.flag}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{dialCode}</span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder={selectedCountryObj.phonePlaceholder}
                        className="w-full pr-8 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                      />
                      <Phone className="w-3.5 h-3.5 text-zinc-400 absolute right-1 top-2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-0.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rayyan.tausalkar@globalpay.com"
                      className="w-full pr-8 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pr-7 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-2 text-zinc-400 hover:text-white"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Re-type</span>
                      {passwordsMatch && <Check className="w-3 h-3 text-emerald-400" />}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className={`w-full pr-7 py-1.5 bg-transparent border-b text-sm text-white placeholder-zinc-500 focus:outline-none font-mono ${confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-emerald-400"
                            : "border-rose-400"
                          : "border-white/20 focus:border-emerald-400"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-1 top-2 text-zinc-400 hover:text-white"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-pressable w-full py-2.5 rounded-full font-bold text-sm text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#22D3EE] hover:brightness-110 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Toggle to Login Link */}
                <div className="text-center pt-1">
                  <p className="text-xs text-zinc-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => toggleMode("login")}
                      className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors ml-1 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
