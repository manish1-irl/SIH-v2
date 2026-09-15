"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  Landmark,
  Clock,
  Coins,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  FileDown,
  Compass,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ConcessionalLoanResponse } from "@/types";

interface SchemeCalculatorFlowProps {
  onBackToHome: () => void;
  onProceedToFeasibility?: () => void;
  onProceedToDpr?: () => void;
  initialCapital?: number;
  initialBusinessIdea?: string;
  initialLocality?: string;
  initialState?: string;
}

export default function SchemeCalculatorFlow({
  onBackToHome,
  onProceedToFeasibility,
  onProceedToDpr,
  initialCapital = 100000,
  initialBusinessIdea = "Commercial Mini Dairy & Chilling Unit",
  initialLocality = "Bassi",
  initialState = "Rajasthan",
}: SchemeCalculatorFlowProps) {
  // Input parameters
  const [capital, setCapital] = useState(initialCapital);
  const [marginPercent, setMarginPercent] = useState(10.0);
  const [annualInterestRate, setAnnualInterestRate] = useState(8.0);
  const [tenureYears, setTenureYears] = useState(7);
  const [moratoriumMonths, setMoratoriumMonths] = useState(6);
  const [commercialRate, setCommercialRate] = useState(12.5);

  // UI States
  const [activeChartTab, setActiveChartTab] = useState<"curve" | "split">("curve");
  const [hoveredQuarterIndex, setHoveredQuarterIndex] = useState<number | null>(9); // default hovered to Y3-Q2 for initial view
  const [isLoading, setIsLoading] = useState(true);

  // Server data
  const [data, setData] = useState<ConcessionalLoanResponse | null>(null);

  const fetchLoanCalculation = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.calculateConcessionalLoan({
        capital: Number(capital) || 100000,
        margin_percent: Number(marginPercent) || 10.0,
        annual_interest_rate: Number(annualInterestRate) || 8.0,
        tenure_years: Number(tenureYears) || 7,
        moratorium_months: Number(moratoriumMonths) || 6,
        commercial_rate: Number(commercialRate) || 12.5,
      });
      setData(res);
    } catch (err) {
      console.warn("Server loan calculation error, computing fallback:", err);
      const cap = Number(capital) || 100000;
      const mRatio = (Number(marginPercent) || 10) / 100;
      const pCost = cap / mRatio;
      const debt = pCost - cap;
      const tQtrs = (Number(tenureYears) || 7) * 4;
      const mQtrs = Math.round((Number(moratoriumMonths) || 6) / 3);
      const aQtrs = Math.max(tQtrs - mQtrs, 1);
      const qRate = (Number(annualInterestRate) || 8) / 100 / 4;
      const graceInstallment = debt * qRate;
      const num = qRate * Math.pow(1 + qRate, aQtrs);
      const den = Math.pow(1 + qRate, aQtrs) - 1;
      const eqi = debt * (num / den);

      let bal = debt;
      const sched = [];
      let totPrin = 0;
      let totInt = 0;
      for (let q = 1; q <= tQtrs; q++) {
        const y = Math.floor((q - 1) / 4) + 1;
        const qy = ((q - 1) % 4) + 1;
        const lbl = `Y${y}-Q${qy}`;
        const openBal = bal;
        let intPaid = openBal * qRate;
        let prin = 0;
        let status: "Grace Moratorium" | "Active EQI" = "Grace Moratorium";

        if (q <= mQtrs) {
          status = "Grace Moratorium";
          prin = 0;
        } else {
          status = "Active EQI";
          if (q === tQtrs) {
            prin = openBal;
            bal = 0;
          } else {
            prin = Math.min(openBal, eqi - intPaid);
            bal = Math.max(openBal - prin, 0);
          }
        }
        totPrin += prin;
        totInt += intPaid;
        sched.push({
          quarter: q,
          label: lbl,
          year: y,
          quarter_of_year: qy,
          status,
          opening_balance: openBal,
          installment: prin + intPaid,
          principal_repaid: prin,
          interest_paid: intPaid,
          closing_balance: bal,
        });
      }

      const commQRate = 12.5 / 100 / 4;
      const commNum = commQRate * Math.pow(1 + commQRate, tQtrs);
      const commDen = Math.pow(1 + commQRate, tQtrs) - 1;
      const commEqi = debt * (commNum / commDen);
      const commInt = commEqi * tQtrs - debt;
      const savings = Math.max(commInt - totInt, 0);

      setData({
        promoter_margin: cap,
        margin_percent: Number(marginPercent) || 10,
        total_project_cost: pCost,
        concessional_debt: debt,
        annual_interest_rate: Number(annualInterestRate) || 8,
        tenure_years: Number(tenureYears) || 7,
        tenure_quarters: tQtrs,
        moratorium_months: Number(moratoriumMonths) || 6,
        moratorium_quarters: mQtrs,
        grace_quarterly_installment: graceInstallment,
        active_eqi: eqi,
        total_principal_repaid: totPrin,
        total_concessional_interest: totInt,
        total_outflow: totPrin + totInt,
        commercial_interest_cost: commInt,
        total_interest_savings: savings,
        savings_percent: (savings / commInt) * 100,
        credit_guarantee: "100% CGFMU/CGTMSE",
        scheme_category: "TERM LOAN CATEGORY",
        scheme_name: "Term Loan Concessional Scheme (TLS)",
        scheme_description: "Established rural micro/small enterprises, agri-processors, dairy clusters, mechanization units",
        rules: "₹1.40L < P ≤ ₹50.00L Rule",
        schedule: sched,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCapital && initialCapital > 0) {
      setCapital(initialCapital);
    }
  }, [initialCapital]);

  useEffect(() => {
    fetchLoanCalculation();
  }, [capital, marginPercent, annualInterestRate, tenureYears, moratoriumMonths, commercialRate]);

  // Safe accessor shortcuts
  const pCost = data?.total_project_cost ?? 1000000;
  const pMargin = data?.promoter_margin ?? 100000;
  const cDebt = data?.concessional_debt ?? 900000;
  const graceQtr = data?.grace_quarterly_installment ?? 18000;
  const activeEqi = data?.active_eqi ?? 44729;
  const intSavings = data?.total_interest_savings ?? 164631;
  const savingsPct = data?.savings_percent ?? 36;
  const totPrincipal = data?.total_principal_repaid ?? 900000;
  const totInterest = data?.total_concessional_interest ?? 298965;
  const totOutflow = data?.total_outflow ?? 1198965;
  const schedule = data?.schedule ?? [];

  // Currently selected quarter in chart (default to Y3-Q2)
  const currentQtr = useMemo(() => {
    if (!schedule.length) return null;
    if (hoveredQuarterIndex !== null && schedule[hoveredQuarterIndex]) {
      return schedule[hoveredQuarterIndex];
    }
    return schedule[9] || schedule[0];
  }, [schedule, hoveredQuarterIndex]);

  // SVG Chart Geometry Calculations
  const chartWidth = 900;
  const chartHeight = 320;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const maxVal = Math.max(cDebt * 1.1, 1000000);

  // Generate SVG Points for Balance Curve
  const points = useMemo(() => {
    if (!schedule.length) return [];
    return schedule.map((item, idx) => {
      const x = padLeft + (idx / (schedule.length - 1)) * plotWidth;
      const y = padTop + plotHeight - (item.opening_balance / maxVal) * plotHeight;
      return { x, y, item, idx };
    });
  }, [schedule, maxVal, plotWidth, plotHeight]);

  const curvePath = useMemo(() => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = padTop + plotHeight;
    let d = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ` L ${points[points.length - 1].x} ${bottomY} Z`;
    return d;
  }, [points]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans select-none text-antigravity-charcoal">
      {/* Top Header & Breadcrumbs */}
      <header className="border-b border-white/60 bg-white/85 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-antigravity-navy/5 hover:bg-antigravity-navy/10 text-antigravity-navy transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <div className="h-4 w-[1px] bg-antigravity-navy/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-antigravity-orange/15 text-antigravity-orange flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold text-sm text-antigravity-navy tracking-tight block leading-tight">
                  Scheme Calculator
                </span>
                <span className="text-[10px] text-antigravity-charcoal/60 block leading-tight">
                  Concessional Financial Engine & Amortization
                </span>
              </div>
            </div>
          </div>

          {/* Active Parameter Synchronized Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-antigravity-navy/5 px-3 py-1.5 rounded-xl border border-antigravity-navy/10 text-xs font-semibold text-antigravity-navy">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[150px]">{initialBusinessIdea}</span>
              <span className="text-antigravity-navy/40">•</span>
              <span className="text-antigravity-orange font-bold">Margin: ₹{Number(capital).toLocaleString("en-IN")}</span>
            </div>

            {onProceedToFeasibility && (
              <button
                onClick={onProceedToFeasibility}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-antigravity-sage/15 text-antigravity-navy hover:bg-antigravity-sage/25 text-xs font-semibold transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-antigravity-sage" />
                <span>Feasibility Matrix</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ========================================================= */}
        {/* PART 1: Financial Structuring & Scheme Auto-Router */}
        {/* ========================================================= */}
        <section className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5ECE1] border border-[#DFC9B2] text-[#8B2500] text-[10px] font-bold uppercase tracking-wider mb-2">
                <Calculator className="w-3 h-3 text-[#8B2500]" />
                <span>Concessional Financial Engine</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-antigravity-navy tracking-tight">
                Financial Structuring & Scheme Auto-Router
              </h1>
            </div>
            <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/70 max-w-md md:text-right leading-relaxed">
              Live deterministic mathematical derivation of 90% concessional loan with statutory grace
              period (moratorium) alignment.
            </p>
          </div>

          {/* Top 3 Stat Cards Matching Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Promoter Margin */}
            <div className="bg-white rounded-3xl p-6 border border-antigravity-navy/10 shadow-subtle flex flex-col justify-between relative overflow-hidden group hover:border-[#8B2500]/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-xs font-bold text-antigravity-navy/70 uppercase tracking-wider">
                  Promoter Margin (10%)
                </span>
                <div className="w-8 h-8 rounded-full bg-[#F5ECE1] flex items-center justify-center text-[#8B2500]">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-antigravity-navy tracking-tight mb-2">
                  ₹{pMargin.toLocaleString("en-IN")}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-antigravity-charcoal/75">
                  <span className="w-2 h-2 rounded-full bg-[#D96B27]" />
                  <span>10% Required Borrower Equity</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Project Cost (P) - Prominent Terracotta Card */}
            <div className="bg-[#8B2500] text-white rounded-3xl p-6 shadow-elevated flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-xs font-bold text-white/80 uppercase tracking-wider">
                  Total Project Cost (P)
                </span>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                  ₹{pCost.toLocaleString("en-IN")}
                </div>
                <div className="font-mono text-[11px] text-white/80 bg-white/15 px-3 py-1.5 rounded-xl inline-block">
                  Formula: P = Margin / 10% (₹{(pMargin / 100000).toFixed(2)} Lakh ÷ 0.10)
                </div>
              </div>
            </div>

            {/* Card 3: Concessional Debt (90%) */}
            <div className="bg-white rounded-3xl p-6 border border-antigravity-navy/10 shadow-subtle flex flex-col justify-between relative overflow-hidden group hover:border-[#87A96B]/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="font-sans text-xs font-bold text-antigravity-navy/70 uppercase tracking-wider">
                  Concessional Debt (90%)
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-antigravity-navy tracking-tight mb-2">
                  ₹{cDebt.toLocaleString("en-IN")}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-antigravity-charcoal/75">
                  <span className="w-2 h-2 rounded-full bg-[#87A96B]" />
                  <span>Term Loan Concessional Scheme (TLS) Principal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Two-Column Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Card: Scheme Details (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-antigravity-navy/10 shadow-subtle flex flex-col justify-between space-y-6">
              <div>
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-antigravity-navy/5 text-antigravity-navy/80 text-[10px] font-bold tracking-wider uppercase">
                    Term Loan Category
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-antigravity-navy/5 text-antigravity-navy/80 text-[10px] font-bold tracking-wider uppercase">
                    ₹1.40L &lt; P ≤ ₹50.00L Rule
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#F5ECE1] text-[#8B2500] text-[10px] font-bold tracking-wider uppercase">
                    {annualInterestRate}% p.a. Fixed Concessional
                  </span>
                </div>

                {/* Scheme Title */}
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-antigravity-navy tracking-tight mb-2">
                  Term Loan Concessional Scheme (TLS)
                </h2>
                <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/70 leading-relaxed">
                  Established rural micro/small enterprises, agri-processors, dairy clusters,
                  mechanization units.
                </p>
              </div>

              {/* 3 Sub-stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-antigravity-navy/5">
                  <span className="font-sans text-[10px] text-antigravity-charcoal/60 block mb-1 font-semibold uppercase">
                    Repayment Tenure
                  </span>
                  <span className="font-serif text-base font-bold text-antigravity-navy block">
                    {tenureYears} Years ({tenureYears * 4} Qtrs)
                  </span>
                </div>

                <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-antigravity-navy/5">
                  <span className="font-sans text-[10px] text-antigravity-charcoal/60 block mb-1 font-semibold uppercase">
                    Grace Period (Moratorium)
                  </span>
                  <span className="font-serif text-base font-bold text-[#8B2500] block">
                    {moratoriumMonths} Months ({Math.round(moratoriumMonths / 3)} Qtrs)
                  </span>
                </div>

                <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-antigravity-navy/5">
                  <span className="font-sans text-[10px] text-antigravity-charcoal/60 block mb-1 font-semibold uppercase">
                    Credit Guarantee
                  </span>
                  <span className="font-serif text-base font-bold text-antigravity-navy block">
                    100% CGFMU/CGTMSE
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Quarterly Payment Phasing (5 Cols) */}
            <div className="lg:col-span-5 bg-[#FAF7F2] rounded-3xl p-6 sm:p-7 border border-[#DFC9B2]/60 shadow-subtle flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-antigravity-navy uppercase tracking-wider">
                  Quarterly Payment Phasing
                </span>
                <Clock className="w-4 h-4 text-[#8B2500]" />
              </div>

              {/* Phase 1 Box: Moratorium */}
              <div className="bg-white rounded-2xl p-4 border border-[#DFC9B2]/50 shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-sans text-[10px] font-bold text-antigravity-charcoal/80 uppercase tracking-wider block">
                    First {moratoriumMonths} Months (Moratorium)
                  </span>
                  <span className="text-[11px] text-antigravity-charcoal/60 block">
                    Simple Interest Servicing Only
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl font-bold text-antigravity-navy block">
                    ₹{Math.round(graceQtr).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-antigravity-charcoal/50">/ Quarter</span>
                </div>
              </div>

              {/* Phase 2 Box: Active EQI (Terracotta Box) */}
              <div className="bg-[#8B2500] text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
                <div>
                  <span className="font-sans text-[10px] font-bold text-white/90 uppercase tracking-wider block">
                    Active EQI ({data ? data.tenure_quarters - data.moratorium_quarters : 26} Quarters)
                  </span>
                  <span className="text-[11px] text-white/75 block">Equated Principal + Interest</span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl font-bold text-white block">
                    ₹{Math.round(activeEqi).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-white/70">/ Quarter</span>
                </div>
              </div>

              {/* Commercial Comparison Bottom Row */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DFC9B2]/50 text-xs">
                <span className="text-antigravity-charcoal/70 font-medium">
                  Total Interest Savings vs Commercial ({commercialRate}%):
                </span>
                <span className="font-serif font-bold text-[#8B2500]">
                  ₹{Math.round(intSavings).toLocaleString("en-IN")} ({Math.round(savingsPct)}%)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PART 2: Quarterly Repayment Schedule & Grace Phasing */}
        {/* ========================================================= */}
        <section className="space-y-6 pt-4 border-t border-antigravity-navy/10">
          {/* Section Header & Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                <TrendingUp className="w-3 h-3 text-emerald-700" />
                <span>Quarterly Amortization Timeline</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-antigravity-navy tracking-tight">
                Quarterly Repayment Schedule & Grace Phasing
              </h2>
            </div>

            {/* Toggle Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-antigravity-navy/15 rounded-2xl shadow-subtle self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab("curve")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeChartTab === "curve"
                    ? "bg-[#8B2500] text-white shadow-sm"
                    : "text-antigravity-charcoal/70 hover:text-antigravity-charcoal"
                }`}
              >
                Balance Curve
              </button>
              <button
                onClick={() => setActiveChartTab("split")}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeChartTab === "split"
                    ? "bg-[#8B2500] text-white shadow-sm"
                    : "text-antigravity-charcoal/70 hover:text-antigravity-charcoal"
                }`}
              >
                Principal vs Interest
              </button>
            </div>
          </div>

          {/* Statutory Grace Period Notice Box */}
          <div className="bg-[#FBF6ED] rounded-2xl p-5 border border-[#EADECB] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#EADECB]/60 flex items-center justify-center text-[#8B2500] shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-[#8B2500]" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-antigravity-navy mb-0.5">
                  Statutory Grace Period: First {moratoriumMonths} Months (
                  {Math.round(moratoriumMonths / 3)} Quarters)
                </h3>
                <p className="font-sans text-xs text-antigravity-charcoal/75 leading-relaxed">
                  During initial enterprise establishment, zero principal is deducted. Only ₹
                  {Math.round(graceQtr).toLocaleString("en-IN")} simple interest per quarter is
                  serviced.
                </p>
              </div>
            </div>

            {/* Right Badges */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-[#EADECB] text-center shadow-2xs">
                <span className="text-[9px] font-bold text-antigravity-charcoal/60 uppercase tracking-wider block">
                  Grace Installment
                </span>
                <span className="font-serif text-xs font-bold text-antigravity-navy">
                  ₹{Math.round(graceQtr).toLocaleString("en-IN")}/Qtr
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#8B2500] text-white text-center shadow-sm">
                <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider block">
                  Active EQI
                </span>
                <span className="font-serif text-xs font-bold text-white">
                  ₹{Math.round(activeEqi).toLocaleString("en-IN")}/Qtr
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Amortization Chart Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-antigravity-navy/10 shadow-subtle space-y-6">
            {activeChartTab === "curve" ? (
              /* VIEW 1: Area Balance Curve */
              <div className="space-y-4">
                <div className="relative w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto min-w-[700px] select-none"
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B2500" stopOpacity="0.35" />
                        <stop offset="70%" stopColor="#8B2500" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#8B2500" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Horizontal Grid Lines */}
                    {[1000000, 750000, 500000, 250000, 0].map((val) => {
                      const y = padTop + plotHeight - (val / maxVal) * plotHeight;
                      return (
                        <g key={val}>
                          <line
                            x1={padLeft}
                            y1={y}
                            x2={chartWidth - padRight}
                            y2={y}
                            stroke="#0A2540"
                            strokeOpacity="0.08"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padLeft - 12}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="500"
                            fill="#0A2540"
                            opacity="0.45"
                            fontFamily="Montserrat, sans-serif"
                          >
                            ₹{val === 0 ? "0" : `${val / 1000}k`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Shaded Area Fill */}
                    <path d={areaPath} fill="url(#areaGradient)" />

                    {/* Primary Curve Line */}
                    <path
                      d={curvePath}
                      fill="none"
                      stroke="#8B2500"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Quarter Data Points and Interaction Circles */}
                    {points.map((pt) => {
                      const isHovered = hoveredQuarterIndex === pt.idx;
                      return (
                        <g key={pt.idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 5 : 2.5}
                            fill={isHovered ? "#8B2500" : "#ffffff"}
                            stroke="#8B2500"
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredQuarterIndex(pt.idx)}
                          />

                          {/* Hover Hit Target Area */}
                          <rect
                            x={pt.x - 12}
                            y={padTop}
                            width={24}
                            height={plotHeight}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredQuarterIndex(pt.idx)}
                          />
                        </g>
                      );
                    })}

                    {/* X-Axis Labels (Display every 2nd quarter to avoid overlap on 28 points) */}
                    {points.map((pt, idx) => {
                      const showLabel =
                        idx % 2 === 0 || idx === points.length - 1 || idx === hoveredQuarterIndex;
                      if (!showLabel) return null;
                      const isSelected = hoveredQuarterIndex === idx;
                      return (
                        <text
                          key={pt.item.label}
                          x={pt.x}
                          y={chartHeight - 15}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight={isSelected ? "700" : "500"}
                          fill={isSelected ? "#8B2500" : "#0A2540"}
                          opacity={isSelected ? "1" : "0.55"}
                          fontFamily="Montserrat, sans-serif"
                        >
                          {pt.item.label}
                        </text>
                      );
                    })}
                  </svg>

                  {/* Interactive Floating Tooltip Card */}
                  {currentQtr && points[hoveredQuarterIndex ?? 9] && (
                    <div
                      className="absolute z-30 pointer-events-none transition-all duration-200"
                      style={{
                        left: `${Math.min(
                          Math.max(
                            ((points[hoveredQuarterIndex ?? 9].x) / chartWidth) * 100,
                            12
                          ),
                          78
                        )}%`,
                        top: "22%",
                      }}
                    >
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-antigravity-navy/15 shadow-elevated w-48 space-y-2 -translate-x-1/2">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-xs text-antigravity-navy">
                            {currentQtr.label}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              currentQtr.status === "Grace Moratorium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {currentQtr.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-antigravity-charcoal/70">
                            <span>Remaining Balance:</span>
                            <span className="font-serif font-bold text-antigravity-navy">
                              ₹{Math.round(currentQtr.opening_balance).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-antigravity-charcoal/70">
                            <span>Principal:</span>
                            <span className="font-mono font-semibold text-emerald-700">
                              ₹{Math.round(currentQtr.principal_repaid).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-antigravity-charcoal/70">
                            <span>Interest:</span>
                            <span className="font-mono font-semibold text-[#8B2500]">
                              ₹{Math.round(currentQtr.interest_paid).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-antigravity-charcoal/60 font-medium">
                  <span className="w-3 h-0.5 bg-[#8B2500] inline-block" />
                  <span className="w-2 h-2 rounded-full border border-[#8B2500] bg-white inline-block -ml-1" />
                  <span className="w-3 h-0.5 bg-[#8B2500] inline-block -ml-1" />
                  <span>Remaining Balance</span>
                </div>
              </div>
            ) : (
              /* VIEW 2: Stacked Principal vs Interest Breakdown */
              <div className="space-y-4">
                <div className="text-xs text-antigravity-charcoal/70 font-medium flex items-center justify-between">
                  <span>Quarterly Installment Breakdown (Principal vs Interest across 28 Quarters)</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-700 inline-block" />
                      <span>Principal</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-[#D96B27] inline-block" />
                      <span>Interest</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-14 lg:grid-cols-28 gap-1 items-end h-44 pt-4 px-2 bg-[#FAF8F5] rounded-2xl border border-antigravity-navy/5">
                  {schedule.map((qtr, idx) => {
                    const isHovered = hoveredQuarterIndex === idx;
                    const maxInst = Math.max(activeEqi * 1.1, 1);
                    const prinHeight = (qtr.principal_repaid / maxInst) * 100;
                    const intHeight = (qtr.interest_paid / maxInst) * 100;

                    return (
                      <div
                        key={qtr.label}
                        onMouseEnter={() => setHoveredQuarterIndex(idx)}
                        className={`flex flex-col justify-end items-center h-full cursor-pointer group transition-all ${
                          isHovered ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"
                        }`}
                        title={`${qtr.label}: Principal ₹${Math.round(
                          qtr.principal_repaid
                        ).toLocaleString("en-IN")}, Interest ₹${Math.round(
                          qtr.interest_paid
                        ).toLocaleString("en-IN")}`}
                      >
                        <div className="w-full max-w-[14px] flex flex-col justify-end items-center rounded-t overflow-hidden">
                          {/* Interest (Orange Top) */}
                          <div
                            style={{ height: `${intHeight}%` }}
                            className="w-full bg-[#D96B27] min-h-[2px]"
                          />
                          {/* Principal (Green Bottom) */}
                          <div
                            style={{ height: `${prinHeight}%` }}
                            className="w-full bg-emerald-700 min-h-[0px]"
                          />
                        </div>
                        <span className="text-[7px] text-antigravity-navy/50 mt-1 font-mono">
                          {idx % 4 === 0 ? `Y${qtr.year}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {currentQtr && (
                  <div className="p-3.5 bg-white rounded-2xl border border-antigravity-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-antigravity-navy">
                      Selected: {currentQtr.label} ({currentQtr.status})
                    </span>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-emerald-800 font-medium">
                        Principal Repaid: ₹{Math.round(currentQtr.principal_repaid).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[#8B2500] font-medium">
                        Interest Servicing: ₹{Math.round(currentQtr.interest_paid).toLocaleString("en-IN")}
                      </span>
                      <span className="font-serif font-bold text-antigravity-navy">
                        Total Qtr Outflow: ₹{Math.round(currentQtr.installment).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Outflow Summary Bar Matching Mockup */}
            <div className="pt-6 border-t border-antigravity-navy/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-5 font-semibold text-antigravity-charcoal/85">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900" />
                  <span>Principal Repaid: ₹{Math.round(totPrincipal).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D96B27]" />
                  <span>
                    Total Concessional Interest: ₹{Math.round(totInterest).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-sans text-xs text-antigravity-charcoal/70 mr-2 font-medium">
                  Total Outflow:
                </span>
                <span className="font-serif text-base sm:text-lg font-bold text-antigravity-navy">
                  ₹{Math.round(totOutflow).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Navigation / Next Steps Bar */}
        <div className="bg-white rounded-3xl p-6 border border-antigravity-navy/10 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-serif text-base font-bold text-antigravity-navy mb-0.5">
              Structured Scheme Roadmap Ready
            </h4>
            <p className="font-sans text-xs text-antigravity-charcoal/70">
              Continue to hyper-local feasibility analysis or generate bank-ready DPR with QR code.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onProceedToFeasibility && (
              <button
                onClick={onProceedToFeasibility}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-antigravity-navy hover:bg-[#081E33] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Feasibility Matrix</span>
              </button>
            )}

            {onProceedToDpr && (
              <button
                onClick={onProceedToDpr}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-[#8B2500] hover:bg-[#721F00] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Generate DPR</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
