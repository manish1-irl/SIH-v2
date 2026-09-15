"use client";

import React, { useState } from "react";
import {
  Plus,
  Mic,
  MicOff,
  Languages,
  ChevronDown,
  Calculator,
  Compass,
  Network,
  FileDown,
  LogOut,
  Sparkles,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase";

interface HomePageViewProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  language: string;
  onLanguageChange: (langCode: string) => void;
  languages: Array<{ code: string; name: string; native: string }>;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSearchSubmit: (query: string) => void;
  onSelectCapability: (capability: "schemes" | "feasibility" | "cluster" | "dpr", promptText: string) => void;
  onNavigate: (view: "home" | "feasibility" | "schemes" | "explore") => void;
}

export default function HomePageView({
  currentUser,
  onLogout,
  language,
  onLanguageChange,
  languages,
  isRecording,
  onStartRecording,
  onStopRecording,
  onSearchSubmit,
  onSelectCapability,
  onNavigate,
}: HomePageViewProps) {
  const [inputText, setInputText] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const selectedLang = languages.find((l) => l.code === language) || languages[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputText.trim()) {
      onSearchSubmit(inputText.trim());
      setInputText("");
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans select-none">
      {/* Cinematic Golden Farmland Background with Morning Mist */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
        }}
      >
        {/* Ambient atmospheric haze overlay for readability & WCAG compliance */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35 backdrop-brightness-[0.98]" />
      </div>

      {/* Top Header Navigation matching mockup */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between z-30">
        {/* Invisible Spacer for balanced alignment on large screens */}
        <div className="w-24 hidden md:block" />

        {/* Center Nav Links */}
        <nav className="flex items-center gap-6 sm:gap-10 mx-auto">
          <button
            onClick={() => onNavigate("home")}
            className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-antigravity-charcoal hover:text-antigravity-orange transition-colors relative py-1 border-b-2 border-antigravity-navy drop-shadow-sm"
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("feasibility")}
            className="font-sans text-xs sm:text-sm font-medium tracking-wide text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors py-1 drop-shadow-sm"
          >
            Feasibility
          </button>
          <button
            onClick={() => onNavigate("schemes")}
            className="font-sans text-xs sm:text-sm font-medium tracking-wide text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors py-1 drop-shadow-sm"
          >
            Scheme Calculator
          </button>
          <button
            onClick={() => onNavigate("explore")}
            className="font-sans text-xs sm:text-sm font-medium tracking-wide text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors py-1 drop-shadow-sm"
          >
            Explore
          </button>
        </nav>

        {/* User Info & Logout (Right) */}
        <div className="flex items-center gap-2.5 z-40">
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-xs font-medium text-antigravity-navy shadow-subtle">
              <div className="w-2 h-2 rounded-full bg-antigravity-sage animate-pulse" />
              <span className="max-w-[120px] truncate">{currentUser.full_name}</span>
            </div>
          )}

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-white/60 hover:bg-white/90 backdrop-blur-md text-red-600 hover:text-red-700 transition-all border border-white/50 shadow-subtle"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Center Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 -mt-10 z-20">
        <div className="w-full max-w-3xl flex flex-col items-center text-center">
          {/* Brand Title in Lora Serif with Antigravity Theme Specification */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-antigravity-navy tracking-tight drop-shadow-sm select-none mb-3">
            Sahaay
          </h1>

          <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/75 max-w-md font-medium mb-8 drop-shadow-sm">
            Hyper-Local AI Business Advisor for Rural & Semi-Urban India
          </p>

          {/* Primary Interaction Pill (Search / Voice / Intake) */}
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-full px-3 py-2.5 sm:px-4 sm:py-3 shadow-elevated border border-antigravity-navy/10 flex items-center gap-2 sm:gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-antigravity-sage/60 focus-within:border-antigravity-sage/40">
            {/* Quick Intake Button (+) */}
            <button
              onClick={() => onSelectCapability("feasibility", "I want to run a complete business feasibility analysis for my enterprise.")}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-antigravity-navy/5 hover:bg-antigravity-orange hover:text-white text-antigravity-navy transition-all flex items-center justify-center shrink-0 shadow-sm"
              title="New Business Assessment"
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening to voice input..." : "Ask Sahaay..."}
              className="flex-1 bg-transparent font-sans text-xs sm:text-sm text-antigravity-charcoal placeholder:text-antigravity-navy/40 focus:outline-none px-1"
            />

            {/* Language Selector Pill (文A ▾) */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-antigravity-cream/70 hover:bg-antigravity-cream transition-all border border-antigravity-navy/10 text-antigravity-navy/80"
                title="Change Language"
              >
                <Languages className="w-3.5 h-3.5 text-antigravity-navy/60" />
                <span className="font-sans text-[11px] font-semibold hidden sm:inline">
                  {selectedLang.native}
                </span>
                <ChevronDown className="w-3 h-3 text-antigravity-navy/50" />
              </button>

              {/* Language Dropdown Menu */}
              {showLangMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-white/95 backdrop-blur-xl border border-antigravity-navy/10 rounded-2xl shadow-elevated py-2 w-48 z-50 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 font-sans text-xs flex items-center justify-between hover:bg-antigravity-cream transition-all ${
                        language === lang.code
                          ? "text-antigravity-orange font-semibold bg-antigravity-orange/5"
                          : "text-antigravity-charcoal/80"
                      }`}
                    >
                      <span className="font-medium">{lang.native}</span>
                      <span className="text-antigravity-navy/40 text-[10px]">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Microphone Button for Voice-First Input */}
            <button
              onClick={handleMicClick}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-md"
                  : "bg-antigravity-navy text-white hover:bg-antigravity-orange"
              }`}
              title={isRecording ? "Stop voice input" : "Speak in any Indian language"}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* 4 Feature Action Pills Matching Mockup with Pure Lucide Icons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-4 w-full max-w-2xl">
            {/* Pill 1: Scheme Calculator */}
            <button
              onClick={() =>
                onSelectCapability(
                  "schemes",
                  "Calculate verified government scheme subsidies and bank loan eligibility (PMEGP, MUDRA, PMFME, PM Vishwakarma) for my business."
                )
              }
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group"
            >
              <Calculator className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Scheme Calculator
              </span>
            </button>

            {/* Pill 2: Feasibility Matrix */}
            <button
              onClick={() =>
                onSelectCapability(
                  "feasibility",
                  "Evaluate hyper-local market feasibility, demand signals, competition density, and capital fit for my business location."
                )
              }
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group"
            >
              <Compass className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Feasibility Matrix
              </span>
            </button>

            {/* Pill 3: Cluster */}
            <button
              onClick={() =>
                onSelectCapability(
                  "cluster",
                  "Identify local economic clusters, nearby Farmer Producer Organizations (FPOs), mandis, cold storages, and supply chain partners."
                )
              }
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group"
            >
              <Network className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Cluster
              </span>
            </button>

            {/* Pill 4: Download DPR */}
            <button
              onClick={() =>
                onSelectCapability(
                  "dpr",
                  "Generate and download a bank-ready Detailed Project Report (DPR) with financial cashflow projections and QR verification code."
                )
              }
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group"
            >
              <FileDown className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Download DPR
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Info Pill */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-center z-20">
        <div className="flex items-center gap-2 text-antigravity-charcoal/70 font-sans text-[11px] font-medium bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/50 shadow-subtle">
          <Sparkles className="w-3 h-3 text-antigravity-sage" />
          <span>Zero hallucinated calculations • Verified Indian government schemes & market data</span>
        </div>
      </footer>
    </div>
  );
}
