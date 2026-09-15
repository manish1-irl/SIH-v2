import React from "react";
import { SWOTAnalysis } from "@/types";
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle } from "lucide-react";

interface SwotCardProps {
  swot: SWOTAnalysis;
}

export function SwotCard({ swot }: SwotCardProps) {
  const sections: Array<{ title: string; items: string[]; icon: React.ElementType; color: string; bg: string; border: string }> = [
    { title: "Strengths", items: swot.strengths, icon: TrendingUp, color: "text-antigravity-sage", bg: "bg-antigravity-sage/5", border: "border-antigravity-sage/30" },
    { title: "Weaknesses", items: swot.weaknesses, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
    { title: "Opportunities", items: swot.opportunities, icon: Lightbulb, color: "text-antigravity-orange", bg: "bg-antigravity-orange/5", border: "border-antigravity-orange/30" },
    { title: "Threats", items: swot.threats, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  ];

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">SWOT Analysis</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.title} className={`p-4 rounded-lg ${section.bg} border ${section.border}`}>
            <span className={`font-sans text-xs font-semibold ${section.color} flex items-center gap-1.5 mb-2 uppercase tracking-wider`}>
              <section.icon className="w-4 h-4" /> {section.title}
            </span>
            <ul className="space-y-1">
              {section.items.map((item, i) => (
                <li key={i} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                  <span className="text-antigravity-navy/30 mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
