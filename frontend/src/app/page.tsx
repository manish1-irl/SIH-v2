"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Mic, MicOff, Send, Volume2, VolumeX, Globe, Loader2,
  Bot, User, Sparkles, AlertCircle, LogOut, ArrowLeft,
  Calculator, Compass, Network, FileDown,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import LoginPage from "@/components/auth/LoginPage";
import HomePageView from "@/components/home/HomePageView";
import FeasibilityMatrixFlow from "@/components/feasibility/FeasibilityMatrixFlow";
import SchemeCalculatorFlow from "@/components/schemes/SchemeCalculatorFlow";
import ClusterNetworkFlow from "@/components/cluster/ClusterNetworkFlow";
import PersonalDashboardView from "@/components/dashboard/PersonalDashboardView";
import { ReverseDiscovery } from "@/components/ReverseDiscovery";
import { getCurrentUser, logoutUser, UserProfile } from "@/lib/supabase";
import { ReverseFeasibilityRecommendation } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  audioBase64?: string;
  isVoice?: boolean;
  timestamp: number;
  toolUsed?: string[];
  report?: any;
  reverseRecs?: ReverseFeasibilityRecommendation[];
  showProceedToDashboard?: boolean;
}

const LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "en", name: "English", native: "English" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
];

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "schemes" | "feasibility" | "cluster" | "dpr" | "chat" | "explore" | "dashboard">("home");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState("hi");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [servicesReady, setServicesReady] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsHydrated(true);

    apiClient.getVoiceStatus().then((status) => {
      setServicesReady(status.bhashini_configured || status.gemini_configured);
    }).catch(() => {});

    const name = user?.full_name ? ` ${user.full_name}` : "";
    addMessage({
      role: "agent",
      text: `Namaste${name}! I am your Sahaay Hyper-Local AI Business Advisor. I help rural Indian entrepreneurs with feasibility analysis, government scheme matching (PMEGP, MUDRA), financial planning, and business lifecycle support. Tell me your business idea, location, and available capital. You can speak in any Indian language!`,
      toolUsed: ["greeting"],
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const playAudio = useCallback((base64Audio: string) => {
    if (!base64Audio) return;
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          await processVoiceInput(base64);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      addMessage({
        role: "agent",
        text: "Microphone access is required for voice input. Please allow microphone access or type your message instead.",
        toolUsed: ["mic_error"],
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceInput = async (audioBase64: string) => {
    setIsProcessing(true);
    try {
      const result = await apiClient.voiceChat(audioBase64, language);
      addMessage({
        role: "user",
        text: result.user_message,
        isVoice: true,
      });
      addMessage({
        role: "agent",
        text: result.agent_response,
        audioBase64: result.voice_audio_base64,
        toolUsed: result.tool_used,
      });
      if (autoSpeak && result.voice_audio_base64) {
        playAudio(result.voice_audio_base64);
      }
    } catch {
      addMessage({
        role: "agent",
        text: "I could not process your voice. Please try speaking again or type your message.",
        toolUsed: ["voice_error"],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText("");
    addMessage({ role: "user", text, isVoice: false });
    setIsProcessing(true);
    try {
      const lower = text.toLowerCase();
      const isReverseFeasibility =
        lower.includes("recommend") ||
        lower.includes("suggest") ||
        lower.includes("which business") ||
        lower.includes("what business") ||
        lower.includes("reverse") ||
        lower.includes("business idea") ||
        (lower.includes("capital") && !lower.includes("dairy") && !lower.includes("oil"));

      const isDpr = lower.includes("dpr") || lower.includes("detailed project report") || lower.includes("finalize");

      let reverseRecs: ReverseFeasibilityRecommendation[] | undefined = undefined;
      if (isReverseFeasibility) {
        try {
          reverseRecs = await apiClient.reverseFeasibility(100000, "Bassi", "Rajasthan");
        } catch {}
      }

      const result = await apiClient.textChat(text, language);
      addMessage({
        role: "agent",
        text: result.agent_response,
        audioBase64: result.voice_audio_base64,
        toolUsed: result.tool_used,
        report: result.data?.report,
        reverseRecs,
        showProceedToDashboard: isDpr || Boolean(result.tool_used?.includes("tool_06_generate_dpr")),
      });
      if (autoSpeak && result.voice_audio_base64) {
        playAudio(result.voice_audio_base64);
      }
    } catch {
      addMessage({
        role: "agent",
        text: "Something went wrong. Please try again.",
        toolUsed: ["error"],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerQuery = async (queryText: string) => {
    addMessage({ role: "user", text: queryText, isVoice: false });
    setIsProcessing(true);
    try {
      const lower = queryText.toLowerCase();
      const isReverseFeasibility =
        lower.includes("recommend") ||
        lower.includes("suggest") ||
        lower.includes("which business") ||
        lower.includes("what business") ||
        lower.includes("reverse") ||
        lower.includes("business idea") ||
        (lower.includes("capital") && !lower.includes("dairy") && !lower.includes("oil"));

      const isDpr = lower.includes("dpr") || lower.includes("detailed project report") || lower.includes("finalize");

      let reverseRecs: ReverseFeasibilityRecommendation[] | undefined = undefined;
      if (isReverseFeasibility) {
        try {
          reverseRecs = await apiClient.reverseFeasibility(100000, "Bassi", "Rajasthan");
        } catch {}
      }

      const result = await apiClient.textChat(queryText, language);
      addMessage({
        role: "agent",
        text: result.agent_response,
        audioBase64: result.voice_audio_base64,
        toolUsed: result.tool_used,
        report: result.data?.report,
        reverseRecs,
        showProceedToDashboard: isDpr || Boolean(result.tool_used?.includes("tool_06_generate_dpr")),
      });
      if (autoSpeak && result.voice_audio_base64) {
        playAudio(result.voice_audio_base64);
      }
    } catch {
      addMessage({
        role: "agent",
        text: `I have received your inquiry: "${queryText}". The Sahaay AI Advisor engine calculates local market feasibility, deterministic government subsidies (PMEGP, MUDRA, PMFME), and bank loan schedules. What location and capital amount are you considering?`,
        toolUsed: ["advisor_engine"],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveView("home");
    addMessage({
      role: "agent",
      text: `Namaste ${user.full_name}! Welcome to Sahaay. Your session is active and verified. Tell me your business idea or question, and we'll evaluate feasibility and relevant schemes right away.`,
      toolUsed: ["welcome"],
    });
  };

  // Show login page first when user lands unauthenticated
  if (isHydrated && !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show home page first when user logs in
  if (activeView === "home") {
    return (
      <HomePageView
        currentUser={currentUser}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={(newLang) => setLanguage(newLang)}
        languages={LANGUAGES}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSearchSubmit={(query) => {
          setActiveView("chat");
          handleTriggerQuery(query);
        }}
        onSelectCapability={(capability, promptText) => {
          setActiveView(capability);
          handleTriggerQuery(promptText);
        }}
        onNavigate={(view) => {
          setActiveView(view);
          if (view === "schemes") {
            handleTriggerQuery("Calculate government scheme subsidies (PMEGP, MUDRA, PMFME, PM Vishwakarma) and bank loan eligibility for my business.");
          } else if (view === "feasibility") {
            handleTriggerQuery("Run a hyper-local feasibility analysis for my business idea, capital, and location.");
          } else if (view === "explore") {
            handleTriggerQuery("Explore local economic clusters, nearby FPOs, mandis, cold storages, and supply chain partners.");
          }
        }}
      />
    );
  }

  if (activeView === "feasibility") {
    return (
      <FeasibilityMatrixFlow
        onBackToHome={() => setActiveView("home")}
        onProceedToSchemes={() => {
          setActiveView("schemes");
          handleTriggerQuery("Calculate government scheme subsidies (PMEGP, MUDRA, PMFME, PM Vishwakarma) and bank loan eligibility for my business.");
        }}
        onProceedToDpr={() => {
          setActiveView("dashboard");
        }}
      />
    );
  }

  if (activeView === "schemes") {
    return (
      <SchemeCalculatorFlow
        onBackToHome={() => setActiveView("home")}
        onProceedToFeasibility={() => {
          setActiveView("feasibility");
        }}
        onProceedToDpr={() => {
          setActiveView("dashboard");
        }}
      />
    );
  }

  if (activeView === "cluster" || activeView === "explore") {
    return (
      <ClusterNetworkFlow
        onBackToHome={() => setActiveView("home")}
        onProceedToSchemes={() => {
          setActiveView("schemes");
        }}
        onProceedToFeasibility={() => {
          setActiveView("feasibility");
        }}
        onProceedToDpr={() => {
          setActiveView("dashboard");
        }}
      />
    );
  }

  if (activeView === "dashboard") {
    return (
      <PersonalDashboardView
        currentUser={currentUser}
        onBackToHome={() => setActiveView("home")}
        onLogout={handleLogout}
        onOpenSchemes={() => setActiveView("schemes")}
        onOpenFeasibility={() => setActiveView("feasibility")}
        onOpenExplore={() => setActiveView("cluster")}
      />
    );
  }

  const selectedLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="min-h-screen bg-antigravity-cream flex flex-col">
      {/* Header */}
      <header className="border-b border-antigravity-navy/10 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <button
            onClick={() => setActiveView("home")}
            className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity"
            title="Return to Sahaay Home"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-white shadow-sm border border-emerald-100 flex items-center justify-center p-1">
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
                <span className="font-serif font-bold text-base text-antigravity-navy tracking-tight leading-tight">
                  Sahaay
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  Advisor
                </span>
              </div>
              <span className="font-sans text-[11px] text-emerald-700 font-medium block leading-tight">
                Hyper-Local AI Guidance
              </span>
            </div>
          </button>

          {/* Navigation Links matching Home Page */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setActiveView("home")}
              className="font-sans text-xs font-semibold tracking-wide text-antigravity-charcoal/70 hover:text-antigravity-orange transition-colors flex items-center gap-1 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                setActiveView("feasibility");
                handleTriggerQuery("Run a hyper-local feasibility analysis for my business idea, capital, and location.");
              }}
              className={`font-sans text-xs font-semibold tracking-wide transition-colors py-1 ${
                (activeView as string) === "feasibility"
                  ? "text-antigravity-orange border-b-2 border-antigravity-orange"
                  : "text-antigravity-charcoal/70 hover:text-antigravity-orange"
              }`}
            >
              Feasibility
            </button>
            <button
              onClick={() => {
                setActiveView("schemes");
                handleTriggerQuery("Calculate government scheme subsidies (PMEGP, MUDRA, PMFME, PM Vishwakarma) and bank loan eligibility for my business.");
              }}
              className={`font-sans text-xs font-semibold tracking-wide transition-colors py-1 ${
                (activeView as string) === "schemes"
                  ? "text-antigravity-orange border-b-2 border-antigravity-orange"
                  : "text-antigravity-charcoal/70 hover:text-antigravity-orange"
              }`}
            >
              Scheme Calculator
            </button>
            <button
              onClick={() => {
                setActiveView("cluster");
                handleTriggerQuery("Explore local economic clusters, nearby FPOs, mandis, cold storages, and supply chain partners.");
              }}
              className={`font-sans text-xs font-semibold tracking-wide transition-colors py-1 ${
                (activeView as string) === "cluster" || (activeView as string) === "explore"
                  ? "text-antigravity-orange border-b-2 border-antigravity-orange"
                  : "text-antigravity-charcoal/70 hover:text-antigravity-orange"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => {
                setActiveView("dashboard");
              }}
              className={`font-sans text-xs font-semibold tracking-wide transition-colors py-1 flex items-center gap-1.5 ${
                (activeView as string) === "dashboard"
                  ? "text-antigravity-orange border-b-2 border-antigravity-orange"
                  : "text-antigravity-charcoal/70 hover:text-antigravity-orange"
              }`}
            >
              <span>Dashboard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            </button>
          </nav>

          {/* User Status & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[120px] truncate">{currentUser.full_name}</span>
              </div>
            )}

            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${
                autoSpeak ? "bg-antigravity-sage/15 text-antigravity-sage" : "bg-antigravity-navy/5 text-antigravity-navy/40"
              }`}
              title={autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-antigravity-navy/5 hover:bg-antigravity-navy/10 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-antigravity-navy/60" />
                <span className="font-sans text-xs font-semibold text-antigravity-navy/70">{selectedLang.native}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-antigravity-navy/10 rounded-xl shadow-elevated py-1.5 w-44 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 font-sans text-xs flex items-center justify-between hover:bg-antigravity-cream transition-all ${
                        language === lang.code ? "text-antigravity-orange font-semibold" : "text-antigravity-charcoal/80"
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-antigravity-navy/40">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all text-xs font-semibold border border-red-200/60 shadow-sm"
              title="Log out of Sahaay"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "order-1" : "order-1"}`}>
                <div className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-antigravity-orange/15 text-antigravity-orange"
                      : "bg-antigravity-navy text-white"
                  }`}>
                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className={`p-3.5 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-antigravity-navy text-white rounded-tr-md"
                        : "bg-white border border-antigravity-navy/10 text-antigravity-charcoal rounded-tl-md shadow-subtle"
                    }`}>
                      <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {msg.reverseRecs && msg.reverseRecs.length > 0 && (
                      <div className="mt-3">
                        <ReverseDiscovery
                          recommendations={msg.reverseRecs}
                          onSelectBusiness={(biz) => {
                            handleTriggerQuery(`I select ${biz}. Please run a full 5-section feasibility analysis and prepare the loan schedule.`);
                            setActiveView("feasibility");
                          }}
                        />
                      </div>
                    )}

                    {msg.showProceedToDashboard && (
                      <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-[#0A2540] to-[#2D5A27] text-white shadow-md">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles className="w-4 h-4 text-[#D96B27]" />
                          <h4 className="font-serif font-bold text-sm">Enterprise Initialized & DPR Finalized</h4>
                        </div>
                        <p className="font-sans text-xs text-white/80 mb-3">
                          Your Detailed Project Report has been digitally sealed. You can now access your live personal dashboard to track the 5-stage government loan pipeline and AI business goals.
                        </p>
                        <button
                          onClick={() => setActiveView("dashboard")}
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-[#0A2540] font-sans text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <span>Open Personal Dashboard & Loan Pipeline</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    )}
                    <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                      <span className="font-sans text-[10px] text-antigravity-navy/40">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.isVoice && (
                        <span className="font-sans text-[10px] text-antigravity-sage flex items-center gap-0.5">
                          <Mic className="w-2.5 h-2.5" /> voice
                        </span>
                      )}
                      {msg.audioBase64 && (
                        <button
                          onClick={() => playAudio(msg.audioBase64!)}
                          className="font-sans text-[10px] text-antigravity-orange flex items-center gap-0.5 hover:underline"
                        >
                          <Volume2 className="w-2.5 h-2.5" /> listen
                        </button>
                      )}
                      {msg.toolUsed && msg.toolUsed.length > 0 && !["greeting", "error", "voice_error", "mic_error", "capabilities"].includes(msg.toolUsed[0]) && (
                        <span className="font-sans text-[10px] text-antigravity-navy/30 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> {msg.toolUsed[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-antigravity-navy text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-antigravity-navy/10 p-4 rounded-2xl rounded-tl-md shadow-subtle">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-antigravity-sage animate-spin" />
                    <span className="font-sans text-xs text-antigravity-navy/50">
                      {isRecording ? "Listening..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-antigravity-navy/10 bg-white/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onMouseDown={isRecording ? stopRecording : startRecording}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-lg"
                  : "bg-antigravity-orange text-white hover:bg-[#c45e1f] shadow-md"
              }`}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendText()}
              placeholder={
                isRecording
                  ? "Listening... speak now"
                  : `Type or press mic to speak in ${selectedLang.native}...`
              }
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 rounded-xl border border-antigravity-navy/15 focus:border-antigravity-orange outline-none font-sans text-sm text-antigravity-charcoal bg-antigravity-cream/40 placeholder:text-antigravity-navy/30 disabled:opacity-50 transition-all"
            />
            <button
              onClick={handleSendText}
              disabled={!inputText.trim() || isProcessing}
              className="w-11 h-11 rounded-xl bg-antigravity-navy text-white flex items-center justify-center hover:bg-antigravity-navy/90 transition-all disabled:opacity-30 shrink-0 shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="font-sans text-[10px] text-antigravity-navy/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              All calculations are deterministic — zero hallucinated estimates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
