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

/**
 * Create a cross-browser SpeechRecognizer instance using Web Speech API
 */
export function createSpeechRecognizer(
  lang: string,
  handlers: SpeechRecognizerHandlers
): any | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = getWebSpeechLangCode(lang);

    recognition.onresult = (event: any) => {
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

    recognition.onerror = (event: any) => {
      const err = event.error || "unknown";
      if (err === "no-speech") {
        handlers.onError("No speech detected. Please speak closer to your microphone.");
      } else if (err === "not-allowed") {
        handlers.onError("Microphone permission denied. Please allow microphone access in your browser.");
      } else if (err !== "aborted") {
        handlers.onError(`Speech recognition error: ${err}`);
      }
    };

    recognition.onend = () => {
      handlers.onEnd();
    };

    return recognition;
  } catch {
    return null;
  }
}
