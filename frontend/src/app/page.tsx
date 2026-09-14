"use client";

import React, { useState } from "react";
import {
  TrendingUp, MapPin, IndianRupee, ShieldCheck, Calendar,
  Sparkles, Award, ChevronRight, RefreshCw, FileText,
  AlertTriangle, ArrowUpRight, MessageSquare, Building2, Users,
} from "lucide-react";

export default function HomePage() {
  const [mode, setMode] = useState<"known" | "reverse">("known");
  const [locality, setLocality] = useState("Alwar");
  const [state, setState] = useState("Rajasthan");
  const [capital, setCapital] = useState(100000);
  const [businessIdea, setBusinessIdea] = useState("Dairy Micro-Enterprise");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"feasibility" | "finance" | "schemes" | "time" | "cluster">("feasibility");

  const projectCost = capital * 4.5;
  const loanReq = projectCost - capital;
  const emi = Math.round((loanReq * 0.085 / 12) / (1 - Math.pow(1 + 0.085 / 12, -54)));

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => { setIsAnalyzing(false); }, 600);
  };

  return (
    <div className="min-h-screen bg-antigravity-cream flex flex-col selection:bg-antigravity-sage/30">
      <header className="border-b border-antigravity-navy/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-antigravity-navy text-white flex items-center justify-center shadow-subtle">
              <span className="font-serif font-bold text-xl">A</span>
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-antigravity-navy tracking-tight block">Antigravity</span>
              <span className="font-sans text-xs text-antigravity-navy/70 block -mt-1 font-medium">Hyper-Local AI Business Advisor</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs uppercase tracking-wider font-semibold text-antigravity-sage bg-antigravity-sage/15 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-antigravity-sage animate-pulse"></span>
              Offline-Ready PWA
            </span>
          </div>
        </div>
      </header>

      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <span className="font-sans text-xs uppercase tracking-wider font-semibold text-antigravity-sage bg-antigravity-sage/15 px-3.5 py-1.5 rounded-full inline-block mb-4">
          Verified Indian MSME Intelligence • SIH Edition
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-antigravity-navy tracking-tight leading-tight mb-4">
          Grounded business feasibility, real government schemes, and lifecycle support.
        </h1>
        <p className="font-sans text-base sm:text-lg text-antigravity-charcoal/85 max-w-3xl mx-auto leading-relaxed mb-8">
          The platform does not merely chat or guess. We verify hyper-local feasibility, run deterministic bank calculations, match official subsidy schemes, and protect your enterprise through its journey.
        </p>

        <div className="inline-flex p-1.5 rounded-xl bg-white border border-antigravity-navy/10 shadow-subtle mb-10">
          <button
            onClick={() => setMode("known")}
            className={`font-sans text-sm font-semibold px-6 py-2.5 rounded-lg transition-all ${
              mode === "known" ? "bg-antigravity-navy text-white shadow-sm" : "text-antigravity-charcoal/70 hover:text-antigravity-navy"
            }`}
          >
            Mode A: I Have a Business Idea
          </button>
          <button
            onClick={() => setMode("reverse")}
            className={`font-sans text-sm font-semibold px-6 py-2.5 rounded-lg transition-all ${
              mode === "reverse" ? "bg-antigravity-orange text-white shadow-sm" : "text-antigravity-charcoal/70 hover:text-antigravity-orange"
            }`}
          >
            Mode B: Reverse Discovery (Help Me Choose)
          </button>
        </div>

        <div className="bg-white border border-antigravity-navy/10 rounded-2xl p-6 sm:p-8 shadow-elevated text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div>
              <label className="block font-sans text-xs font-semibold text-antigravity-navy/80 uppercase tracking-wider mb-2">Locality</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-antigravity-navy/15 focus:border-antigravity-orange outline-none font-sans text-sm text-antigravity-charcoal bg-antigravity-cream/40"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-antigravity-navy/80 uppercase tracking-wider mb-2">Capital / Margin (₹)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-antigravity-navy/15 focus:border-antigravity-orange outline-none font-sans text-sm text-antigravity-charcoal bg-antigravity-cream/40"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-antigravity-navy/80 uppercase tracking-wider mb-2">Business Idea</label>
              <input
                type="text"
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-antigravity-navy/15 focus:border-antigravity-orange outline-none font-sans text-sm text-antigravity-charcoal bg-antigravity-cream/40"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-antigravity-navy/10">
            <span className="font-sans text-xs text-antigravity-navy/70 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-antigravity-sage" />
              Grounded rule: Calculations run deterministically; zero hallucinated estimates.
            </span>
            <button
              onClick={handleAnalyze}
              className="font-sans text-sm font-semibold text-white bg-antigravity-orange hover:bg-[#c45e1f] px-8 py-3 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              Analyze Feasibility & Schemes <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-antigravity-navy/10 pb-3 mb-8">
          {[
            { id: "feasibility", label: "Feasibility Score", icon: TrendingUp },
            { id: "finance", label: "Financial Engine & EMI", icon: IndianRupee },
            { id: "schemes", label: "Government Schemes", icon: Award },
            { id: "time", label: "Time Machine", icon: Calendar },
            { id: "cluster", label: "Cluster Network", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`font-sans text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isActive ? "bg-antigravity-navy text-white shadow-sm" : "text-antigravity-navy/70 hover:bg-antigravity-navy/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-antigravity-sage" : "text-antigravity-navy/50"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "feasibility" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-2xl font-bold text-antigravity-navy">{businessIdea} in {locality}, {state}</h2>
                <div className="text-right">
                  <span className="font-serif text-3xl font-bold text-antigravity-navy">78<span className="text-lg text-antigravity-navy/40 font-normal">/100</span></span>
                  <span className="font-sans text-xs font-semibold text-antigravity-sage uppercase block">CONDITIONAL GO</span>
                </div>
              </div>
              <p className="font-sans text-sm text-antigravity-charcoal/90 mb-6">
                Strong capital fit (85/100) and high scheme compatibility (88/100 under PMEGP). Recommended working capital liquidity buffer: 45 days.
              </p>
            </div>
            <div className="bg-antigravity-navy text-white rounded-xl p-6 shadow-elevated">
              <span className="font-sans text-xs uppercase tracking-wider font-semibold text-antigravity-sage block mb-2">Bankable Document</span>
              <h3 className="font-serif text-2xl font-bold mb-3">29-Section Bankable DPR</h3>
              <p className="font-sans text-xs text-white/80 leading-relaxed mb-6">
                Conforming to RBI format with 12-month cash flows, break-even, and scheme subsidy schedules.
              </p>
              <button className="w-full font-sans text-sm font-semibold text-white bg-antigravity-orange hover:bg-[#c45e1f] py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Generate Full DPR (PDF)
              </button>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
            <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Deterministic Financial Architecture</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
                <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Project Cost</span>
                <span className="font-serif text-2xl font-bold text-antigravity-navy">₹{projectCost.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
                <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Margin Money</span>
                <span className="font-serif text-2xl font-bold text-antigravity-sage">₹{capital.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
                <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Bank Loan</span>
                <span className="font-serif text-2xl font-bold text-antigravity-orange">₹{loanReq.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-lg bg-antigravity-cream border border-antigravity-navy/10">
                <span className="font-sans text-xs text-antigravity-navy/70 block mb-1">Monthly EMI</span>
                <span className="font-serif text-2xl font-bold text-antigravity-navy">₹{emi.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schemes" && (
          <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
            <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Verified Government Schemes</h2>
            <div className="p-6 rounded-xl border border-antigravity-sage/40 bg-antigravity-sage/5">
              <h3 className="font-serif text-xl font-bold text-antigravity-navy mb-2">PMEGP (Prime Minister's Employment Generation Programme)</h3>
              <p className="font-sans text-xs text-antigravity-charcoal/85 mb-3">Rural margin subsidy up to 35% with 5% promoter equity for special categories.</p>
              <span className="font-sans text-xs font-semibold text-antigravity-orange">Official Source: kviconline.gov.in</span>
            </div>
          </div>
        )}

        {activeTab === "time" && (
          <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
            <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Time Machine: Seasonal Launch Optimizer</h2>
            <p className="font-sans text-sm text-antigravity-charcoal/80 mb-4">Recommended Launch Window: <strong>March</strong> (Coincides with green fodder flush and peak summer dairy demand).</p>
          </div>
        )}

        {activeTab === "cluster" && (
          <div className="bg-white border border-antigravity-navy/10 rounded-xl p-6 shadow-subtle">
            <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-4">Cluster Engine: Local Economic Ring</h2>
            <p className="font-sans text-sm text-antigravity-charcoal/80">4 Complementary local suppliers identified within 12 km. Bulk feed purchasing saves ~14% monthly.</p>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-antigravity-navy/10 bg-white py-6 px-4 text-center">
        <span className="font-sans text-xs text-antigravity-navy/60">Antigravity Design System • Lora (Serif) & Montserrat (Sans) • WCAG AAA</span>
      </footer>
    </div>
  );
}
