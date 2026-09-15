import React from "react";
import { SchemeRecommendation } from "@/types";
import { ExternalLink, FileCheck } from "lucide-react";

interface SchemeCardProps {
  schemes: SchemeRecommendation[];
}

export function SchemeCard({ schemes }: SchemeCardProps) {
  if (!schemes.length) {
    return (
      <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
        <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Verified Government Schemes</h2>
        <p className="font-sans text-sm text-antigravity-charcoal/80">No matching schemes found for this configuration.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Verified Government Schemes</h2>
      <div className="space-y-4">
        {schemes.map((scheme, i) => (
          <div key={i} className="p-5 rounded-xl border border-antigravity-sage/40 bg-antigravity-sage/5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-antigravity-navy">{scheme.scheme_name}</h3>
              <span className="font-sans text-xs font-semibold text-antigravity-sage bg-antigravity-sage/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> {scheme.eligibility_status}
              </span>
            </div>
            <p className="font-sans text-xs text-antigravity-charcoal/80 mb-3">{scheme.ministry}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {scheme.subsidy_percentage > 0 && (
                <div className="p-2.5 rounded-lg bg-white border border-antigravity-navy/10">
                  <span className="font-sans text-[10px] text-antigravity-navy/60 block">Subsidy</span>
                  <span className="font-serif text-sm font-bold text-antigravity-sage">{scheme.subsidy_percentage}%</span>
                </div>
              )}
              {scheme.max_subsidy_amount > 0 && (
                <div className="p-2.5 rounded-lg bg-white border border-antigravity-navy/10">
                  <span className="font-sans text-[10px] text-antigravity-navy/60 block">Max Subsidy</span>
                  <span className="font-serif text-sm font-bold text-antigravity-sage">₹{scheme.max_subsidy_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="p-2.5 rounded-lg bg-white border border-antigravity-navy/10">
                <span className="font-sans text-[10px] text-antigravity-navy/60 block">Margin Required</span>
                <span className="font-serif text-sm font-bold text-antigravity-orange">{scheme.margin_required_percent}%</span>
              </div>
            </div>
            {scheme.why_matched.length > 0 && (
              <div className="mb-3">
                <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider">Why Matched</span>
                <ul className="mt-1 space-y-0.5">
                  {scheme.why_matched.map((reason, j) => (
                    <li key={j} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                      <span className="text-antigravity-sage mt-0.5">•</span> {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {scheme.required_documents.map((doc, j) => (
                <span key={j} className="font-sans text-[10px] bg-antigravity-navy/5 text-antigravity-navy/70 px-2 py-0.5 rounded">{doc}</span>
              ))}
            </div>
            <p className="font-sans text-[10px] text-antigravity-navy/60">{scheme.application_process}</p>
            <a href={scheme.official_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 font-sans text-xs font-semibold text-antigravity-orange hover:underline">
              Official Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
