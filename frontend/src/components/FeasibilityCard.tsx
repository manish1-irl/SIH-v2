import React from "react";
import { FeasibilityScores } from "@/types";
import { TrendingUp, ShieldCheck } from "lucide-react";

interface FeasibilityCardProps {
  scores: FeasibilityScores;
  businessIdea: string;
  locality: string;
  state: string;
}

export function FeasibilityCard({ scores, businessIdea, locality, state }: FeasibilityCardProps) {
  const verdictColors: Record<string, string> = {
    "GO": "text-antigravity-sage",
    "CONDITIONAL GO": "text-antigravity-orange",
    "RECONSIDER": "text-amber-600",
    "DO NOT PROCEED": "text-red-500",
  };
  const verdictBg: Record<string, string> = {
    "GO": "bg-antigravity-sage/15",
    "CONDITIONAL GO": "bg-antigravity-orange/15",
    "RECONSIDER": "bg-amber-100",
    "DO NOT PROCEED": "bg-red-100",
  };

  const breakdownItems = [
    { label: "Capital Fit", value: scores.capital_fit },
    { label: "Market Score", value: scores.market_score },
    { label: "Scheme Fit", value: scores.scheme_fit },
    { label: "Supply Chain", value: scores.supply_score },
    { label: "Competition", value: scores.competition_score },
    { label: "Risk Profile", value: scores.risk_score },
  ];

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-antigravity-navy">{businessIdea} in {locality}, {state}</h2>
        <div className="text-right">
          <span className="font-serif text-3xl font-bold text-antigravity-navy">{scores.overall_score}<span className="text-lg text-antigravity-navy/40 font-normal">/100</span></span>
          <span className={`font-sans text-xs font-semibold uppercase block ${verdictColors[scores.verdict] || "text-antigravity-navy"}`}>
            {scores.verdict}
          </span>
        </div>
      </div>
      <p className="font-sans text-sm text-antigravity-charcoal/90 mb-5">{scores.verdict_explanation}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {breakdownItems.map((item) => (
          <div key={item.label} className="p-3 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
            <span className="font-sans text-[10px] text-antigravity-navy/60 block mb-1">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-antigravity-navy">{item.value}</span>
              <div className="flex-1 h-1.5 rounded-full bg-antigravity-navy/10 overflow-hidden">
                <div className="h-full rounded-full bg-antigravity-sage" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
