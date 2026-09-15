import React from "react";
import { ReverseFeasibilityRecommendation } from "@/types";
import { Sparkles, TrendingUp } from "lucide-react";

interface ReverseDiscoveryProps {
  recommendations: ReverseFeasibilityRecommendation[];
}

export function ReverseDiscovery({ recommendations }: ReverseDiscoveryProps) {
  const fitColors: Record<string, string> = {
    "High": "text-antigravity-sage",
    "Medium-High": "text-antigravity-sage",
    "Medium": "text-antigravity-orange",
    "Low-Medium": "text-amber-600",
    "Low": "text-red-500",
  };

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-2 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-antigravity-orange" /> Reverse Discovery Recommendations
      </h2>
      <p className="font-sans text-sm text-antigravity-charcoal/80 mb-5">Based on your capital and locality, here are the top business ideas ranked by feasibility.</p>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="p-5 rounded-xl border border-antigravity-navy/10 bg-antigravity-cream/40 hover:shadow-subtle transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-serif text-lg font-bold text-antigravity-navy">{rec.business}</h3>
                <span className="font-sans text-xs text-antigravity-navy/60">{rec.category}</span>
              </div>
              <div className="text-right">
                <span className="font-serif text-2xl font-bold text-antigravity-navy">{rec.score}</span>
                <span className="font-sans text-[10px] text-antigravity-navy/40 block">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded bg-white border border-antigravity-navy/10 text-center">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Capital</span>
                <span className={`font-sans text-xs font-semibold ${fitColors[rec.capital_fit] || "text-antigravity-navy"}`}>{rec.capital_fit}</span>
              </div>
              <div className="p-2 rounded bg-white border border-antigravity-navy/10 text-center">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Market</span>
                <span className={`font-sans text-xs font-semibold ${fitColors[rec.market_fit] || "text-antigravity-navy"}`}>{rec.market_fit}</span>
              </div>
              <div className="p-2 rounded bg-white border border-antigravity-navy/10 text-center">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Risk</span>
                <span className="font-sans text-xs font-semibold text-antigravity-navy">{rec.risk_level}</span>
              </div>
            </div>
            <ul className="space-y-1">
              {rec.reason.map((r, j) => (
                <li key={j} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-antigravity-sage mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
