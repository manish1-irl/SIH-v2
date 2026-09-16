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
  VolumeX,
  Loader2,
  Check,
  LayoutDashboard,
  RotateCcw,
  Home,
  X,
  Paperclip,
  FileText,
  Send,
  AlertCircle,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase";
import { ReverseDiscovery } from "@/components/ReverseDiscovery";
import { ReverseFeasibilityRecommendation } from "@/types";
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
  cleanTextForSpeech,
} from "@/lib/speech";

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  previewUrl?: string;
  isImage?: boolean;
}

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
  attachments?: ChatAttachment[];
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
  onSearchSubmit: (query: string, attachments?: ChatAttachment[]) => void;
  onSelectCapability: (capability: "schemes" | "feasibility" | "cluster" | "dpr", promptText: string) => void;
  onNavigate: (view: "home" | "feasibility" | "schemes" | "explore" | "dashboard") => void;
  messages: HomeChatMessage[];
  isProcessing: boolean;
  onPlayAudio: (audioBase64: string) => void;
  onSelectBusinessIdea?: (businessName: string) => void;
  onConfirmAndSubmitDpr?: () => void;
  onResetChat?: () => void;
  isDprConfirmed?: boolean;
  activeBusinessIdea?: string;
  activeLocality?: string;
  activeCapital?: number;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
}

export default function HomePageView({
  currentUser,
  onLogout,
  language,
  onLanguageChange,
  languages,
  isRecording = false,
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
  onResetChat,
  isDprConfirmed = false,
  activeBusinessIdea = "Dairy",
  activeLocality = "Bassi",
  activeCapital = 100000,
  autoSpeak = true,
  onToggleAutoSpeak,
}: HomePageViewProps) {
  const [inputText, setInputText] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const selectedLang = languages.find((l) => l.code === language) || languages[0];

  // Stop speech recognition and synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }
      stopSpeaking();
    };
  }, []);

  // Prevent automatic scroll on initial page load; only scroll upon subsequent messages
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (messages.length > 1) {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  // Auto-speak new agent responses when enabled
  useEffect(() => {
    if (isInitialMount.current) return;
    if (messages.length > 0 && autoSpeak) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "agent") {
        handleToggleSpeak(lastMsg);
      }
    }
  }, [messages.length]);

  const handleToggleSpeak = (msg: HomeChatMessage) => {
    if (activeSpeakingMsgId === msg.id) {
      stopSpeaking();
      setActiveSpeakingMsgId(null);
    } else {
      stopSpeaking();
      setActiveSpeakingMsgId(msg.id);
      speakText(
        msg.text,
        language,
        () => setActiveSpeakingMsgId(msg.id),
        () => setActiveSpeakingMsgId((cur) => (cur === msg.id ? null : cur)),
        () => setActiveSpeakingMsgId(null)
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: ChatAttachment[] = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      const sizeStr =
        file.size < 1024 * 1024
          ? `${Math.round(file.size / 1024)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type: file.type,
        size: sizeStr,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && attachments.length === 0) return;

    stopSpeaking();
    setActiveSpeakingMsgId(null);
    if (isVoiceListening && recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      setIsVoiceListening(false);
    }

    onSearchSubmit(
      text || (attachments.length > 0 ? `Uploaded ${attachments.length} attachment(s): ${attachments.map((a) => a.name).join(", ")}` : ""),
      attachments
    );
    setInputText("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Browser-native Web Speech Recognition
  const handleMicClick = () => {
    if (isVoiceListening) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
        recognizerRef.current = null;
      }
      setIsVoiceListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechNotice(
        "Speech recognition is not supported in this browser. Please type your query or use Google Chrome / Microsoft Edge."
      );
      setTimeout(() => setSpeechNotice(null), 8000);
      return;
    }

    setSpeechNotice(null);
    stopSpeaking();
    setActiveSpeakingMsgId(null);

    // Cleanly abort previous session before starting a new one
    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {}
      recognizerRef.current = null;
    }

    const recognizer = createSpeechRecognizer(language, {
      onResult: (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal && transcript.trim()) {
          setIsVoiceListening(false);
          onSearchSubmit(transcript.trim(), attachments);
          setInputText("");
          setAttachments([]);
        }
      },
      onError: (err) => {
        setIsVoiceListening(false);
        setSpeechNotice(err);
        setTimeout(() => setSpeechNotice(null), 10000);
      },
      onEnd: () => {
        setIsVoiceListening(false);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
        setIsVoiceListening(true);
      } catch {
        setIsVoiceListening(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans select-none pb-20 md:pb-6">
      {/* Top Header: Logo at top left, Nav in center, User & Logout at right */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-4 sm:py-5 flex items-center justify-between z-30">
        {/* Official Sahaay Logo at Left Topmost Corner (Click to Home) */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center hover:opacity-90 transition-opacity cursor-pointer group"
          title="Return to Sahaay Home"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Image
              src="/sahaay-logo.png"
              alt="Sahaay Logo"
              width={80}
              height={80}
              className="object-contain drop-shadow-xs"
              priority
            />
          </div>
        </button>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-5 sm:gap-7 mx-auto">
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
          {isDprConfirmed && (
            <button
              onClick={() => onNavigate("dashboard")}
              className="font-sans text-xs sm:text-sm font-bold tracking-wide text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dashboard</span>
            </button>
          )}
        </nav>

        {/* User Info & Logout (Right) */}
        <div className="flex items-center gap-2 sm:gap-2.5 z-40">
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
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-xs select-none mb-2 text-[#0A2540]">
            Sahaay
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#2B1C03]/85 max-w-md font-medium mb-5 drop-shadow-xs">
            Hyper-Local AI Business Advisor for Rural & Semi-Urban India
          </p>

          {/* Primary Interaction Pill (Search / Voice / Intake) with high z-index and luminous frosted glass */}
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-3xl sm:rounded-full px-2.5 py-2 sm:px-4 sm:py-3 shadow-[0_16px_45px_rgba(10,37,64,0.12)] border border-white/90 flex flex-col gap-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#87A96B]/60 focus-within:border-[#87A96B]/40 relative z-40">
            {/* Attachment preview strip if files or images are selected */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1 pb-1.5 border-b border-antigravity-navy/10">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-lg text-xs font-medium animate-in fade-in"
                  >
                    {att.isImage && att.previewUrl ? (
                      <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    )}
                    <span className="max-w-[130px] truncate">{att.name}</span>
                    <span className="text-[10px] text-emerald-600">({att.size})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-0.5 hover:bg-emerald-100 rounded text-emerald-700 hover:text-emerald-950 cursor-pointer ml-0.5"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-3 w-full">
              {/* Hidden File Input for images and documents */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Quick Intake Button (+) Accepting Images or Files */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all flex items-center justify-center shrink-0 shadow-xs cursor-pointer ${
                  attachments.length > 0
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-300"
                    : "bg-antigravity-navy/5 hover:bg-antigravity-orange hover:text-white text-antigravity-navy"
                }`}
                title="Attach images, documents or DPR spreadsheets"
                aria-label="Attach images or files"
              >
                <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isVoiceListening
                    ? `Listening in ${selectedLang.native}... Speak clearly`
                    : `Ask about any business in ${selectedLang.native}...`
                }
                className="flex-1 min-w-0 bg-transparent font-sans text-xs sm:text-sm text-antigravity-charcoal placeholder:text-antigravity-navy/40 focus:outline-none px-1"
              />

              {/* Language Selector Pill with high z-index and solid background */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-antigravity-cream/80 hover:bg-antigravity-cream transition-all border border-antigravity-navy/15 text-antigravity-navy cursor-pointer shrink-0"
                  title="Change Language"
                  aria-label="Change Language"
                >
                  <Languages className="w-3.5 h-3.5 text-antigravity-navy/70 shrink-0" />
                  <span className="font-sans text-[11px] font-semibold hidden sm:inline truncate max-w-[65px]">
                    {selectedLang.native}
                  </span>
                  <ChevronDown className="w-3 h-3 text-antigravity-navy/50 shrink-0" />
                </button>

                {showLangMenu && (
                  <>
                    {/* Backdrop to dismiss language dropdown on outside click */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLangMenu(false)}
                    />

                    <div className="absolute right-0 top-full mt-2 bg-white border border-antigravity-navy/15 rounded-2xl shadow-2xl py-2 w-52 sm:w-56 z-50 max-h-64 sm:max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                      <div className="px-3 py-1 border-b border-antigravity-navy/10 text-[10px] font-bold text-antigravity-navy/60 uppercase tracking-wider">
                        Select Language ({languages.length})
                      </div>
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            onLanguageChange(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 font-sans text-xs flex items-center justify-between hover:bg-antigravity-cream transition-all cursor-pointer ${
                            language === lang.code
                              ? "text-antigravity-orange font-semibold bg-antigravity-orange/5"
                              : "text-antigravity-charcoal/85"
                          }`}
                        >
                          <span className="font-medium">{lang.native}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-antigravity-navy/40 text-[10px]">{lang.name}</span>
                            {language === lang.code && <Check className="w-3.5 h-3.5 text-antigravity-orange" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Send or Mic Button */}
              {inputText.trim() || attachments.length > 0 ? (
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-antigravity-orange hover:bg-antigravity-navy text-white flex items-center justify-center transition-all shrink-0 shadow-sm cursor-pointer"
                  title="Send inquiry"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm cursor-pointer ${
                    isVoiceListening
                      ? "bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-300"
                      : "bg-antigravity-navy text-white hover:bg-antigravity-orange"
                  }`}
                  title={isVoiceListening ? "Listening... Click to stop" : `Speak in ${selectedLang.name} (${selectedLang.native})`}
                >
                  {isVoiceListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                </button>
              )}
            </div>

            {/* Speech recognition notice/error banner with actionable buttons */}
            {speechNotice && (
              <div className="text-[11px] text-amber-950 bg-amber-50/95 backdrop-blur-md border border-amber-300/80 rounded-2xl p-3 text-left font-medium animate-in fade-in shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{speechNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpeechNotice(null)}
                    className="text-amber-600 hover:text-amber-950 font-bold p-0.5 rounded-full hover:bg-amber-100/60 transition-colors text-xs shrink-0 cursor-pointer"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-6 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSpeechNotice(null);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-antigravity-navy text-white text-[10px] font-semibold hover:bg-antigravity-orange transition-colors cursor-pointer shadow-xs"
                  >
                    Type Message Instead
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpeechNotice(null);
                      handleMicClick();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-200/90 text-amber-950 text-[10px] font-semibold hover:bg-amber-300 transition-colors cursor-pointer border border-amber-300"
                  >
                    Retry Voice
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4 Feature Action Pills with Vibrant Distinct Accents & Glassmorphism */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-3.5 w-full max-w-2xl relative z-10">
            <button
              onClick={() =>
                onSelectCapability(
                  "schemes",
                  `Calculate verified government scheme subsidies and bank loan eligibility for my ${activeBusinessIdea} business in ${activeLocality}.`
                )
              }
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/85 hover:bg-emerald-50/90 backdrop-blur-md border border-emerald-200/80 hover:border-emerald-400 text-emerald-950 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
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
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/85 hover:bg-blue-50/90 backdrop-blur-md border border-blue-200/80 hover:border-blue-400 text-blue-950 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700 transition-colors" />
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
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/85 hover:bg-indigo-50/90 backdrop-blur-md border border-indigo-200/80 hover:border-indigo-400 text-indigo-950 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Cluster Network
              </span>
            </button>

            <button
              onClick={() =>
                onSelectCapability(
                  "dpr",
                  `Generate and download a bank-ready Detailed Project Report (DPR) for ${activeBusinessIdea} in ${activeLocality} with margin money ₹${activeCapital}.`
                )
              }
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/85 hover:bg-amber-50/90 backdrop-blur-md border border-amber-200/80 hover:border-amber-400 text-amber-950 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-[#D96B27] group-hover:text-amber-700 transition-colors" />
              <span className="font-sans text-xs font-semibold tracking-wide">
                Download DPR
              </span>
            </button>
          </div>

          {/* INLINE CHAT CONVERSATION DIRECTLY ON HOMEPAGE (NO REDIRECT TO ANOTHER PAGE) */}
          {messages.length > 0 && (
            <div className="w-full max-w-2xl mt-6 space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-left pb-4 relative z-10">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-antigravity-navy/10 text-[11px] text-antigravity-navy/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggleAutoSpeak}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer text-[10px] font-medium ${
                      autoSpeak
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                        : "bg-neutral-100 text-neutral-600 border-neutral-300"
                    }`}
                    title={autoSpeak ? "Auto-speak is ON (Click to mute auto-speech)" : "Auto-speak is OFF (Click to turn on auto-speech)"}
                  >
                    {autoSpeak ? <Volume2 className="w-3 h-3 text-emerald-600" /> : <VolumeX className="w-3 h-3 text-neutral-500" />}
                    <span>Auto Voice: {autoSpeak ? "ON" : "OFF"}</span>
                  </button>
                </div>
                {onResetChat && (
                  <button
                    type="button"
                    onClick={onResetChat}
                    className="flex items-center gap-1 text-antigravity-navy/50 hover:text-antigravity-orange text-[10px] cursor-pointer"
                    title="Reset conversation"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Chat</span>
                  </button>
                )}
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

                          {/* Render Attached Files / Images in Message Bubble */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {msg.attachments.map((att) => (
                                <div key={att.id} className="rounded-xl overflow-hidden">
                                  {att.isImage && att.previewUrl ? (
                                    <img
                                      src={att.previewUrl}
                                      alt={att.name}
                                      className="max-h-56 max-w-full rounded-xl object-cover border border-white/20 shadow-sm"
                                    />
                                  ) : (
                                    <div
                                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
                                        msg.role === "user"
                                          ? "bg-white/10 border-white/20 text-white"
                                          : "bg-neutral-100 border-neutral-200 text-neutral-800"
                                      }`}
                                    >
                                      <Paperclip className="w-4 h-4 shrink-0 opacity-80" />
                                      <span className="font-medium truncate">{att.name}</span>
                                      <span className="opacity-75 text-[10px]">({att.size})</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
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
                          <div className="mt-3 p-5 rounded-2xl bg-[#0A2540] text-white shadow-elevated">
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
                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                          <span className="font-sans text-[10px] text-antigravity-navy/50">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.role === "agent" && (
                            <button
                              type="button"
                              onClick={() => handleToggleSpeak(msg)}
                              className={`font-sans text-[10px] flex items-center gap-1 hover:underline cursor-pointer transition-colors ${
                                activeSpeakingMsgId === msg.id
                                  ? "text-red-500 font-bold animate-pulse"
                                  : "text-antigravity-orange font-medium"
                              }`}
                              title={activeSpeakingMsgId === msg.id ? "Stop voice readout" : `Listen in ${selectedLang.name}`}
                            >
                              {activeSpeakingMsgId === msg.id ? (
                                <>
                                  <VolumeX className="w-3 h-3" /> Stop
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" /> Listen
                                </>
                              )}
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
                        {isVoiceListening ? `Listening in ${selectedLang.name}...` : "Sahaay is computing live parameters..."}
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

      {/* Mobile Bottom Navigation Dock (Visible only on mobile devices < md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-t border-antigravity-navy/15 px-2 py-2 flex items-center justify-around shadow-elevated">
        <button
          onClick={() => onNavigate("home")}
          className="flex flex-col items-center gap-0.5 text-antigravity-orange font-bold text-[10px] cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onNavigate("feasibility")}
          className="flex flex-col items-center gap-0.5 text-antigravity-charcoal/70 hover:text-antigravity-orange font-medium text-[10px] cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>Feasibility</span>
        </button>
        <button
          onClick={() => onNavigate("schemes")}
          className="flex flex-col items-center gap-0.5 text-antigravity-charcoal/70 hover:text-antigravity-orange font-medium text-[10px] cursor-pointer"
        >
          <Calculator className="w-4 h-4" />
          <span>Schemes</span>
        </button>
        <button
          onClick={() => onNavigate("explore")}
          className="flex flex-col items-center gap-0.5 text-antigravity-charcoal/70 hover:text-antigravity-orange font-medium text-[10px] cursor-pointer"
        >
          <Network className="w-4 h-4" />
          <span>Cluster</span>
        </button>
        {isDprConfirmed && (
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex flex-col items-center gap-0.5 text-emerald-800 font-bold text-[10px] cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-700" />
            <span>Dashboard</span>
          </button>
        )}
      </nav>
    </div>
  );
}
