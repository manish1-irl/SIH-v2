// Browser-native Web Speech API utilities for Sahaay Hyper-Local AI Business Advisor
// Supports SpeechRecognition (voice input across 12 Indian languages) and SpeechSynthesis (voice readout)

export const LANG_CODE_MAP: Record<string, string> = {
  hi: "hi-IN",
  en: "en-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
};

export function getWebSpeechLangCode(lang: string): string {
  return LANG_CODE_MAP[lang] || "hi-IN";
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Clean markdown and technical symbols from text to ensure natural, pleasant speech
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/[*_~`#]/g, "") // Remove bold, italic, headings, code formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace markdown links [label](url) with label
    .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, "रुपये $1") // Make currency pronounceable
    .replace(/[•\-\+]\s+/g, "") // Remove bullet dashes
    .replace(/\s{2,}/g, " ") // Normalize spaces
    .trim();
}

/**
 * Speak text using browser native SpeechSynthesis with language matching
 */
export function speakText(
  text: string,
  lang: string = "hi",
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    onEnd?.();
    return null;
  }

  try {
    stopSpeaking();
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      onEnd?.();
      return null;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    const targetLangCode = getWebSpeechLangCode(lang);
    utterance.lang = targetLangCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick appropriate voice for the language if installed
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.toLowerCase() === targetLangCode.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().includes("in"));

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (e) => {
      // Ignore cancellation events
      if ((e as any).error === "canceled" || (e as any).error === "interrupted") {
        onEnd?.();
        return;
      }
      onError?.(e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    onError?.(err);
    onEnd?.();
    return null;
  }
}

export interface SpeechRecognizerHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export interface SpeechRecognizerOptions {
  useInterim?: boolean;
  overrideLang?: string;
  isRetry?: boolean;
}

/**
 * Check if the current browser is Brave
 */
export async function isBraveBrowser(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const nav = navigator as any;
    if (nav.brave && typeof nav.brave.isBrave === "function") {
      return await nav.brave.isBrave();
    }
  } catch {}
  return false;
}

/**
 * Create a cross-browser SpeechRecognizer instance using Web Speech API
 * Includes automatic self-healing fallback when encountering network resets or unsupported streaming
 */
export function createSpeechRecognizer(
  lang: string,
  handlers: SpeechRecognizerHandlers,
  options?: SpeechRecognizerOptions
): any | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    const useInterim = options?.useInterim !== false;
    recognition.interimResults = useInterim;
    recognition.maxAlternatives = 1;

    // Use requested language or fallback
    const targetLangCode = options?.overrideLang || getWebSpeechLangCode(lang);
    recognition.lang = targetLangCode;

    let hasReceivedResult = false;
    let fallbackTriggered = false;

    recognition.onresult = (event: any) => {
      hasReceivedResult = true;
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        handlers.onResult(final.trim(), true);
      } else if (interim) {
        handlers.onResult(interim.trim(), false);
      }
    };

    recognition.onerror = async (event: any) => {
      const err = event.error || "unknown";

      if (err === "no-speech") {
        handlers.onError("No speech detected. Please speak closer to your microphone.");
        return;
      }

      if (err === "not-allowed") {
        handlers.onError("Microphone permission denied. Please allow microphone access in your browser.");
        return;
      }

      if (err === "aborted") {
        return;
      }

      if (err === "network") {
        // First attempt fallback: if interim streaming failed on regional language,
        // retry once in non-interim buffered mode with standard English (en-IN / navigator.language)
        if (!options?.isRetry && !fallbackTriggered && !hasReceivedResult) {
          fallbackTriggered = true;
          try {
            recognition.abort();
          } catch {}

          const fallbackLang = targetLangCode.startsWith("en")
            ? (typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US")
            : "en-IN";

          const fallbackRecognizer = createSpeechRecognizer(lang, handlers, {
            useInterim: false,
            overrideLang: fallbackLang,
            isRetry: true,
          });

          if (fallbackRecognizer) {
            try {
              fallbackRecognizer.start();
              return;
            } catch {}
          }
        }

        // If fallback also failed or cannot be started, provide actionable diagnosis
        const isBrave = await isBraveBrowser();
        if (isBrave) {
          handlers.onError(
            "Brave Browser blocks Google speech services by default. To enable: open brave://settings/system and turn ON 'Use Google services for speech recognition', or open Sahaay in Google Chrome / Microsoft Edge."
          );
        } else {
          handlers.onError(
            "Speech recognition network error: Google speech servers could not be reached. If you have an ad-blocker (uBlock Origin, AdGuard), VPN, or firewall blocking speech services, please allow them or type your query directly."
          );
        }
        return;
      }

      handlers.onError(`Speech recognition error: ${err}`);
    };

    recognition.onend = () => {
      if (!fallbackTriggered) {
        handlers.onEnd();
      }
    };

    return recognition;
  } catch {
    return null;
  }
}

