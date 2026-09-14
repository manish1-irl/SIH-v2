import {
  BusinessAdvisorRequest,
  FeasibilityReportResponse,
  ReverseFeasibilityRecommendation,
  BusinessGoal,
} from "@/types";
import { offlineDb } from "./db";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = {
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
      } catch (err) {
        console.warn("IndexedDB cache save warning:", err);
      }
      return result;
    } catch (networkError) {
      console.warn("Network unavailable, attempting offline cache lookup...", networkError);
      const cached = await offlineDb.reports.toCollection().last();
      if (cached) return cached;
      throw networkError;
    }
  },

  async runReverseFeasibility(data: BusinessAdvisorRequest): Promise<ReverseFeasibilityRecommendation[]> {
    const res = await fetch(`${API_BASE}/api/v1/advisor/reverse-feasibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return res.json();
  },

  async getGoals(): Promise<BusinessGoal[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/business/goals`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const goals: BusinessGoal[] = await res.json();
      for (const g of goals) {
        await offlineDb.goals.put(g);
      }
      return goals;
    } catch {
      return await offlineDb.goals.toArray();
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
