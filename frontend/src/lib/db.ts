import Dexie, { type EntityTable } from "dexie";
import { FeasibilityReportResponse, BusinessGoal } from "@/types";

export interface OfflineAction {
  id?: number;
  action_type: string;
  payload: any;
  created_at: number;
  synced: boolean;
}

export interface CachedDPR {
  dpr_id: string;
  business_name: string;
  sections: Record<string, any>;
  saved_at: number;
}

export class AdvisorOfflineDatabase extends Dexie {
  reports!: EntityTable<FeasibilityReportResponse, "report_id">;
  goals!: EntityTable<BusinessGoal, "goal_id">;
  dprs!: EntityTable<CachedDPR, "dpr_id">;
  syncQueue!: EntityTable<OfflineAction, "id">;

  constructor() {
    super("HyperLocalAdvisorDB");
    this.version(1).stores({
      reports: "report_id, created_at",
      goals: "goal_id, status, priority",
      dprs: "dpr_id, saved_at",
      syncQueue: "++id, action_type, synced, created_at",
    });
  }
}

export const offlineDb = new AdvisorOfflineDatabase();
