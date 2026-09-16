"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import LoginPage from "@/components/auth/LoginPage";
import HomePageView, { HomeChatMessage, ChatAttachment } from "@/components/home/HomePageView";
import FeasibilityMatrixFlow from "@/components/feasibility/FeasibilityMatrixFlow";
import SchemeCalculatorFlow from "@/components/schemes/SchemeCalculatorFlow";
import ClusterNetworkFlow from "@/components/cluster/ClusterNetworkFlow";
import PersonalDashboardView from "@/components/dashboard/PersonalDashboardView";
import { getCurrentUser, logoutUser, UserProfile } from "@/lib/supabase";
import { ReverseFeasibilityRecommendation } from "@/types";

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
  const [activeView, setActiveView] = useState<"home" | "schemes" | "feasibility" | "cluster" | "explore" | "dashboard">("home");
  const [messages, setMessages] = useState<HomeChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState("hi");
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Dynamic shared business parameters across the application (Synchronized from User Chat)
  const [businessIdea, setBusinessIdea] = useState("Commercial Mini Dairy & Chilling Unit");
  const [locality, setLocality] = useState("Bassi");
  const [stateName, setStateName] = useState("Rajasthan");
  const [capital, setCapital] = useState(100000);
  const [enterpriseName, setEnterpriseName] = useState("");
  const [isDprConfirmed, setIsDprConfirmed] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const initialGreetingAdded = useRef(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsHydrated(true);

    if (!initialGreetingAdded.current) {
      initialGreetingAdded.current = true;
      const name = user?.full_name ? ` ${user.full_name}` : "";
      setMessages([
        {
          id: "initial-greeting",
          role: "agent",
          text: `Namaste${name}! I am your Sahaay Hyper-Local AI Business Advisor. I help rural Indian entrepreneurs with feasibility analysis, government scheme matching (PMEGP, MUDRA), financial planning, and business lifecycle support. Tell me your business idea, location, and available capital. You can speak in any Indian language!`,
          timestamp: Date.now(),
          toolUsed: ["greeting"],
        },
      ]);
    }

    // Restore active session state from backend if available
    apiClient.getSession().then((sess) => {
      if (sess?.active_business) {
        if (sess.active_business.business_idea) setBusinessIdea(sess.active_business.business_idea);
        if (sess.active_business.capital) setCapital(Number(sess.active_business.capital));
        if (sess.active_business.locality) setLocality(sess.active_business.locality);
        if (sess.active_business.state) setStateName(sess.active_business.state);
        if (sess.active_business.enterprise_name) setEnterpriseName(sess.active_business.enterprise_name);
      }
    }).catch(() => {});
  }, []);

  const addMessage = (msg: Omit<HomeChatMessage, "id" | "timestamp">) => {
    const newMsg: HomeChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      // Prevent identical consecutive messages
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.role === newMsg.role && last.text === newMsg.text) {
          return prev;
        }
      }
      return [...prev, newMsg];
    });
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

  // Parse natural language from user chat to dynamically update business state
  const parseBusinessParams = (text: string) => {
    const lower = text.toLowerCase();

    // 1. Capital Outlay / Margin
    const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|l)\b/i);
    if (lakhMatch) {
      const val = parseFloat(lakhMatch[1]) * 100000;
      if (val > 0) setCapital(val);
    } else {
      const crMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/i);
      if (crMatch) {
        const val = parseFloat(crMatch[1]) * 10000000;
        if (val > 0) setCapital(val);
      } else {
        const directNumMatch = text.match(/(?:₹|rs\.?|inr|\bcap(?:ital)?\b|\bmargin\b)?\s*(\d{1,3}(?:,\d{3})+|\d{5,8})/i);
        if (directNumMatch) {
          const rawNum = directNumMatch[1].replace(/,/g, "");
          const val = parseInt(rawNum, 10);
          if (val >= 10000) setCapital(val);
        }
      }
    }

    // 2. Business Sector / Idea
    if (
      lower.includes("dairy") ||
      lower.includes("milk") ||
      lower.includes("bmc") ||
      lower.includes("chilling") ||
      lower.includes("dudh") ||
      lower.includes("doodh")
    ) {
      setBusinessIdea("Commercial Mini Dairy & Chilling Unit");
    } else if (
      lower.includes("mustard") ||
      lower.includes("oil") ||
      lower.includes("expeller") ||
      lower.includes("sarson") ||
      lower.includes("tel")
    ) {
      setBusinessIdea("Mustard Oil Cold-Press & Expeller Unit");
    } else if (
      lower.includes("kirana") ||
      lower.includes("retail") ||
      lower.includes("grocery") ||
      lower.includes("fmcg") ||
      lower.includes("general store")
    ) {
      setBusinessIdea("Rural Retail Kirana & FMCG Hub");
    } else if (
      lower.includes("spice") ||
      lower.includes("masala") ||
      lower.includes("turmeric") ||
      lower.includes("chilli") ||
      lower.includes("haldi")
    ) {
      setBusinessIdea("Agro Spice Processing & Packaging");
    } else if (
      lower.includes("flour") ||
      lower.includes("atta") ||
      lower.includes("chakki") ||
      lower.includes("dal mill") ||
      lower.includes("grain")
    ) {
      setBusinessIdea("Semi-Automated Flour & Atta Processing Mill");
    } else if (
      lower.includes("poultry") ||
      lower.includes("broiler") ||
      lower.includes("murgi") ||
      lower.includes("egg")
    ) {
      setBusinessIdea("Commercial Poultry & Broiler Layer Unit");
    }

    // 3. Locality & State
    const RAJASTHAN_PLACES = [
      "bassi", "jaipur", "alwar", "bharatpur", "sikar", "ajmer", "jodhpur", "kota", "bikaner", "udaipur", "sanganer", "chomu", "dausa"
    ];
    for (const place of RAJASTHAN_PLACES) {
      if (lower.includes(place)) {
        setLocality(place.charAt(0).toUpperCase() + place.slice(1));
        setStateName("Rajasthan");
        break;
      }
    }

    if (lower.includes("uttar pradesh") || lower.includes("up")) {
      setStateName("Uttar Pradesh");
    } else if (lower.includes("madhya pradesh") || lower.includes("mp")) {
      setStateName("Madhya Pradesh");
    } else if (lower.includes("maharashtra")) {
      setStateName("Maharashtra");
    } else if (lower.includes("bihar")) {
      setStateName("Bihar");
    } else if (lower.includes("gujarat")) {
      setStateName("Gujarat");
    } else if (lower.includes("rajasthan")) {
      setStateName("Rajasthan");
    }

    const inLocationMatch = text.match(/\b(?:in|at|around|near)\s+([A-Za-z]{3,20})/i);
    if (inLocationMatch) {
      const loc = inLocationMatch[1].trim();
      const locLower = loc.toLowerCase();
      if (!["the", "my", "our", "this", "that", "india", "village", "town", "city", "rural", "block", "business"].includes(locLower)) {
        setLocality(loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase());
      }
    }
  };

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
      if (result.active_business) {
        if (result.active_business.business_idea) setBusinessIdea(result.active_business.business_idea);
        if (result.active_business.capital) setCapital(Number(result.active_business.capital));
        if (result.active_business.locality) setLocality(result.active_business.locality);
        if (result.active_business.state) setStateName(result.active_business.state);
        if (result.active_business.enterprise_name) setEnterpriseName(result.active_business.enterprise_name);
      } else if (result.user_message) {
        parseBusinessParams(result.user_message);
      }
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
        showProceedToDashboard: Boolean(result.tool_used?.includes("tool_06_generate_dpr")),
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

  // Main interaction query handler — keeps chat inline on the homepage without redirecting
  const handleTriggerQuery = async (queryText: string, attachments?: ChatAttachment[]) => {
    const text = queryText.trim();
    if (!text && (!attachments || attachments.length === 0)) return;
    if (isProcessing) return;

    if (text) {
      parseBusinessParams(text);
    }

    const displayText = text || (attachments && attachments.length > 0 ? `Uploaded ${attachments.length} attachment(s): ${attachments.map(a => a.name).join(", ")}` : "");
    addMessage({
      role: "user",
      text: displayText,
      isVoice: false,
      attachments,
    });
    setIsProcessing(true);

    try {
      const lower = (text || "").toLowerCase();
      const isReverseFeasibility =
        lower.includes("recommend") ||
        lower.includes("suggest") ||
        lower.includes("which business") ||
        lower.includes("what business") ||
        lower.includes("reverse") ||
        (lower.includes("idea") && (lower.includes("give") || lower.includes("find"))) ||
        (lower.includes("capital") && !lower.includes("dairy") && !lower.includes("oil") && !lower.includes("kirana"));

      const isDpr =
        lower.includes("dpr") ||
        lower.includes("detailed project report") ||
        lower.includes("finalize business") ||
        lower.includes("confirm business") ||
        lower.includes("submit business");

      let reverseRecs: ReverseFeasibilityRecommendation[] | undefined = undefined;
      if (isReverseFeasibility) {
        try {
          reverseRecs = await apiClient.reverseFeasibility(capital || 100000, locality || "Bassi", stateName || "Rajasthan");
        } catch {}
      }

      const promptToSend = attachments && attachments.length > 0
        ? `${text ? `${text}\n` : ""}[User attached ${attachments.length} file(s): ${attachments.map(a => `${a.name} (${a.size})`).join(", ")}]`
        : text;

      const result = await apiClient.textChat(promptToSend, language);

      if (result.active_business) {
        if (result.active_business.business_idea) setBusinessIdea(result.active_business.business_idea);
        if (result.active_business.capital) setCapital(Number(result.active_business.capital));
        if (result.active_business.locality) setLocality(result.active_business.locality);
        if (result.active_business.state) setStateName(result.active_business.state);
        if (result.active_business.enterprise_name) setEnterpriseName(result.active_business.enterprise_name);
      }

      const dprUnlocked = isDpr || Boolean(result.tool_used?.includes("tool_06_generate_dpr"));

      addMessage({
        role: "agent",
        text: result.agent_response,
        audioBase64: result.voice_audio_base64,
        toolUsed: result.tool_used,
        reverseRecs,
        showProceedToDashboard: dprUnlocked,
      });

      if (autoSpeak && result.voice_audio_base64) {
        playAudio(result.voice_audio_base64);
      }
    } catch {
      addMessage({
        role: "agent",
        text: `I have received your inquiry: "${displayText}". The Sahaay AI Advisor engine computes local market feasibility, deterministic government subsidies (PMEGP, MUDRA, PMFME), and bank loan schedules for ${businessIdea} in ${locality}, ${stateName}.`,
        toolUsed: ["advisor_engine"],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectBusinessIdea = (bizName: string) => {
    setBusinessIdea(bizName);
    handleTriggerQuery(
      `I want to evaluate and proceed with ${bizName} in ${locality}, ${stateName} with capital ₹${capital.toLocaleString("en-IN")}. Provide feasibility and scheme subsidy matching.`
    );
  };

  const handleConfirmAndSubmitDpr = () => {
    setIsDprConfirmed(true);
    setActiveView("dashboard");
  };

  const handleResetChat = () => {
    const name = currentUser?.full_name ? ` ${currentUser.full_name}` : "";
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "agent",
        text: `Namaste${name}! Conversation refreshed. Tell me your business idea, location, and available capital to evaluate feasibility, government schemes, or DPR requirements.`,
        timestamp: Date.now(),
        toolUsed: ["greeting"],
      },
    ]);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveView("home");
    // Set a single clean welcome message
    setMessages([
      {
        id: `login-welcome-${Date.now()}`,
        role: "agent",
        text: `Namaste ${user.full_name}! Welcome to Sahaay. Your session is active and verified. Tell me your business idea or question, and we'll evaluate feasibility and relevant schemes right away.`,
        timestamp: Date.now(),
        toolUsed: ["welcome"],
      },
    ]);
  };

  // Show login page first when user lands unauthenticated
  if (isHydrated && !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Sub-view: Feasibility Matrix Flow (Receives live synchronized parameters)
  if (activeView === "feasibility") {
    return (
      <FeasibilityMatrixFlow
        onBackToHome={() => setActiveView("home")}
        onProceedToSchemes={() => {
          setActiveView("schemes");
        }}
        onProceedToDpr={() => {
          handleTriggerQuery(`Generate a Detailed Project Report (DPR) for ${businessIdea} in ${locality} with margin money ₹${capital}.`);
          setActiveView("home");
        }}
        initialLocality={locality}
        initialState={stateName}
        initialCapital={capital}
        initialBusinessIdea={businessIdea}
      />
    );
  }

  // Sub-view: Scheme Calculator Flow (Receives live synchronized parameters)
  if (activeView === "schemes") {
    return (
      <SchemeCalculatorFlow
        onBackToHome={() => setActiveView("home")}
        onProceedToFeasibility={() => {
          setActiveView("feasibility");
        }}
        onProceedToDpr={() => {
          handleTriggerQuery(`Generate a Detailed Project Report (DPR) for ${businessIdea} in ${locality} with margin money ₹${capital}.`);
          setActiveView("home");
        }}
        initialCapital={capital}
        initialBusinessIdea={businessIdea}
        initialLocality={locality}
        initialState={stateName}
      />
    );
  }

  // Sub-view: Cluster Network Flow (Receives live synchronized parameters)
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
          handleTriggerQuery(`Generate a Detailed Project Report (DPR) for ${businessIdea} in ${locality} with margin money ₹${capital}.`);
          setActiveView("home");
        }}
        initialLocality={locality}
        initialBusinessIdea={businessIdea}
      />
    );
  }

  // Sub-view: Personal Dashboard (Accessible only after user confirms business idea & generates DPR)
  if (activeView === "dashboard") {
    return (
      <PersonalDashboardView
        currentUser={currentUser}
        onBackToHome={() => setActiveView("home")}
        onLogout={handleLogout}
        onOpenSchemes={() => setActiveView("schemes")}
        onOpenFeasibility={() => setActiveView("feasibility")}
        onOpenExplore={() => setActiveView("cluster")}
        businessIdea={businessIdea}
        locality={locality}
        state={stateName}
        capital={capital}
        enterpriseName={enterpriseName || (currentUser?.full_name ? `${currentUser.full_name}'s Enterprise` : `${locality} Enterprise`)}
      />
    );
  }

  // Default Primary View: Home Page with INLINE CHAT directly on homepage (NO redirect to a separate chat page)
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
      onSearchSubmit={(query, attachments) => {
        handleTriggerQuery(query, attachments);
      }}
      onSelectCapability={(capability, promptText) => {
        if (capability === "dpr") {
          handleTriggerQuery(promptText);
        } else {
          setActiveView(capability);
        }
      }}
      onNavigate={(view) => {
        setActiveView(view);
      }}
      messages={messages}
      isProcessing={isProcessing}
      onPlayAudio={playAudio}
      onSelectBusinessIdea={handleSelectBusinessIdea}
      onConfirmAndSubmitDpr={handleConfirmAndSubmitDpr}
      onResetChat={handleResetChat}
      isDprConfirmed={isDprConfirmed}
      activeBusinessIdea={businessIdea}
      activeLocality={locality}
      activeCapital={capital}
      autoSpeak={autoSpeak}
      onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
    />
  );
}
