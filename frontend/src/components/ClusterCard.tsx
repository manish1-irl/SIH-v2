import React from "react";
import { ClusterOpportunity } from "@/types";
import { Network, CheckCircle } from "lucide-react";

interface ClusterCardProps {
  clusters: ClusterOpportunity[];
}

export function ClusterCard({ clusters }: ClusterCardProps) {
  if (!clusters.length) {
    return (
      <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
        <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Cluster Engine: Local Economic Ring</h2>
        <p className="font-sans text-sm text-antigravity-charcoal/80">No cluster data available for this area.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
      <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4 flex items-center gap-2">
        <Network className="w-6 h-6 text-antigravity-sage" /> Cluster Engine: Local Economic Ring
      </h2>
      <div className="space-y-4">
        {clusters.map((cluster, i) => (
          <div key={i} className="p-5 rounded-xl border border-antigravity-navy/10 bg-antigravity-cream/40">
            <h3 className="font-serif text-lg font-bold text-antigravity-navy mb-3">{cluster.cluster_name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider block mb-2">Complementary Businesses</span>
                <ul className="space-y-1">
                  {cluster.complementary_businesses.map((biz, j) => (
                    <li key={j} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                      <span className="text-antigravity-sage mt-0.5">•</span> {biz}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider block mb-2">Shared Benefits</span>
                <ul className="space-y-1">
                  {cluster.shared_benefits.map((benefit, j) => (
                    <li key={j} className="font-sans text-xs text-antigravity-charcoal/85 flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-antigravity-sage mt-0.5 shrink-0" /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-antigravity-navy/10">
              <span className="font-sans text-[10px] font-semibold text-antigravity-navy/60 uppercase tracking-wider">
                Nearby Nodes: <span className="text-antigravity-sage font-bold">{cluster.nearby_nodes_count}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
