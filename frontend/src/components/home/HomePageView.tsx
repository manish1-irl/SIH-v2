"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
  User,
  Bot,
  Volume2,
  Loader2,
  Check,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase";
import { ReverseDiscovery } from "@/components/ReverseDiscovery";
import { ReverseFeasibilityRecommendation } from "@/types";

export interface HomeChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  audioBase64?: string;
  isVoice?: boolean;
  timestamp: number;
  toolUsed?: string[];
  reverseRecs?: ReverseFeasibilityRecommendation[];
  showProceedToDashboard?: boolean;
}

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
  messages: HomeChatMessage[];
  isProcessing: boolean;
  onPlayAudio: (audioBase64: string) => void;
  onSelectBusinessIdea?: (businessName: string) => void;
  onConfirmAndSubmitDpr?: () => void;
  activeBusinessIdea?: string;
  activeLocality?: string;
  activeCapital?: number;
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
  messages,
  isProcessing,
  onPlayAudio,
  onSelectBusinessIdea,
  onConfirmAndSubmitDpr,
  activeBusinessIdea = "Dairy",
  activeLocality = "Bassi",
  activeCapital = 100000,
}: HomePageViewProps) {
  const [inputText, setInputText] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const selectedLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    if (messages.length > 0) {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

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
        {/* Ambient atmospheric haze overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35 backdrop-brightness-[0.98]" />
      </div>

      {/* Top Header: Logo at top left, Nav in center (NO Dashboard), User & Logout at right */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between z-30">
        {/* Official Sahaay Logo at Left Topmost Corner (Click to Home) */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity cursor-pointer group"
          title="Return to Sahaay Home"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-white/90 backdrop-blur-md shadow-xs border border-emerald-100 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
            <Image
              src="/sahaay-logo.png"
              alt="Sahaay Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg text-antigravity-navy tracking-tight leading-none drop-shadow-sm">
                Sahaay
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                AI
              </span>
            </div>
            <span className="font-sans text-[10px] text-emerald-800 font-medium block leading-tight">
              Rural Business Advisor
            </span>
          </div>
        </button>

        {/* Center Nav Links (WITHOUT Dashboard per instructions) */}
        <nav className="hidden md:flex items-center gap-6 sm:gap-8 mx-auto">
          <button
            onClick={() => onNavigate("home")}
            className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-antigravity-charcoal hover:text-antigravity-orange transition-colors relative py-1 border-b-2 border-antigravity-navy drop-shadow-sm cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("feasibility")}
            className="font-sans text-xs sm:text-sm font-medium tracking-wide text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors py-1 drop-shadow-sm cursor-pointer"
          >
            Feasibility
          </button>
          <button
            onClick={() => onNavigate("schemes")}
            className="font-sans text-xs sm:text-sm font-medium tracking-wide text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors py-1 drop-shadow-sm cursor-pointer"
          >
            Scheme Calculator
          </button>
          <button
            onClick={() => onNavigate("explore")}
            className="font-sans text-xs sm:text-sm font-medium tracking-wide text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors py-1 drop-shadow-sm cursor-pointer"
          >
            Explore
          </button>
        </nav>

        {/* User Info & Logout (Right) */}
        <div className="flex items-center gap-2.5 z-40">
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-xs font-medium text-antigravity-navy shadow-subtle">
              <div className="w-2 h-2 rounded-full bg-antigravity-sage animate-pulse" />
              <span className="max-w-[120px] truncate">{currentUser.full_name}</span>
            </div>
          )}

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-white/70 hover:bg-white/95 backdrop-blur-md text-red-600 hover:text-red-700 transition-all border border-white/50 shadow-subtle cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Center Area: Hero + Input Bar + 4 Pills + INLINE CHAT STREAM ON HOMEPAGE */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-4 sm:pt-6 pb-12 z-20 w-full max-w-4xl mx-auto">
        <div className="w-full flex flex-col items-center text-center">
          {/* Brand Title */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-antigravity-navy tracking-tight drop-shadow-sm select-none mb-2">
            Sahaay
          </h1>

          <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/80 max-w-md font-medium mb-5 drop-shadow-sm">
            Hyper-Local AI Business Advisor for Rural & Semi-Urban India
          </p>

          {/* Primary Interaction Pill (Search / Voice / Intake) */}
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-full px-3 py-2.5 sm:px-4 sm:py-3 shadow-elevated border border-antigravity-navy/10 flex items-center gap-2 sm:gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-antigravity-sage/60 focus-within:border-antigravity-sage/40">
            {/* Quick Intake Button (+) */}
            <button
              onClick={() => onSelectCapability("feasibility", "Run a complete business feasibility analysis for my enterprise.")}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-antigravity-navy/5 hover:bg-antigravity-orange hover:text-white text-antigravity-navy transition-all flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
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
              placeholder={isRecording ? "Listening to voice input..." : `Ask about any business, capital, or scheme in ${selectedLang.native}...`}
              className="flex-1 bg-transparent font-sans text-xs sm:text-sm text-antigravity-charcoal placeholder:text-antigravity-navy/40 focus:outline-none px-1"
            />

            {/* Language Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-antigravity-cream/70 hover:bg-antigravity-cream transition-all border border-antigravity-navy/10 text-antigravity-navy/80 cursor-pointer"
                title="Change Language"
              >
                <Languages className="w-3.5 h-3.5 text-antigravity-navy/60" />
                <span className="font-sans text-[11px] font-semibold hidden sm:inline">
                  {selectedLang.native}
                </span>
                <ChevronDown className="w-3 h-3 text-antigravity-navy/50" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 bottom-full mb-2 bg-white/95 backdrop-blur-xl border border-antigravity-navy/10 rounded-2xl shadow-elevated py-2 w-48 z-50 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 font-sans text-xs flex items-center justify-between hover:bg-antigravity-cream transition-all cursor-pointer ${
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
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm cursor-pointer ${
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

          {/* 4 Feature Action Pills Matching Mockup */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-3.5 w-full max-w-2xl">
            <button
              onClick={() =>
                onSelectCapability(
                  "schemes",
                  `Calculate verified government scheme subsidies and bank loan eligibility for my ${activeBusinessIdea} business in ${activeLocality}.`
                )
              }
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Scheme Calculator
              </span>
            </button>

            <button
              onClick={() =>
                onSelectCapability(
                  "feasibility",
                  `Evaluate hyper-local market feasibility, demand signals, and competition density for ${activeBusinessIdea} in ${activeLocality}.`
                )
              }
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Feasibility Matrix
              </span>
            </button>

            <button
              onClick={() =>
                onSelectCapability(
                  "cluster",
                  `Identify local economic clusters, nearby FPOs, and supply chain partners for ${activeBusinessIdea} around ${activeLocality}.`
                )
              }
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Cluster
              </span>
            </button>

            <button
              onClick={() =>
                onSelectCapability(
                  "dpr",
                  `Generate and download a bank-ready Detailed Project Report (DPR) for ${activeBusinessIdea} in ${activeLocality} with margin money ₹${activeCapital}.`
                )
              }
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 hover:border-antigravity-orange text-antigravity-charcoal hover:text-antigravity-orange shadow-subtle transition-all flex items-center gap-2 group cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-antigravity-sage group-hover:text-antigravity-orange transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Download DPR
              </span>
            </button>
          </div>

          {/* INLINE CHAT CONVERSATION DIRECTLY ON HOMEPAGE (NO REDIRECT TO ANOTHER PAGE) */}
          {messages.length > 0 && (
            <div className="w-full max-w-2xl mt-6 space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-left pb-4">
              {/* Active Context Status Pill */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="px-3.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-antigravity-navy/10 text-[11px] font-semibold text-antigravity-navy shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Current Parameters: <strong className="text-[#D96B27]">{activeBusinessIdea}</strong> in{" "}
                    <strong>{activeLocality}</strong> (Margin: <strong>₹{activeCapital.toLocaleString("en-IN")}</strong>)
                  </span>
                </div>
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[88%]">
                    <div className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                        msg.role === "user" ? "bg-antigravity-orange text-white" : "bg-antigravity-navy text-white shadow-sm"
                      }`}>
                        {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className="w-full">
                        <div className={`p-4 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-antigravity-navy text-white rounded-tr-sm shadow-md"
                            : "bg-white/95 backdrop-blur-xl border border-antigravity-navy/10 text-antigravity-charcoal rounded-tl-sm shadow-elevated"
                        }`}>
                          <p className="font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>

                        {/* Inline Reverse Feasibility Cards */}
                        {msg.reverseRecs && msg.reverseRecs.length > 0 && (
                          <div className="mt-3">
                            <ReverseDiscovery
                              recommendations={msg.reverseRecs}
                              onSelectBusiness={(biz) => onSelectBusinessIdea && onSelectBusinessIdea(biz)}
                            />
                          </div>
                        )}

                        {/* DPR Ready & Confirmation Card: Confirm and Proceed to Dashboard */}
                        {msg.showProceedToDashboard && (
                          <div className="mt-3 p-5 rounded-2xl bg-gradient-to-r from-[#0A2540] to-[#2D5A27] text-white shadow-elevated">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Sparkles className="w-4 h-4 text-[#D96B27]" />
                              <h4 className="font-serif font-bold text-sm">Detailed Project Report (DPR) Ready & Validated</h4>
                            </div>
                            <p className="font-sans text-xs text-white/85 mb-3 leading-relaxed">
                              Your Detailed Project Report for <strong className="text-white">{activeBusinessIdea}</strong> in <strong className="text-white">{activeLocality}</strong> is generated and validated against PMEGP / MUDRA guidelines. Confirm your business idea to unlock and launch your live 5-stage government loan tracker and personal operational dashboard!
                            </p>
                            <button
                              onClick={() => onConfirmAndSubmitDpr && onConfirmAndSubmitDpr()}
                              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-[#0A2540] font-sans text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Confirm & Submit Business Idea → Open Dashboard</span>
                              <span>&rarr;</span>
                            </button>
                          </div>
                        )}

                        {/* Message Metadata */}
                        <div className={`flex items-center gap-2 mt-1 px-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                          <span className="font-sans text-[10px] text-antigravity-navy/50">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.audioBase64 && (
                            <button
                              onClick={() => onPlayAudio(msg.audioBase64!)}
                              className="font-sans text-[10px] text-antigravity-orange flex items-center gap-0.5 hover:underline cursor-pointer"
                            >
                              <Volume2 className="w-2.5 h-2.5" /> listen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-antigravity-navy text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white/95 backdrop-blur-xl border border-antigravity-navy/10 p-3.5 rounded-2xl rounded-tl-sm shadow-elevated flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-antigravity-sage animate-spin" />
                      <span className="font-sans text-xs text-antigravity-navy/60">
                        {isRecording ? "Listening to your voice..." : "Sahaay is computing live parameters..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-center z-20">
        <div className="flex items-center gap-2 text-antigravity-charcoal/70 font-sans text-[11px] font-medium bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/50 shadow-subtle">
          <Sparkles className="w-3 h-3 text-antigravity-sage" />
          <span>Deterministic Government Scheme Verification • Zero Hallucinations</span>
        </div>
      </footer>
    </div>
  );
}
