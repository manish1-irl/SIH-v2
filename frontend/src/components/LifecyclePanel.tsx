import React from "react";
import { HealthMetric, RiskAlert } from "@/types";
import { Heart, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface LifecyclePanelProps {
  healthScore: number;
  healthMetrics: HealthMetric[];
  riskAlerts: RiskAlert[];
  nextActions: string[];
  daysSinceLaunch: number;
}

export function LifecyclePanel({ healthScore, healthMetrics, riskAlerts, nextActions, daysSinceLaunch }: LifecyclePanelProps) {
  const scoreColor = healthScore >= 70 ? "text-antigravity-sage" : healthScore >= 50 ? "text-antigravity-orange" : "text-red-500";
  const scoreBg = healthScore >= 70 ? "bg-antigravity-sage" : healthScore >= 50 ? "bg-antigravity-orange" : "bg-red-500";

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4 flex items-center gap-2">
        <Heart className="w-6 h-6 text-antigravity-sage" /> Business Lifecycle Health
      </h2>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke={healthScore >= 70 ? "#87A96B" : healthScore >= 50 ? "#D96B27" : "#ef4444"}
              strokeWidth="3" strokeDasharray={`${healthScore}, 100`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-serif text-xl font-bold ${scoreColor}`}>{healthScore}</span>
          </div>
        </div>
        <div>
          <span className="font-sans text-xs text-antigravity-navy/60 block">Days Since Launch</span>
          <span className="font-serif text-2xl font-bold text-antigravity-navy">{daysSinceLaunch}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider block mb-2">Health Metrics</span>
          <div className="grid grid-cols-2 gap-2">
            {healthMetrics.map((m, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">{m.metric_name}</span>
                <div className="flex items-center gap-1">
                  <span className="font-serif text-sm font-bold text-antigravity-navy">{m.current_value}{m.unit}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${m.status === "on_track" ? "bg-antigravity-sage" : m.status === "warning" ? "bg-antigravity-orange" : "bg-red-500"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {riskAlerts.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <span className="font-sans text-xs font-semibold text-red-600 flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Risk Alerts ({riskAlerts.length})
            </span>
            {riskAlerts.map((alert, i) => (
              <div key={i} className="mt-1.5 text-xs font-sans text-red-800">
                <span className="font-semibold">[{alert.severity.toUpperCase()}]</span> {alert.message}
              </div>
            ))}
          </div>
        )}
        <div>
          <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider block mb-2">Next Actions</span>
          <ul className="space-y-1">
            {nextActions.map((action, i) => (
              <li key={i} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                <Clock className="w-3 h-3 text-antigravity-sage mt-0.5 shrink-0" /> {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
