"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Globe,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
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
  const [envelopeSide, setEnvelopeSide] = useState<"right" | "left">(
    initialMode === "login" ? "right" : "left"
  );
  const [animPhase, setAnimPhase] = useState<"idle" | "exiting" | "swinging" | "entering">("idle");
  const [swingAnimClass, setSwingAnimClass] = useState<string>("");
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

  // Supported countries list
  const countryList = [
    { code: "SG", name: "Singapore", flag: "🇸🇬", dial: "+65", currency: "SGD", defaultBank: "DBS Bank Singapore" },
    { code: "IN", name: "India", flag: "🇮🇳", dial: "+91", currency: "INR", defaultBank: "HDFC Bank Ltd" },
    { code: "AE", name: "UAE", flag: "🇦🇪", dial: "+971", currency: "AED", defaultBank: "First Abu Dhabi Bank (FAB)" },
    { code: "US", name: "United States", flag: "🇺🇸", dial: "+1", currency: "USD", defaultBank: "JPMorgan Chase Bank" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44", currency: "GBP", defaultBank: "Barclays Bank UK" },
    { code: "EU", name: "Eurozone", flag: "🇪🇺", dial: "+49", currency: "EUR", defaultBank: "Deutsche Bank AG" },
    { code: "JP", name: "Japan", flag: "🇯🇵", dial: "+81", currency: "JPY", defaultBank: "MUFG Bank Tokyo" },
    { code: "TH", name: "Thailand", flag: "🇹🇭", dial: "+66", currency: "THB", defaultBank: "Bangkok Bank" },
    { code: "MY", name: "Malaysia", flag: "🇲🇾", dial: "+60", currency: "MYR", defaultBank: "Maybank (Malayan Banking Bhd)" },
    { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", currency: "AUD", defaultBank: "Commonwealth Bank of Australia" },
    { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", currency: "CAD", defaultBank: "Royal Bank of Canada (RBC)" },
    { code: "BR", name: "Brazil", flag: "🇧🇷", dial: "+55", currency: "BRL", defaultBank: "Itaú Unibanco" },
  ];

  const handleCountryChange = (cCode: string) => {
    setHomeCountry(cCode);
    const found = countryList.find((c) => c.code === cCode);
    if (found) {
      setDialCode(found.dial);
      setPreferredCurrency(found.currency);
      setBankName(found.defaultBank);
    }
  };

  const currentBanks = bankDirectory[homeCountry] || [
    { name: "Central Clearing Member Bank", bic: `${homeCountry}BANKXX`, country_code: homeCountry },
  ];

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const triggerCelebration = (userName: string) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#34D399", "#22D3EE", "#FFFFFF"],
      });
    } catch {
      // safe fallback
    }
    toast.success(`Welcome to RHI Pay, ${userName}!`);
  };

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
      triggerCelebration(loginEmail.split("@")[0]);
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
      triggerCelebration(name.split(" ")[0]);
      setTimeout(() => {
        router.push(onSuccessRedirect);
      }, 350);
    } else {
      setErrorMessage(result.error || "Registration failed. Please try again.");
    }
  };

  // 3-Phase Animation Orchestrator (Luxurious Slow Sliced Slide-Out and Slide-In)
  const toggleMode = (targetMode: "login" | "signup") => {
    if (animPhase !== "idle" || mode === targetMode) return;

    setErrorMessage(null);

    // Phase 1: Inputs smoothly and slowly slide out in alternate directions (750ms)
    setAnimPhase("exiting");

    setTimeout(() => {
      // Phase 2: Green envelope luxuriously slides out and slides in to the alternate side (1400ms)
      setAnimPhase("swinging");
      setEnvelopeSide(targetMode === "signup" ? "left" : "right");
      setSwingAnimClass(targetMode === "signup" ? "anim-green-slide-left" : "anim-green-slide-right");

      setTimeout(() => {
        // Phase 3: Switch form mode and smoothly slide in new inputs from alternate directions (850ms)
        setMode(targetMode);
        setAnimPhase("entering");

        setTimeout(() => {
          setAnimPhase("idle");
          setSwingAnimClass("");
        }, 850);
      }, 1400);
    }, 750);
  };

  // Helper for alternate directional slide animations
  const getInputClass = (index: number) => {
    if (animPhase === "exiting") {
      return index % 2 === 0 ? "anim-slide-out-left" : "anim-slide-out-right";
    }
    if (animPhase === "entering") {
      return index % 2 === 0 ? "anim-slide-in-left" : "anim-slide-in-right";
    }
    return "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Neon Slanted Envelope Card Container */}
      <div className="neon-slant-card relative min-h-[520px] md:h-[540px] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        {/* Dynamic Slanted Envelope Rotating Layer (Desktop, 38% width) */}
        <div
          className={`slanted-envelope-bg hidden md:block ${
            envelopeSide === "right" ? "slant-right-mode" : "slant-left-mode"
          } ${swingAnimClass}`}
        >
          {/* Slanted Envelope Decorative Content */}
          <div
            className={`w-full h-full flex flex-col justify-center items-center px-6 text-center transition-all duration-700 ${
              animPhase === "swinging" ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <div className="space-y-3 max-w-[220px]">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto shadow-xl">
                <ShieldCheck className="w-7 h-7 text-emerald-300 stroke-[2.5]" />
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md">
                {envelopeSide === "right" ? (
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

              <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                {envelopeSide === "right"
                  ? "Access instant cross-border financial rails with zero-knowledge privacy."
                  : "Create your next-generation account for instant global settlement."}
              </p>

              <div className="pt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                  RHI Pay Rails
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            INTERACTIVE FORM AREA (Spacious 62% Width on Desktop)
            ============================================================ */}
        <div
          className={`relative z-20 w-full md:w-[62%] p-6 sm:p-9 flex flex-col justify-center transition-all duration-700 ease-in-out ${
            mode === "login" ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"
          }`}
        >
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ==========================================================
              1. LOGIN VIEW
              ========================================================== */}
          {mode === "login" ? (
            <div className="space-y-6">
              {/* Form Title (Index 0: Left) */}
              <div className={getInputClass(0)}>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Login
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your credentials to access RHI Pay
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Input (Index 1: Right) */}
                <div className={`space-y-1 ${getInputClass(1)}`}>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pr-10 py-2.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-1 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input (Index 2: Left) */}
                <div className={`space-y-1 ${getInputClass(2)}`}>
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
                      placeholder="••••••••"
                      className="w-full pr-10 py-2.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-3 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me (Index 3: Right) */}
                <div className={`pt-1 flex items-center justify-between ${getInputClass(3)}`}>
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/[0.05] border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Submit Button (Index 4: Left) */}
                <button
                  type="submit"
                  disabled={loading || animPhase !== "idle"}
                  className={`btn-pressable w-full py-3 rounded-full font-bold text-sm text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#22D3EE] hover:brightness-110 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 ${getInputClass(4)}`}
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

                {/* Toggle to Signup Link (Index 5: Right) */}
                <div className={`text-center pt-2 ${getInputClass(5)}`}>
                  <p className="text-xs text-zinc-400">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => toggleMode("signup")}
                      className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors ml-1"
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
            <div className="space-y-3.5">
              {/* Form Title (Index 0: Left) */}
              <div className={getInputClass(0)}>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Sign Up
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create your RHI Pay account
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                {/* Full Name (Index 1: Right) */}
                <div className={`space-y-0.5 ${getInputClass(1)}`}>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pr-8 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Contact Number with Dial Code (Index 2: Left) */}
                <div className={`space-y-0.5 ${getInputClass(2)}`}>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Contact Number
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 py-1.5 border-b border-white/20">
                      {dialCode}
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="9876543210"
                        className="w-full pr-8 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors font-mono"
                      />
                      <Phone className="w-3.5 h-3.5 text-zinc-400 absolute right-1 top-2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Country & Bank Selection Row (Index 3: Right) */}
                <div className={`grid grid-cols-2 gap-3 ${getInputClass(3)}`}>
                  <div className="space-y-0.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Country
                    </label>
                    <select
                      value={homeCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full py-1.5 bg-transparent border-b border-white/20 text-xs sm:text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                    >
                      {countryList.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#040D14] text-white">
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-0.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Select Bank
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

                {/* Email (Index 4: Left) */}
                <div className={`space-y-0.5 ${getInputClass(4)}`}>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pr-8 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none transition-colors"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute right-1 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Fields (Index 5: Right) */}
                <div className={`grid grid-cols-2 gap-3 ${getInputClass(5)}`}>
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
                        placeholder="••••••"
                        className="w-full pr-7 py-1.5 bg-transparent border-b border-white/20 text-sm text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-2 text-zinc-400 hover:text-white"
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
                        placeholder="••••••"
                        className={`w-full pr-7 py-1.5 bg-transparent border-b text-sm text-white placeholder-zinc-500 focus:outline-none font-mono ${
                          confirmPassword.length > 0
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
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button (Index 6: Left) */}
                <button
                  type="submit"
                  disabled={loading || animPhase !== "idle"}
                  className={`btn-pressable w-full py-2.5 rounded-full font-bold text-sm text-black bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#22D3EE] hover:brightness-110 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 ${getInputClass(6)}`}
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

                {/* Toggle to Login Link (Index 7: Right) */}
                <div className={`text-center pt-1 ${getInputClass(7)}`}>
                  <p className="text-xs text-zinc-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => toggleMode("login")}
                      className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors ml-1"
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
