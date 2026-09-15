import React from "react";
import { ReverseFeasibilityRecommendation } from "@/types";
import { Sparkles, TrendingUp } from "lucide-react";

interface ReverseDiscoveryProps {
  recommendations: ReverseFeasibilityRecommendation[];
  onSelectBusiness?: (businessName: string) => void;
}

export function ReverseDiscovery({ recommendations, onSelectBusiness }: ReverseDiscoveryProps) {
  const fitColors: Record<string, string> = {
    "High": "text-antigravity-sage",
    "Medium-High": "text-antigravity-sage",
    "Medium": "text-antigravity-orange",
    "Low-Medium": "text-amber-600",
    "Low": "text-red-500",
  };

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-2xl p-6 shadow-subtle">
      <h2 className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-antigravity-orange" /> Reverse Feasibility Recommendations
      </h2>
      <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/80 mb-5">
        Based on your available capital and locality demand gaps, here are the top viable business models ranked by hyper-local viability.
      </p>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="p-5 rounded-2xl border border-antigravity-navy/10 bg-antigravity-cream/40 hover:shadow-subtle transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-antigravity-navy">{rec.business}</h3>
                <span className="font-sans text-xs text-antigravity-navy/60">{rec.category}</span>
              </div>
              <div className="text-right">
                <span className="font-serif text-2xl font-bold text-antigravity-navy">{rec.score}</span>
                <span className="font-sans text-[10px] text-antigravity-navy/40 block">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-xl bg-white border border-antigravity-navy/10 text-center">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Capital Fit</span>
                <span className={`font-sans text-xs font-semibold ${fitColors[rec.capital_fit] || "text-antigravity-navy"}`}>{rec.capital_fit}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-antigravity-navy/10 text-center">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Market Fit</span>
                <span className={`font-sans text-xs font-semibold ${fitColors[rec.market_fit] || "text-antigravity-navy"}`}>{rec.market_fit}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-antigravity-navy/10 text-center">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Risk Level</span>
                <span className="font-sans text-xs font-semibold text-antigravity-navy">{rec.risk_level}</span>
              </div>
            </div>
            <ul className="space-y-1 mb-3">
              {rec.reason.map((r, j) => (
                <li key={j} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-antigravity-sage mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
            {onSelectBusiness && (
              <button
                onClick={() => onSelectBusiness(rec.business)}
                className="w-full mt-2 py-2 px-4 rounded-xl bg-[#0A2540] hover:bg-[#D96B27] text-white font-sans text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Select & Analyze Feasibility Matrix</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

