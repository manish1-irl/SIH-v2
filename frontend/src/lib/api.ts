import {
  BusinessAdvisorRequest,
  FeasibilityReportResponse,
  ReverseFeasibilityRecommendation,
  BusinessGoal,
  ConcessionalLoanRequest,
  ConcessionalLoanResponse,
  ClusterNetworkRequest,
  ClusterNetworkResponse,
  PersonalDashboardData,
  GenerateGoalRequest,
  AIBusinessGoal,
} from "@/types";
import { offlineDb } from "./db";

const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".local"));

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (isLocalHost || process.env.NODE_ENV !== "production"
    ? "http://localhost:8000"
    : "https://sih-v2-2yz4.onrender.com");

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

  async calculateConcessionalLoan(data: ConcessionalLoanRequest): Promise<ConcessionalLoanResponse> {
    const res = await fetch(`${API_BASE}/api/v1/advisor/concessional-calculator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Concessional calculator error ${res.status}`);
    return res.json();
  },

  async getClusterNetwork(data: ClusterNetworkRequest): Promise<ClusterNetworkResponse> {
    const res = await fetch(`${API_BASE}/api/v1/clusters/network`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Cluster network error ${res.status}`);
    return res.json();
  },

  async reverseFeasibility(capital: number, location: string, state: string = "Rajasthan"): Promise<ReverseFeasibilityRecommendation[]> {
    const res = await fetch(`${API_BASE}/api/v1/advisor/reverse-feasibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capital,
        location,
        state,
        business_idea: "General",
      }),
    });
    if (!res.ok) throw new Error(`Reverse feasibility error ${res.status}`);
    return res.json();
  },

  async getPersonalDashboard(params?: {
    locality?: string;
    state?: string;
    business_idea?: string;
    capital?: number;
    enterprise_name?: string;
  }): Promise<PersonalDashboardData> {
    const query = new URLSearchParams();
    if (params?.locality) query.append("locality", params.locality);
    if (params?.state) query.append("state", params.state);
    if (params?.business_idea) query.append("business_idea", params.business_idea);
    if (params?.capital) query.append("capital", params.capital.toString());
    if (params?.enterprise_name) query.append("enterprise_name", params.enterprise_name);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/api/v1/lifecycle/dashboard${qs}`);
    if (!res.ok) throw new Error(`Personal dashboard error ${res.status}`);
    return res.json();
  },

  async generateNextGoal(data: GenerateGoalRequest): Promise<AIBusinessGoal> {
    const res = await fetch(`${API_BASE}/api/v1/lifecycle/generate-next-goal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Generate next goal error ${res.status}`);
    return res.json();
  },

  async getSession(userId: string = "web-user") {
    try {
      const res = await fetch(`${API_BASE}/api/v1/advisor/session/${userId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateSession(userId: string = "web-user", data: any) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/advisor/session/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async respondToReminder(reminderId: string, action: string): Promise<{ reminder_id: string; action: string; updated_status: string; ai_advice: string }> {
    const res = await fetch(`${API_BASE}/api/v1/lifecycle/reminders/${reminderId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(`Reminder response error ${res.status}`);
    return res.json();
  },
};

