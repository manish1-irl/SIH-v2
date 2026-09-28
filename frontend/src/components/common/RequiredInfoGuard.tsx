"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Coins,
  MapPin,
  Sparkles,
  MessageSquare,
  User,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase";
import { getTranslation } from "@/lib/translations";

interface RequiredInfoGuardProps {
  featureName: string;
  featureDescription: string;
  businessIdea?: string;
  capital?: number;
  locality?: string;
  stateName?: string;
  onBackToHome: () => void;
  onSubmitInfo: (idea: string, capital: number, locality?: string, state?: string) => void;
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
  language?: string;
}

export default function RequiredInfoGuard({
  featureName,
  featureDescription,
  businessIdea = "",
  capital = 0,
  locality = "",
  stateName = "India",
  onBackToHome,
  onSubmitInfo,
  currentUser,
  onOpenProfile,
  language = "hi",
}: RequiredInfoGuardProps) {
  const [inputIdea, setInputIdea] = useState(businessIdea);
  const [inputCapital, setInputCapital] = useState(capital > 0 ? String(capital) : "");
  const [inputLocality, setInputLocality] = useState(locality);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = (key: string) => getTranslation(language, key);

  const hasIdea = Boolean(businessIdea && businessIdea.trim().length > 0);
  const hasCapital = Boolean(capital && Number(capital) > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdea = inputIdea.trim();
    const numCap = Number(inputCapital.replace(/,/g, "").trim());

    if (!cleanIdea) {
      setErrorMsg(language === "en" ? "Please enter your business idea." : "कृपया अपना व्यवसाय विचार दर्ज करें।");
      return;
    }
    if (!numCap || isNaN(numCap) || numCap <= 0) {
      setErrorMsg(language === "en" ? "Please enter a valid margin money amount." : "कृपया मान्य मार्जिन राशि दर्ज करें।");
      return;
    }

    setErrorMsg(null);
    onSubmitInfo(cleanIdea, numCap, inputLocality.trim() || undefined, stateName);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-between font-sans select-none text-antigravity-charcoal pb-8">
      {/* Top Header Navigation (Consistent 7xl Width) */}
      <header className="border-b border-white/60 bg-white/85 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-antigravity-navy/5 hover:bg-antigravity-navy/10 text-antigravity-navy transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Return to Sahaay Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("home")}</span>
            </button>
            <div className="h-4 w-[1px] bg-antigravity-navy/20" />
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white shadow-xs p-1 flex items-center justify-center">
                <Image
                  src="/sahaay-logo.png"
                  alt="Sahaay Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-serif font-bold text-sm text-antigravity-navy tracking-tight block leading-tight">
                  {featureName}
                </span>
                <span className="text-[10px] text-antigravity-charcoal/60 block leading-tight">
                  {t("required")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser && onOpenProfile && (
              <button
                onClick={onOpenProfile}
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-white/80 text-xs font-semibold text-antigravity-navy shadow-xs transition-all cursor-pointer"
                title={t("profile")}
              >
                <div className="w-5 h-5 rounded-full bg-antigravity-navy text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.full_name}</span>
              </button>
            )}

            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-antigravity-navy hover:bg-[#D96B27] text-white text-xs font-semibold transition-all shadow-subtle cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("returnToAssistant")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center justify-center z-20">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-9 border border-white/90 shadow-[0_20px_50px_rgba(10,37,64,0.12)] text-center animate-in fade-in duration-300">
          
          {/* Warning / Required Notice Badge */}
          <div className="w-14 h-14 rounded-2xl bg-amber-100/90 border border-amber-300 flex items-center justify-center text-amber-800 mx-auto mb-4 shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>

          {/* EXACT User-Requested Title */}
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-antigravity-navy tracking-tight mb-2">
            {t("pleaseInputRequiredInfo")}
          </h2>

          <p className="font-sans text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto mb-6 leading-relaxed">
            {t("guardDescription")}
          </p>

          {/* Current Parameter Status Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
            {/* Status: Business Idea */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              hasIdea
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : "bg-amber-50/70 border-amber-300 text-amber-950"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {t("businessIdea")}
                </span>
                {hasIdea ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("provided")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5" /> {t("required")}
                  </span>
                )}
              </div>
              <p className="font-sans text-xs font-semibold truncate">
                {hasIdea ? businessIdea : t("notProvidedYet")}
              </p>
            </div>

            {/* Status: Margin Money */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              hasCapital
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                : "bg-amber-50/70 border-amber-300 text-amber-950"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {t("marginMoney")}
                </span>
                {hasCapital ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t("provided")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5" /> {t("required")}
                  </span>
                )}
              </div>
              <p className="font-sans text-xs font-semibold truncate">
                {hasCapital ? `₹${Number(capital).toLocaleString("en-IN")}` : t("notProvidedYet")}
              </p>
            </div>
          </div>

          {/* Inline Parameter Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left border-t border-neutral-200/80 pt-5">
            <h3 className="font-serif text-sm font-bold text-antigravity-navy">
              {t("enterDirectlyTitle")}
            </h3>

            {errorMsg && (
              <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Business Idea Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 pl-0.5">
                  {t("businessIdea")} *
                </label>
                <div className="relative flex items-center rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 focus-within:bg-white focus-within:border-antigravity-navy focus-within:ring-2 focus-within:ring-antigravity-navy/15 transition-all">
                  <Lightbulb className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={inputIdea}
                    onChange={(e) => setInputIdea(e.target.value)}
                    placeholder="e.g. Mini Dairy, Mustard Expeller, Poultry"
                    className="w-full bg-transparent border-none outline-none text-xs text-neutral-900 placeholder-neutral-400 font-medium"
                  />
                </div>
              </div>

              {/* Margin Money Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 pl-0.5">
                  {t("marginMoney")} (₹) *
                </label>
                <div className="relative flex items-center rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 focus-within:bg-white focus-within:border-antigravity-navy focus-within:ring-2 focus-within:ring-antigravity-navy/15 transition-all">
                  <Coins className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={inputCapital}
                    onChange={(e) => setInputCapital(e.target.value)}
                    placeholder="e.g. 100000 or 1.5 Lakh"
                    className="w-full bg-transparent border-none outline-none text-xs text-neutral-900 placeholder-neutral-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Optional Locality */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 pl-0.5">
                {t("locality")}
              </label>
              <div className="relative flex items-center rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 focus-within:bg-white focus-within:border-antigravity-navy focus-within:ring-2 focus-within:ring-antigravity-navy/15 transition-all">
                <MapPin className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={inputLocality}
                  onChange={(e) => setInputLocality(e.target.value)}
                  placeholder="e.g. Bassi, Jaipur, Alwar"
                  className="w-full bg-transparent border-none outline-none text-xs text-neutral-900 placeholder-neutral-400 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0A2540] hover:bg-[#D96B27] text-white font-sans text-xs font-bold transition-all shadow-subtle flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t("applyAndGenerate")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Alternative: Return to Assistant */}
          <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500 font-medium text-[11px]">
              {t("preferVoiceOrChat")}
            </span>
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-1.5 rounded-lg text-antigravity-navy hover:text-[#D96B27] hover:bg-neutral-100 font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("returnToAssistant")}</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
