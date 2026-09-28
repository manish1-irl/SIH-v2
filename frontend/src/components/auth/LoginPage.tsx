"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Globe,
  CheckCircle2,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { setupRecaptcha, sendOtp } from "@/lib/firebase";
import { syncUserProfile, UserProfile } from "@/lib/supabase";
import { SUPPORTED_LANGUAGES, getTranslation, LanguageOption } from "@/lib/translations";

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, languageCode?: string) => void;
  currentLanguage?: string;
  onLanguageChange?: (langCode: string) => void;
}

export default function LoginPage({ onLoginSuccess, currentLanguage = "hi", onLanguageChange }: LoginPageProps) {
  // Form state
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    if (currentLanguage) {
      const match = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
      if (match) setSelectedLanguage(match);
    }
  }, [currentLanguage]);

  const handleSelectLanguage = (lang: LanguageOption) => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("sahaay_language", lang.code);
    }
    if (onLanguageChange) {
      onLanguageChange(lang.code);
    }
  };

  const t = (key: string) => getTranslation(selectedLanguage.code, key);

  // OTP State Machine: 'input' -> 'otp' -> 'success'
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);

  // Firebase confirmation object ref
  const confirmationResultRef = useRef<any>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: any;
    if (step === "otp" && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Handle Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (!fullName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your full name." });
      return;
    }
    if (cleanMobile.length !== 10) {
      setStatusMessage({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setIsLoading(true);

    try {
      // Invisible recaptcha verification
      const recaptchaVerifier = setupRecaptcha("recaptcha-container");
      const fullPhone = `+91${cleanMobile}`;
      const result = await sendOtp(fullPhone, recaptchaVerifier);
      confirmationResultRef.current = result;

      setStep("otp");
      setTimerSeconds(30);
      setCanResend(false);
      setStatusMessage({
        type: "info",
        text: `6-digit verification code sent to +91 ${cleanMobile}.`,
      });

      // Auto-focus the first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error("OTP send error:", err);
      setStatusMessage({
        type: "error",
        text: "Could not send verification SMS. Please check your mobile number and network connection, then try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP individual digit typing
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto move to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);
    const nextEmptyIndex = updated.findIndex((d) => !d);
    if (nextEmptyIndex !== -1) {
      otpInputRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpInputRefs.current[5]?.focus();
    }
  };

  // Verify OTP and sync with Supabase
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join("");
    if (enteredCode.length !== 6) {
      setStatusMessage({ type: "error", text: "Please enter the complete 6-digit OTP." });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      // 1. Firebase Phone Auth Verification
      let isVerified = false;
      const cleanMobile = mobileNumber.replace(/\D/g, "");
      const fullPhone = `+91${cleanMobile}`;

      if (!confirmationResultRef.current || typeof confirmationResultRef.current.confirm !== "function") {
        throw new Error("Verification session not found or expired. Please request a new OTP.");
      }
      await confirmationResultRef.current.confirm(enteredCode);
      isVerified = true;

      if (isVerified) {
        setStatusMessage({ type: "success", text: "Verification successful! Signing in..." });

        // 2. Supabase Sync: Upsert user login credentials and profile
        const userProfile: UserProfile = {
          phone: fullPhone,
          full_name: fullName.trim(),
          preferred_language: selectedLanguage.code,
          role: "entrepreneur",
          created_at: new Date().toISOString(),
        };

        await syncUserProfile(userProfile);

        // Transition to platform
        setTimeout(() => {
          onLoginSuccess(userProfile, selectedLanguage.code);
        }, 600);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Invalid OTP code. Please use demo code 123456.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans select-none">
      {/* Invisible Recaptcha Container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Top Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-end z-20">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/80 text-xs font-semibold text-antigravity-navy shadow-xs transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>{selectedLanguage.native}</span>
            <ChevronDown className="w-3 h-3 text-antigravity-navy/50" />
          </button>

          {isLangDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsLangDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-antigravity-navy/15 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      selectedLanguage.code === lang.code
                        ? "bg-antigravity-navy/10 text-antigravity-navy font-bold"
                        : "text-antigravity-charcoal hover:bg-antigravity-cream"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-neutral-400">({lang.name})</span>
                    </span>
                    {selectedLanguage.code === lang.code && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-antigravity-orange" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Hero & Luminous Frosted Glassmorphism Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10 z-10">
        <div className="w-full max-w-[450px] rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(10,37,64,0.14)] p-7 sm:p-8 text-center transition-all duration-300">
          
          {/* Sahaay Emblem Header inside Card */}
          <div className="flex flex-col items-center mb-3.5 sm:mb-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-2 p-1 rounded-2xl bg-white shadow-xs border border-emerald-100 flex items-center justify-center">
              <Image
                src="/sahaay-logo.png"
                alt="Sahaay Emblem"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="font-serif text-2xl font-bold text-antigravity-navy tracking-tight">
              {t("welcome")}
            </h1>
            <p className="font-sans text-xs text-neutral-600 mt-0.5 font-medium">
              {t("tagline")}
            </p>
            <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#D96B27] uppercase mt-1.5">
              {t("fastOtpAccess")}
            </span>
          </div>

          {/* Feedback & Status Alert Banner */}
          {statusMessage && (
            <div
              className={`mb-3 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 text-left animate-in fade-in duration-200 ${
                statusMessage.type === "error"
                  ? "bg-red-500/15 border border-red-500/30 text-red-900 font-medium"
                  : statusMessage.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 font-medium"
                  : "bg-[#1B4332]/10 border border-[#1B4332]/25 text-[#1B4332] font-medium"
              }`}
            >
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* STEP 1: Full Name & Mobile Number Form */}
          {step === "input" && (
            <form onSubmit={handleRequestOtp} className="space-y-3 sm:space-y-3.5 text-left">
              {/* Full Name Input */}
              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-800 mb-1 pl-0.5">
                  {t("fullName")}
                </label>
                <div className="relative flex items-center rounded-2xl bg-white/90 border border-neutral-200/90 px-3.5 py-2.5 shadow-xs focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/15 transition-all">
                  <User className="w-4 h-4 text-neutral-500 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                    className="w-full bg-transparent border-none outline-none font-sans text-sm text-neutral-900 placeholder-neutral-400 font-medium"
                  />
                </div>
              </div>

              {/* Mobile Number Input with +91 Pill */}
              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-800 mb-1 pl-0.5">
                  {t("mobileNumber")}
                </label>
                <div className="flex items-center rounded-2xl bg-white/90 border border-neutral-200/90 p-1 shadow-xs focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/15 transition-all">
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 text-xs font-bold text-neutral-800 shrink-0 border border-black/5">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    className="w-full bg-transparent border-none outline-none px-3 py-1 font-sans text-sm tracking-wider text-neutral-900 placeholder-neutral-400 font-semibold"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 pl-1">
                  {t("otpNotice")}
                </p>
              </div>

              {/* Primary Get OTP Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 font-sans text-sm font-semibold text-white bg-[#0A2540] hover:bg-[#D96B27] active:scale-[0.99] py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("sendingOtp")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("getOtpBtn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Verification Form */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5 sm:space-y-4 text-left animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-1 border-b border-black/5">
                <div>
                  <span className="font-sans text-xs text-neutral-500 block">OTP:</span>
                  <span className="font-sans text-sm font-bold text-neutral-900">+91 {mobileNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setStatusMessage(null);
                  }}
                  className="font-sans text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> {t("changeNumber")}
                </button>
              </div>

              {/* 6 Discrete Single-Digit OTP Inputs */}
              <div>
                <label className="block font-sans text-xs font-semibold text-neutral-800 mb-2 text-center">
                  {t("enterOtpTitle")}
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-11 sm:h-12 text-center font-serif text-xl font-bold text-emerald-900 rounded-2xl bg-white/95 border border-neutral-200/90 focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/20 outline-none shadow-xs transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Resend Countdown */}
              <div className="flex items-center justify-between text-xs px-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={(e) => handleRequestOtp(e)}
                    className="font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> {t("resendBtn")}
                  </button>
                ) : (
                  <span className="text-neutral-500">
                    {t("resendIn")}: <strong className="text-neutral-800">00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</strong>
                  </span>
                )}
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  Demo Code: 123456
                </span>
              </div>

              {/* Primary Verify Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 font-sans text-sm font-semibold text-white bg-[#0A2540] hover:bg-[#D96B27] active:scale-[0.99] py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("verifying")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("verifyOtpBtn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Security Guarantee */}
          <div className="mt-4 pt-3 border-t border-[#3C2F20]/10 flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <span className="font-sans text-[11px] font-medium text-[#4D4032]">
              {t("secureVerificationNotice")}
            </span>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full py-2.5 sm:py-3 text-center z-10">
        <p className="font-sans text-xs text-neutral-600 font-medium">
          {t("msmeAdvisoryFooter")}
        </p>
      </footer>
    </div>
  );
}
