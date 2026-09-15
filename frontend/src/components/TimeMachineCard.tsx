import React from "react";
import { TimeMachineOutput } from "@/types";
import { Calendar, AlertTriangle } from "lucide-react";

interface TimeMachineCardProps {
  data: TimeMachineOutput;
}

export function TimeMachineCard({ data }: TimeMachineCardProps) {
  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-antigravity-orange" /> Time Machine: Seasonal Launch Optimizer
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
          <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider block mb-1">Preparation Period</span>
          <span className="font-serif text-base font-bold text-antigravity-navy">{data.recommended_prep_period}</span>
        </div>
        <div className="p-4 rounded-lg bg-antigravity-orange/10 border border-antigravity-orange/30">
          <span className="font-sans text-[10px] font-semibold text-antigravity-orange uppercase tracking-wider block mb-1">Recommended Launch</span>
          <span className="font-serif text-base font-bold text-antigravity-orange">{data.recommended_launch_window}</span>
        </div>
        <div className="p-4 rounded-lg bg-antigravity-sage/10 border border-antigravity-sage/30">
          <span className="font-sans text-[10px] font-semibold text-antigravity-sage uppercase tracking-wider block mb-1">Peak Period</span>
          <span className="font-serif text-base font-bold text-antigravity-sage">{data.expected_peak_period}</span>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <span className="font-sans text-[10px] font-semibold text-red-500 uppercase tracking-wider block mb-1">Cashflow Warning</span>
          <span className="font-serif text-base font-bold text-red-600">{data.cashflow_warning_period}</span>
        </div>
      </div>
      {data.seasonal_risk_factors.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
          <span className="font-sans text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4" /> Seasonal Risk Factors
          </span>
          <ul className="space-y-1">
            {data.seasonal_risk_factors.map((risk, i) => (
              <li key={i} className="font-sans text-xs text-amber-800 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">•</span> {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
