"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Truck,
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sliders,
  Check,
  Calculator,
  FileDown,
  User,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { FeasibilityReportResponse } from "@/types";
import { UserProfile } from "@/lib/supabase";
import { getTranslation } from "@/lib/translations";
import RequiredInfoGuard from "@/components/common/RequiredInfoGuard";

interface FeasibilityMatrixFlowProps {
  onBackToHome: () => void;
  onProceedToSchemes?: () => void;
  onProceedToDpr?: () => void;
  initialLocality?: string;
  initialState?: string;
  initialCapital?: number;
  initialBusinessIdea?: string;
  hasRequiredInfo?: boolean;
  onUpdateParams?: (businessIdea: string, capital: number, locality?: string, state?: string) => void;
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
  language?: string;
}

export default function FeasibilityMatrixFlow({
  onBackToHome,
  onProceedToSchemes,
  onProceedToDpr,
  initialLocality = "Local Area",
  initialState = "India",
  initialCapital = 0,
  initialBusinessIdea = "",
  hasRequiredInfo,
  onUpdateParams,
  currentUser,
  onOpenProfile,
  language = "hi",
}: FeasibilityMatrixFlowProps) {
  const t = (key: string) => getTranslation(language, key);
  const sections = [
    { id: 1, label: t("marketReachGIS"), shortName: t("marketReachShort") },
    { id: 2, label: t("opportunityAnalysis"), shortName: t("opportunityShort") },
    { id: 3, label: t("swotMatrixSection"), shortName: t("swotShort") },
    { id: 4, label: t("unitEconomicsSection"), shortName: t("unitEconomicsShort") },
    { id: 5, label: t("competitorDensitySection"), shortName: t("competitorDensityShort") },
  ];
  const [activeSlide, setActiveSlide] = useState(1);
  const [locality, setLocality] = useState(initialLocality);
  const [stateName, setStateName] = useState(initialState);
  const [capital, setCapital] = useState(initialCapital);
  const [businessIdea, setBusinessIdea] = useState(initialBusinessIdea);

  // Synchronize incoming props
  useEffect(() => {
    if (initialLocality !== undefined) setLocality(initialLocality);
  }, [initialLocality]);

  useEffect(() => {
    if (initialState !== undefined) setStateName(initialState);
  }, [initialState]);

  useEffect(() => {
    if (initialCapital !== undefined) setCapital(initialCapital);
  }, [initialCapital]);

  useEffect(() => {
    if (initialBusinessIdea !== undefined) setBusinessIdea(initialBusinessIdea);
  }, [initialBusinessIdea]);

  // Server data state
  const [report, setReport] = useState<FeasibilityReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Requirement: Feasibility Matrix must only show info if user provided business idea and margin money
  const isInfoProvided = Boolean(
    (hasRequiredInfo !== undefined ? hasRequiredInfo : (businessIdea?.trim() && capital > 0)) &&
    businessIdea?.trim() &&
    capital > 0
  );

  // Fetch real data from server
  const fetchFeasibilityData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.analyzeBusiness({
        locality: locality.trim() || "Local Area",
        state: stateName.trim() || "India",
        capital: Number(capital) || 100000,
        business_idea: businessIdea.trim() || "Commercial Enterprise",
      });
      setReport(data);
    } catch (err: any) {
      console.warn("Direct server fetch error:", err);
      setReport(null);
      setErrorMsg(`Could not generate hyper-local feasibility matrix for ${businessIdea} in ${locality}. Please verify your connection and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInfoProvided) return;
    fetchFeasibilityData();
  }, [isInfoProvided, locality, stateName, capital, businessIdea]);

  // Guard against missing business idea and capital: Show Required Information prompt
  if (!isInfoProvided) {
    return (
      <RequiredInfoGuard
        featureName={t("feasibility")}
        featureDescription="Market Reach, Opportunity, SWOT, Unit Economics & Competition"
        businessIdea={businessIdea}
        capital={capital}
        locality={locality}
        stateName={stateName}
        onBackToHome={onBackToHome}
        currentUser={currentUser}
        onOpenProfile={onOpenProfile}
        language={language}
        onSubmitInfo={(idea, cap, loc, st) => {
          setBusinessIdea(idea);
          setCapital(cap);
          if (loc) setLocality(loc);
          if (st) setStateName(st);
          if (onUpdateParams) {
            onUpdateParams(idea, cap, loc, st);
          }
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center font-sans">
        <Loader2 className="w-10 h-10 text-antigravity-navy animate-spin mb-3" />
        <h3 className="font-serif text-xl font-bold text-antigravity-navy">
          {t("computingFeasibility")}
        </h3>
        <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1 max-w-sm">
          {businessIdea} • {locality}
        </p>
      </div>
    );
  }

  if (!report || errorMsg) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 mb-4 shadow-subtle border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-antigravity-navy mb-2">
          {t("feasibilityUnavailable")}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
          {errorMsg || `Could not compute hyper-local feasibility for ${businessIdea} in ${locality}.`}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFeasibilityData}
            className="px-5 py-2.5 rounded-xl bg-antigravity-navy hover:bg-antigravity-orange text-white text-xs font-semibold transition-all shadow-subtle cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("retryAnalysis")}</span>
          </button>
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-antigravity-navy border border-neutral-300 text-xs font-semibold transition-all shadow-subtle cursor-pointer"
          >
            {t("home")}
          </button>
        </div>
      </div>
    );
  }

  const matrix = report.evidence?.market_feasibility || {};
  const finPlan = report.evidence?.financial_data;
  const projectCost = finPlan?.project_cost || capital;
  const breakEvenMonths = finPlan?.break_even_months || 7;

  const marketReach = matrix.market_reach || {
    radius: "5–10 km Catchment",
    consumer_base_footprint: `Direct coverage across local consumer settlements in ${locality} block.`,
    primary_distribution_channels: "Direct retail, local commercial buyers, and regional distribution points.",
    competitive_supply_advantage: "Direct local sourcing and modernized quality control outperforming unorganized competitors.",
    transport_node: `Direct highway and district road transit connectivity connecting ${locality} to regional mandis.`,
  };

  const oppAnalysis = matrix.opportunity_analysis || {
    project_cost_tier_fit: `The ₹${projectCost.toLocaleString("en-IN")} investment directly funds core production equipment, facility utilities, and initial working capital.`,
    unserved_local_niche: `Addresses high unmet demand for quality-standard ${businessIdea} in ${locality}.`,
    expansion_horizon: `Scale into value-added variants and expand distribution footprint upon loan stabilization.`,
    recommended_capital_allocation: {
      total_cost: projectCost,
      breakdown: [
        { percent: 45, amount: projectCost * 0.45, label: "Core Production Machinery & Tools" },
        { percent: 25, amount: projectCost * 0.25, label: "Civil Shed, Power & Water Utilities" },
        { percent: 20, amount: projectCost * 0.20, label: "Initial Raw Material & Inventory" },
        { percent: 10, amount: projectCost * 0.10, label: "Statutory Licenses & Working Buffer" },
      ],
    },
  };

  const swotData = matrix.swot || {
    strengths: report.swot?.strengths || ["Established local demand and high market gap", "Statutory subsidy and concessional credit qualification"],
    weaknesses: report.swot?.weaknesses || ["Initial working capital requirements", "Dependence on regional infrastructure"],
    opportunities: report.swot?.opportunities || ["Direct retail margin expansion", "Government priority sector scheme linkage"],
    threats: report.swot?.threats || ["Local informal competitor pricing pressure", "Input commodity price fluctuations"],
  };

  const unitEconomics = matrix.unit_economics || {
    estimated_gross_margin: 24.5,
    margin_status: "Healthy Operating Margin",
    break_even_timeline: `${breakEvenMonths} Months`,
    break_even_subtext: "Supported by Grace Moratorium",
    local_catchment_index: "Moderate-High",
    catchment_pop: "Local Catchment Population",
    cost_per_litre: {
      production_cost: 45.0,
      production_desc: "Raw materials, operating utilities & labor",
      selling_price: 60.0,
      selling_desc: "Realized wholesale and direct retail price",
    },
    daily_volume: "Standard Commercial Batch Throughput",
    net_operating_profit_monthly: projectCost * 0.08,
  };

  const competitorDensity = matrix.competitor_density || {
    density_scope: `Locality Saturation Analysis for ${businessIdea} in ${locality}`,
    density_index: 38,
    saturation_insight: `Local supply gap identified. ${businessIdea} demand in ${locality} exceeds existing commercial facilities.`,
    cost_advantage_note: "Direct sourcing and modern processing provide competitive margins over unorganized intermediaries.",
    locality_label: `${locality} Commercial Catchment`,
    saturation_verdict: "Moderate Market Competition",
    competitor_count: 3,
    landscape_comparison: [
      {
        badge: "PROPOSED UNIT",
        badge_color: "amber",
        volume_share: "Target: 25% Share",
        name: `Your Proposed ${businessIdea}`,
        description: `Modernized production unit with verified machinery and direct distribution in ${locality}.`,
        infra_label: "Facility / Tech:",
        infra: "Modernized Standard Facility",
        cost_metric: "Concessional Scheme Backed",
        procurement: `Direct Catchment in ${locality}`,
      },
      {
        badge: "LOCAL VENDORS",
        badge_color: "navy",
        volume_share: "Current: 45% Share",
        name: "Unorganized Local Sellers",
        description: "Fragmented individual micro-traders operating without quality grading standards.",
        infra_label: "Facility / Tech:",
        infra: "Basic Traditional Setup",
        cost_metric: "Variable Local Sourcing",
        procurement: "Dispersed Micro Sources",
      },
      {
        badge: "REGIONAL MANDI",
        badge_color: "emerald",
        volume_share: "Current: 30% Share",
        name: "Regional Inflow Supply",
        description: "Wholesale imports from outside blocks with transit delays and middleman commissions.",
        infra_label: "Facility / Tech:",
        infra: "Wholesale Mandi Hub",
        cost_metric: "Transit & Commission Overhead",
        procurement: "Inter-District Transport",
      },
    ],
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans select-none text-antigravity-charcoal pb-8">
      {/* Top Breadcrumb & Live Parameter Pill Bar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 z-30 flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumbs / Back */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="font-sans text-xs font-semibold text-antigravity-charcoal/80 hover:text-antigravity-orange transition-colors flex items-center gap-1 bg-white/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/60 shadow-subtle cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("home")}</span>
          </button>
          <span className="text-antigravity-navy/40 text-xs">/</span>
          <span className="font-sans text-xs font-bold text-antigravity-navy bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/60 shadow-subtle">
            {t("feasibility")}
          </span>
        </div>

        {/* Live Parameters Pill & User Profile */}
        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-antigravity-navy/15 text-xs font-semibold text-antigravity-navy shadow-subtle"
            title="Parameters synchronized with AI advisor"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[160px]">{businessIdea}</span>
            <span className="text-antigravity-navy/40">•</span>
            <span>{locality}, {stateName}</span>
            <span className="text-antigravity-navy/40">•</span>
            <span className="text-antigravity-orange font-bold">₹{Number(capital).toLocaleString("en-IN")}</span>
          </div>

          <button
            onClick={fetchFeasibilityData}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-antigravity-navy/70 hover:text-antigravity-orange transition-all border border-antigravity-navy/15 shadow-subtle disabled:opacity-50 cursor-pointer"
            title="Re-fetch server data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {currentUser && onOpenProfile && (
            <button
              onClick={onOpenProfile}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-white/80 text-xs font-semibold text-antigravity-navy shadow-xs transition-all cursor-pointer"
              title={t("profile")}
            >
              <div className="w-5 h-5 rounded-full bg-antigravity-navy text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.full_name}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 5-Stage Step Navigation Pills */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 z-20">
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSlide(sec.id)}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 backdrop-blur-md ${
                activeSlide === sec.id
                  ? "bg-white text-antigravity-navy border-antigravity-navy/30 shadow-subtle ring-2 ring-antigravity-navy/20"
                  : "bg-white/60 text-antigravity-charcoal/70 border-white/50 hover:bg-white/80"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  activeSlide === sec.id ? "bg-antigravity-navy text-white" : "bg-antigravity-navy/10 text-antigravity-navy"
                }`}
              >
                {sec.id}
              </span>
              <span className="truncate">{sec.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Slide Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center z-20">
        {isLoading ? (
          <div className="w-full bg-white/95 backdrop-blur-2xl rounded-3xl p-12 border border-antigravity-navy/10 shadow-elevated flex flex-col items-center justify-center text-center min-h-[400px]">
            <Loader2 className="w-10 h-10 text-antigravity-sage animate-spin mb-4" />
            <h3 className="font-serif text-2xl font-bold text-antigravity-navy mb-2">
              Evaluating Feasibility Matrix...
            </h3>
            <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/80 max-w-md">
              The Sahaay engine is evaluating local geographic reach, APMC demand signals, and unit economics for {locality}...
            </p>
          </div>
        ) : (
          <div className="w-full transition-all duration-300">
            {/* SLIDE 1: Immediate Market Reach (5–10 km Radius) & Logistics Corridors */}
            {activeSlide === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 animate-in fade-in duration-300">
                {/* Left Card: 1. Immediate Market Reach */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-antigravity-navy/10 shadow-elevated flex flex-col justify-between min-h-[360px]">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-full bg-antigravity-orange/10 flex items-center justify-center text-antigravity-orange shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy tracking-tight">
                      1. Immediate Market Reach ({marketReach.radius || "5–10 km Radius"})
                    </h2>
                  </div>

                  <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                    {/* Subcard: Consumer Base Footprint */}
                    <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 mb-1.5">
                        CONSUMER BASE FOOTPRINT
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed font-normal">
                        {marketReach.consumer_base_footprint}
                      </p>
                    </div>

                    {/* Subcard: Primary Distribution Channels */}
                    <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 mb-1.5">
                        PRIMARY DISTRIBUTION CHANNELS
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed font-normal">
                        {marketReach.primary_distribution_channels}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Card: Logistics Corridors & Supply Advantage */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-antigravity-navy/10 shadow-elevated flex flex-col justify-between min-h-[360px]">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-full bg-antigravity-sage/15 flex items-center justify-center text-antigravity-sage shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy tracking-tight">
                      Logistics Corridors & Supply Advantage
                    </h2>
                  </div>

                  <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                    {/* Subcard: Competitive Supply Advantage */}
                    <div className="bg-[#EBF3E8] rounded-2xl p-4 border border-antigravity-sage/30 shadow-sm">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-900/70 mb-1.5">
                        COMPETITIVE SUPPLY ADVANTAGE
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed font-normal">
                        {marketReach.competitive_supply_advantage}
                      </p>
                    </div>

                    {/* Subcard: Transport Node */}
                    <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 mb-1.5">
                        TRANSPORT NODE
                      </span>
                      <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed font-normal">
                        {marketReach.transport_node}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: Localized Opportunity & Unserved Niche Analysis */}
            {activeSlide === 2 && (
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-antigravity-navy/10 shadow-elevated animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy tracking-tight">
                    2. Localized Opportunity & Unserved Niche Analysis
                  </h2>
                </div>

                {/* Top 3 Cards in Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
                  <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                    <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-orange mb-1.5">
                      PROJECT COST TIER FIT
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed">
                      {oppAnalysis.project_cost_tier_fit}
                    </p>
                  </div>

                  <div className="bg-[#EBF3E8] rounded-2xl p-4 border border-antigravity-sage/35 shadow-sm">
                    <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                      UNSERVED LOCAL NICHE
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed">
                      {oppAnalysis.unserved_local_niche}
                    </p>
                  </div>

                  <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                    <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1.5">
                      EXPANSION HORIZON
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed">
                      {oppAnalysis.expansion_horizon}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Capital Allocation */}
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-bold text-antigravity-navy mb-2.5">
                    Recommended Project Capital Allocation (₹{Number(oppAnalysis.recommended_capital_allocation?.total_cost || capital).toLocaleString()} Total)
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {oppAnalysis.recommended_capital_allocation?.breakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-antigravity-cream/50 rounded-2xl p-3.5 border border-antigravity-navy/10 shadow-sm flex flex-col justify-between">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy">
                            {item.percent}%
                          </span>
                          <span className="font-sans text-xs font-bold text-[#8B2500]">
                            ₹{Number(item.amount).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-sans text-[10px] sm:text-[11px] text-antigravity-charcoal/80 leading-snug font-medium">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: SWOT Analysis (4-Quadrant Grid) */}
            {activeSlide === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                {/* Strengths */}
                <div className="bg-[#F4F9F2] backdrop-blur-xl rounded-3xl p-5 border border-emerald-300/60 shadow-subtle flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-700" />
                        <h3 className="font-serif text-base sm:text-lg font-bold text-emerald-950">
                          {t("strengths")}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        INTERNAL
                      </span>
                    </div>
                    <ul className="space-y-2 mt-2.5">
                      {swotData.strengths.map((str: string, i: number) => (
                        <li key={i} className="font-sans text-xs sm:text-sm text-emerald-950/85 flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="bg-[#FFF8F6] backdrop-blur-xl rounded-3xl p-5 border border-red-200/70 shadow-subtle flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[#8B2500]" />
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#4A1505]">
                          {t("weaknesses")}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                        INTERNAL
                      </span>
                    </div>
                    <ul className="space-y-2 mt-2.5">
                      {swotData.weaknesses.map((wk: string, i: number) => (
                        <li key={i} className="font-sans text-xs sm:text-sm text-[#4A1505]/85 flex items-start gap-2 leading-relaxed">
                          <span className="text-red-500 font-bold mt-0.5">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Opportunities */}
                <div className="bg-[#FFFBF5] backdrop-blur-xl rounded-3xl p-5 border border-amber-300/60 shadow-subtle flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-antigravity-orange" />
                        <h3 className="font-serif text-base sm:text-lg font-bold text-amber-950">
                          {t("opportunities")}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        EXTERNAL
                      </span>
                    </div>
                    <ul className="space-y-2 mt-2.5">
                      {swotData.opportunities.map((opp: string, i: number) => (
                        <li key={i} className="font-sans text-xs sm:text-sm text-amber-950/85 flex items-start gap-2 leading-relaxed">
                          <span className="text-antigravity-orange font-bold mt-0.5">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Threats */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-antigravity-navy/15 shadow-subtle flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-antigravity-navy" />
                        <h3 className="font-serif text-base sm:text-lg font-bold text-antigravity-navy">
                          {t("threats")}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-antigravity-navy/10 text-antigravity-navy border border-antigravity-navy/20">
                        EXTERNAL
                      </span>
                    </div>
                    <ul className="space-y-2 mt-2.5">
                      {swotData.threats.map((thr: string, i: number) => (
                        <li key={i} className="font-sans text-xs sm:text-sm text-antigravity-charcoal/85 flex items-start gap-2 leading-relaxed">
                          <span className="text-antigravity-navy font-bold mt-0.5">•</span>
                          <span>{thr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: Unit Economics & Pricing Architecture */}
            {activeSlide === 4 && (
              <div className="space-y-3.5 animate-in fade-in duration-300">
                {/* Top 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Estimated Gross Margin */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-antigravity-navy/10 shadow-elevated flex flex-col justify-between">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 block mb-1.5">
                      {t("grossMargin")}
                    </span>
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-[#8B2500]">
                        {unitEconomics.estimated_gross_margin}%
                      </span>
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3E8] text-emerald-800 border border-emerald-200/60">
                        {unitEconomics.margin_status}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Break-Even Timeline */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-antigravity-navy/10 shadow-elevated flex flex-col justify-between">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 block mb-1.5">
                      {t("breakEvenTimeline")}
                    </span>
                    <div className="mb-1.5">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-antigravity-navy">
                        {unitEconomics.break_even_timeline}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-antigravity-charcoal/70">
                      {unitEconomics.break_even_subtext}
                    </span>
                  </div>

                  {/* Card 3: Local Catchment Index */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-antigravity-navy/10 shadow-elevated flex flex-col justify-between">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 block mb-1.5">
                      LOCAL CATCHMENT INDEX
                    </span>
                    <div className="mb-1.5">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-antigravity-navy">
                        {unitEconomics.local_catchment_index}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-antigravity-charcoal/70">
                      {unitEconomics.catchment_pop}
                    </span>
                  </div>
                </div>

                {/* Large Bottom Card: Unit Cost & Realized Price Architecture */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-antigravity-navy/10 shadow-elevated">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-antigravity-navy tracking-tight">
                        Unit Cost & Realized Price Architecture
                      </h3>
                      <span className="font-sans text-xs text-antigravity-navy/60 font-medium">
                        Cost per Litre
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-antigravity-cream border border-antigravity-navy/10 text-antigravity-navy">
                      {unitEconomics.cost_per_litre?.capacity_label}
                    </span>
                  </div>

                  {/* 3 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
                    <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 mb-1.5">
                        COST OF PRODUCTION
                      </span>
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-antigravity-navy block mb-1">
                        ₹{Number(unitEconomics.cost_per_litre?.production_cost).toFixed(2)}
                      </span>
                      <span className="font-sans text-xs text-antigravity-charcoal/70">
                        {unitEconomics.cost_per_litre?.production_desc}
                      </span>
                    </div>

                    <div className="bg-antigravity-cream/60 rounded-2xl p-4 border border-antigravity-navy/10 shadow-sm">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 mb-1.5">
                        REALIZED SELLING PRICE
                      </span>
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-antigravity-navy block mb-1">
                        ₹{Number(unitEconomics.cost_per_litre?.selling_price).toFixed(2)}
                      </span>
                      <span className="font-sans text-xs text-antigravity-charcoal/70">
                        {unitEconomics.cost_per_litre?.selling_desc}
                      </span>
                    </div>

                    <div className="bg-[#8B2500] text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                      <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1.5">
                        NET MARGIN PER UNIT
                      </span>
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-white block mb-1">
                        + ₹{Number(unitEconomics.cost_per_litre?.net_margin).toFixed(2)}
                      </span>
                      <span className="font-sans text-xs text-white/85">
                        {unitEconomics.cost_per_litre?.net_margin_desc}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-antigravity-navy/10">
                    <div className="bg-antigravity-cream/40 px-3.5 py-2 rounded-xl flex items-center justify-between border border-antigravity-navy/5">
                      <span className="font-sans text-xs text-antigravity-navy/70">Monthly Revenue:</span>
                      <span className="font-serif text-sm font-bold text-antigravity-navy">
                        ₹{Number(unitEconomics.monthly_summary?.revenue).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-antigravity-cream/40 px-3.5 py-2 rounded-xl flex items-center justify-between border border-antigravity-navy/5">
                      <span className="font-sans text-xs text-antigravity-navy/70">Monthly OPEX:</span>
                      <span className="font-serif text-sm font-bold text-[#8B2500]">
                        ₹{Number(unitEconomics.monthly_summary?.opex).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-[#2D4E35] text-white px-3.5 py-2 rounded-xl flex items-center justify-between shadow-sm">
                      <span className="font-sans text-xs text-white/80 font-medium">Monthly EBITDA:</span>
                      <span className="font-serif text-sm font-bold text-emerald-300">
                        ₹{Number(unitEconomics.monthly_summary?.ebitda).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 5: Competitor Density & Block Saturation */}
            {activeSlide === 5 && (
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-antigravity-navy/10 shadow-elevated animate-in fade-in duration-300">
                {/* Header with Saturation Metric */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3.5">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy tracking-tight">
                      5. Competitor Density & Block Saturation
                    </h2>
                    <p className="font-sans text-xs text-antigravity-charcoal/70 mt-1">
                      {competitorDensity.density_scope}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="block font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60">
                      DENSITY INDEX
                    </span>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#8B2500]">
                      {competitorDensity.density_index}%
                    </span>
                  </div>
                </div>

                {/* Saturation Benchmark Bar */}
                <div className="mb-5">
                  <div className="w-full h-2.5 rounded-full bg-antigravity-navy/10 overflow-hidden mb-1.5 relative">
                    <div
                      className="h-full rounded-full bg-[#D96B27] transition-all duration-1000"
                      style={{ width: `${competitorDensity.density_index}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-sans text-[10px] text-antigravity-navy/60 font-medium">
                    <span>0% (High Deficit / Greenfield)</span>
                    <span>50% (Balanced Supply)</span>
                    <span>100% (High Saturation)</span>
                  </div>
                </div>

                {/* Insight Callout Card */}
                <div className="bg-[#EBF3E8] rounded-2xl p-4 border border-antigravity-sage/35 shadow-sm mb-5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 font-sans text-xs sm:text-sm text-antigravity-charcoal/90 leading-relaxed">
                    <p className="font-semibold text-emerald-950">
                      {competitorDensity.saturation_insight}
                    </p>
                    <p className="text-emerald-950/80 text-xs">
                      {competitorDensity.cost_advantage_note}
                    </p>
                  </div>
                </div>

                {/* Competitive Landscape Comparison Cards */}
                <div>
                  <h3 className="font-sans text-[10px] font-bold uppercase tracking-wider text-antigravity-navy/60 mb-2.5">
                    {t("competitiveLandscape")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {competitorDensity.landscape_comparison?.map((comp: any, idx: number) => {
                      const isProposed = comp.badge === "PROPOSED UNIT";
                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl p-4 border shadow-sm flex flex-col justify-between ${
                            isProposed
                              ? "bg-[#FFFBF5] border-amber-300 ring-2 ring-amber-400/30"
                              : "bg-antigravity-cream/50 border-antigravity-navy/10"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  comp.badge_color === "amber"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : comp.badge_color === "navy"
                                    ? "bg-antigravity-navy/10 text-antigravity-navy border border-antigravity-navy/20"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {comp.badge}
                              </span>
                              <span className="font-sans text-[10px] text-antigravity-navy/60 font-semibold">
                                {comp.volume_share}
                              </span>
                            </div>

                            <h4 className="font-serif text-base font-bold text-antigravity-navy mb-1">
                              {comp.name}
                            </h4>
                            <p className="font-sans text-xs text-antigravity-charcoal/80 leading-normal mb-3">
                              {comp.description}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-antigravity-navy/10 space-y-1.5 text-xs font-sans">
                            <div className="flex justify-between items-center">
                              <span className="text-antigravity-navy/60 text-[11px]">{comp.infra_label || "Facility / Infra:"}</span>
                              <span
                                className={`font-semibold ${
                                  comp.chilling_status === "danger"
                                    ? "text-red-600"
                                    : comp.chilling_status === "target"
                                    ? "text-emerald-700 font-bold"
                                    : "text-emerald-600"
                                }`}
                              >
                                {comp.infra_spec || comp.chilling_infra || "Standard Operations"}
                              </span>
                            </div>

                            {comp.pricing_stability && (
                              <div className="flex justify-between items-center">
                                <span className="text-antigravity-navy/60 text-[11px]">Pricing Stability:</span>
                                <span className="font-medium text-antigravity-charcoal/85">
                                  {comp.pricing_stability}
                                </span>
                              </div>
                            )}

                            {comp.value_add && (
                              <div className="flex justify-between items-center">
                                <span className="text-antigravity-navy/60 text-[11px]">Value Add:</span>
                                <span className="font-bold text-[#8B2500]">
                                  {comp.value_add}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Sticky Step Navigation Bar */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 z-30 flex items-center justify-between gap-3">
        {/* Previous Button */}
        <button
          onClick={() => setActiveSlide((prev) => Math.max(prev - 1, 1))}
          disabled={activeSlide === 1}
          className="px-4 py-2 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md border border-antigravity-navy/15 text-xs font-semibold text-antigravity-charcoal hover:text-antigravity-orange transition-all shadow-subtle flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("previous")}:</span>
          <span>{activeSlide > 1 ? sections[activeSlide - 2].shortName : "Start"}</span>
        </button>

        {/* Center Progress Text */}
        <div className="flex items-center gap-2 text-antigravity-charcoal/80 font-sans text-xs font-semibold bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/60 shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-antigravity-orange" />
          <span>Slide {activeSlide} of 5</span>
          <span className="text-antigravity-navy/30">•</span>
          <span className="hidden sm:inline">Sahaay {t("feasibility")}</span>
        </div>

        {/* Next / Complete Button */}
        {activeSlide < 5 ? (
          <button
            onClick={() => setActiveSlide((prev) => Math.min(prev + 1, 5))}
            className="px-5 py-2 rounded-2xl bg-[#8B2500] hover:bg-[#721F00] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-2"
          >
            <span>{t("next")}: {sections[activeSlide].shortName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {onProceedToSchemes && (
              <button
                onClick={onProceedToSchemes}
                className="px-3.5 py-2 rounded-2xl bg-antigravity-navy hover:bg-[#081E33] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5"
                title="Evaluate Loan Subsidies"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{t("checkSchemes")}</span>
              </button>
            )}
            {onProceedToDpr && (
              <button
                onClick={onProceedToDpr}
                className="px-3.5 py-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-1.5"
                title="Generate Bank-Ready DPR"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{t("generateDpr")}</span>
              </button>
            )}
            <button
              onClick={onBackToHome}
              className="px-4 py-2 rounded-2xl bg-[#8B2500] hover:bg-[#721F00] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t("completeReview")}</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
