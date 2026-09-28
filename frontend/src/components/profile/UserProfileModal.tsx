"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Globe,
  CheckCircle2,
  Briefcase,
  Coins,
  MapPin,
  X,
  Edit3,
  Check,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase";
import { SUPPORTED_LANGUAGES, getTranslation } from "@/lib/translations";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  language: string;
  onLanguageChange: (langCode: string) => void;
  businessIdea: string;
  capital: number;
  locality?: string;
  stateName?: string;
  onUpdateBusinessParams: (idea: string, capital: number, locality?: string, state?: string) => void;
  onLogout: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  language,
  onLanguageChange,
  businessIdea,
  capital,
  locality = "",
  stateName = "India",
  onUpdateBusinessParams,
  onLogout,
}: UserProfileModalProps) {
  const [isEditingBiz, setIsEditingBiz] = useState(false);
  const [editIdea, setEditIdea] = useState(businessIdea);
  const [editCapital, setEditCapital] = useState(capital > 0 ? String(capital) : "");
  const [editLocality, setEditLocality] = useState(locality);

  useEffect(() => {
    setEditIdea(businessIdea);
    setEditCapital(capital > 0 ? String(capital) : "");
    setEditLocality(locality);
  }, [businessIdea, capital, locality]);

  if (!isOpen) return null;

  const t = (key: string) => getTranslation(language, key);

  const handleSaveBiz = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdea = editIdea.trim();
    const cleanCap = Number(editCapital.replace(/,/g, "").trim()) || 0;
    onUpdateBusinessParams(cleanIdea, cleanCap, editLocality.trim() || undefined, stateName);
    setIsEditingBiz(false);
  };

  const userInitials = (currentUser?.full_name || "Entrepreneur")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/90 shadow-[0_25px_60px_rgba(10,37,64,0.22)] z-10 max-h-[92vh] overflow-y-auto space-y-5 text-left font-sans select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-antigravity-navy text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-antigravity-navy tracking-tight leading-tight">
                {t("profileModalTitle")}
              </h3>
              <span className="text-[10px] text-neutral-500 font-medium">
                {t("verifiedSession")}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title={t("close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Entrepreneur Info Card */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#1B4332] text-white flex items-center justify-center font-serif font-bold text-base shadow-sm shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-serif text-base font-bold text-neutral-900 truncate">
                  {currentUser?.full_name || "Entrepreneur"}
                </h4>
                <span title="Verified">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </span>
              </div>
              <p className="font-sans text-xs text-neutral-500 font-medium flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-neutral-400" />
                <span>{currentUser?.phone || "+91 Mobile Verified"}</span>
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold shrink-0 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Active</span>
          </span>
        </div>

        {/* 2. Language Switcher (Instant Whole-App Translation) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-antigravity-navy flex items-center gap-1.5 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-antigravity-orange" />
              <span>{t("appLanguage")}</span>
            </label>
            <span className="text-[11px] text-neutral-400 font-medium">
              Changes whole website & voice
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border ${
                  language === lang.code
                    ? "bg-[#0A2540] text-white border-[#0A2540] shadow-sm font-bold"
                    : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200"
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">{lang.flag}</span>
                  <span className="truncate">{lang.native}</span>
                </span>
                {language === lang.code && (
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Business Idea & Capital Money Section */}
        <div className="space-y-2 pt-1 border-t border-neutral-200/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-antigravity-navy flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t("businessDetails")}</span>
            </label>
            <button
              type="button"
              onClick={() => setIsEditingBiz(!isEditingBiz)}
              className="text-xs font-semibold text-antigravity-navy hover:text-[#D96B27] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingBiz ? t("cancel") : t("editDetails")}</span>
            </button>
          </div>

          {!isEditingBiz ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Business Idea View */}
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                  {t("businessIdea")}
                </span>
                <p className="text-xs font-bold text-neutral-900 truncate">
                  {businessIdea || t("notProvidedYet")}
                </p>
              </div>

              {/* Capital Money View */}
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                  {t("marginMoney")}
                </span>
                <p className="text-xs font-bold text-emerald-800 truncate">
                  {capital > 0 ? `₹${Number(capital).toLocaleString("en-IN")}` : t("notProvidedYet")}
                </p>
              </div>

              {/* Locality View */}
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 sm:col-span-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">
                  {t("locality")}
                </span>
                <p className="text-xs font-semibold text-neutral-800 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  <span>{locality ? `${locality}, ${stateName}` : t("notProvidedYet")}</span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveBiz} className="space-y-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  {t("businessIdea")}
                </label>
                <input
                  type="text"
                  required
                  value={editIdea}
                  onChange={(e) => setEditIdea(e.target.value)}
                  placeholder="e.g. Mustard Oil Expeller, Mini Dairy, Poultry"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-medium focus:outline-none focus:border-antigravity-navy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  {t("marginMoney")} (₹)
                </label>
                <input
                  type="text"
                  required
                  value={editCapital}
                  onChange={(e) => setEditCapital(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-medium focus:outline-none focus:border-antigravity-navy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  {t("locality")}
                </label>
                <input
                  type="text"
                  value={editLocality}
                  onChange={(e) => setEditLocality(e.target.value)}
                  placeholder="e.g. Bassi, Alwar, Dausa"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-medium focus:outline-none focus:border-antigravity-navy"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingBiz(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-200/70 cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-antigravity-navy hover:bg-[#D96B27] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("saveChanges")}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("logout")}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors cursor-pointer"
          >
            {t("close")}
          </button>
        </div>

      </div>
    </div>
  );
}
