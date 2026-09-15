import {
  BusinessAdvisorRequest,
  FeasibilityReportResponse,
  ReverseFeasibilityRecommendation,
  BusinessGoal,
} from "@/types";
import { offlineDb } from "./db";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = {
  async getVoiceStatus() {
    const res = await fetch(`${API_BASE}/api/v1/voice/status`);
    return res.json();
  },

  async getLanguages() {
    const res = await fetch(`${API_BASE}/api/v1/voice/languages`);
    return res.json();
  },

  async voiceChat(audioBase64: string, language: string, userId: string = "web-user") {
    const res = await fetch(`${API_BASE}/api/v1/voice/voice-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        audio_base64: audioBase64,
        language,
      }),
    });
    if (!res.ok) throw new Error(`Voice chat error ${res.status}`);
    return res.json();
  },

  async textChat(message: string, language: string, userId: string = "web-user") {
    const res = await fetch(`${API_BASE}/api/v1/voice/voice-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        message,
        language,
      }),
    });
    if (!res.ok) throw new Error(`Chat error ${res.status}`);
    return res.json();
  },

  async textToSpeech(text: string, language: string) {
    const res = await fetch(`${API_BASE}/api/v1/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.audio_base64 || null;
  },

  async analyzeBusinessVoice(message: string, language: string) {
    const res = await fetch(`${API_BASE}/api/v1/voice/analyze-voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language }),
    });
    if (!res.ok) throw new Error(`Analysis error ${res.status}`);
    return res.json();
  },

  async analyzeBusiness(data: BusinessAdvisorRequest): Promise<FeasibilityReportResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/advisor/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const result: FeasibilityReportResponse = await res.json();
      try {
        await offlineDb.reports.put(result);
      } catch {}
      return result;
    } catch (networkError) {
      const cached = await offlineDb.reports.toCollection().last();
      if (cached) return cached;
      throw networkError;
    }
  },

  async chat(query: string) {
    const res = await fetch(`${API_BASE}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Chat error ${res.status}`);
    return res.json();
  },
};
