import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ScoreCardProps {
  title: string;
  value: number;
  max?: number;
  suffix?: string;
  icon: LucideIcon;
  color?: "navy" | "sage" | "orange";
  className?: string;
}

export function ScoreCard({ title, value, max = 100, suffix = "", icon: Icon, color = "navy", className }: ScoreCardProps) {
  const colorMap = {
    navy: "bg-antigravity-navy text-white",
    sage: "bg-antigravity-sage text-white",
    orange: "bg-antigravity-orange text-white",
  };
  const bgColor = colorMap[color];

  return (
    <div className={cn("rounded-xl p-5 border border-antigravity-navy/10 bg-white shadow-subtle", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-sans text-xs font-semibold text-antigravity-navy/70 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-3xl font-bold text-antigravity-navy">{value}</span>
        <span className="font-sans text-sm text-antigravity-navy/40">/ {max}{suffix}</span>
      </div>
    </div>
  );
}
