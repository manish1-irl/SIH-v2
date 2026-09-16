"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Bell,
  Building2,
  Landmark,
  Compass,
  FileText,
  Sparkles,
  ChevronRight,
  Calendar,
  Layers,
  Activity,
  ArrowLeft,
  LogOut,
  Check,
  Loader2,
  Send,
  MessageSquare,
  Sparkle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import {
  PersonalDashboardData,
  AIBusinessGoal,
  DashboardReminder,
  LoanStage,
} from "@/types";
import { UserProfile } from "@/lib/supabase";

interface PersonalDashboardViewProps {
  currentUser: UserProfile | null;
  onBackToHome: () => void;
  onLogout: () => void;
  onOpenSchemes?: () => void;
  onOpenFeasibility?: () => void;
  onOpenExplore?: () => void;
  businessIdea?: string;
  locality?: string;
  state?: string;
  capital?: number;
  enterpriseName?: string;
}

export default function PersonalDashboardView({
  currentUser,
  onBackToHome,
  onLogout,
  onOpenSchemes,
  onOpenFeasibility,
  onOpenExplore,
  businessIdea = "Commercial Mini Dairy & Chilling Unit",
  locality = "Bassi",
  state = "Rajasthan",
  capital = 100000,
  enterpriseName,
}: PersonalDashboardViewProps) {
  const [data, setData] = useState<PersonalDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Co-Pilot Quick Query state
  const [coPilotInput, setCoPilotInput] = useState("");
  const [coPilotMessages, setCoPilotMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    {
      sender: "copilot",
      text: `Namaste! I am your AI Business Co-Pilot monitoring ${enterpriseName || `${locality} Enterprise`}. Your statutory compliance is initiated and operational milestones are scheduled. Ask me any operational or financial query!`,
    },
  ]);
  const [isCoPilotTyping, setIsCoPilotTyping] = useState(false);

  // Goal adding state
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [reminderResponses, setReminderResponses] = useState<Record<string, { action: string; advice: string }>>({});
  const [showNotifications, setShowNotifications] = useState(false);

  // Operational task checklist state
  const [tasks, setTasks] = useState([
    { id: "task-1", title: "Complete FSSAI & Municipal Trade License Dossier", dueDate: "Day 5", done: true, color: "bg-blue-500" },
    { id: "task-2", title: "Core Machinery & Equipment Installation & Testing", dueDate: "Day 12", done: false, color: "bg-emerald-500" },
    { id: "task-3", title: "Direct Raw Material Sourcing Network Agreements", dueDate: "Day 18", done: false, color: "bg-amber-500" },
    { id: "task-4", title: "Local Wholesale Offtake Supply Pacts", dueDate: "Day 25", done: false, color: "bg-orange-500" },
    { id: "task-5", title: "Lead Bank Site Inspection & Disbursement Verification", dueDate: "Day 30", done: false, color: "bg-purple-500" },
  ]);

  useEffect(() => {
    loadDashboard();
  }, [businessIdea, locality, capital]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getPersonalDashboard({
        locality: locality || "Bassi",
        state: state || "Rajasthan",
        business_idea: businessIdea || "Commercial Mini Dairy & Chilling Unit",
        capital: capital || 100000,
        enterprise_name: enterpriseName || (currentUser?.full_name ? `${currentUser.full_name}'s Enterprise` : "Ganga Enterprise"),
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!data || isAddingGoal) return;
    setIsAddingGoal(true);
    try {
      const completedIds = data.goals.filter((g) => g.status === "completed").map((g) => g.goal_id);
      const newGoal = await apiClient.generateNextGoal({
        business_id: data.business_id,
        business_type: data.business_idea,
        completed_goal_ids: completedIds,
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: [newGoal, ...prev.goals],
          running_goals_count: prev.running_goals_count + 1,
        };
      });
    } catch {
      // noop
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleReminderAction = async (reminderId: string, action: string) => {
    try {
      const res = await apiClient.respondToReminder(reminderId, action);
      setReminderResponses((prev) => ({
        ...prev,
        [reminderId]: { action, advice: res.ai_advice },
      }));
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reminders: prev.reminders.map((r) =>
            r.reminder_id === reminderId
              ? { ...r, status: action === "confirm" ? "confirmed" : action === "help" ? "need_help" : "snoozed" }
              : r
          ),
        };
      });
    } catch {
      // noop
    }
  };

  const handleSendCoPilot = async () => {
    const text = coPilotInput.trim();
    if (!text || isCoPilotTyping) return;

    const userMsg = { sender: "user" as const, text };
    setCoPilotMessages((prev) => [...prev, userMsg]);
    setCoPilotInput("");
    setIsCoPilotTyping(true);

    try {
      const res = await apiClient.textChat(
        `[Dashboard AI Co-Pilot Context: Business: ${data?.business_name || enterpriseName}, Idea: ${data?.business_idea || businessIdea}, Locality: ${locality}, Project Cost: ₹${data?.project_cost || (capital / 0.10)}] Operational query: ${text}`,
        "en"
      );
      setCoPilotMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: res.agent_response || "I have analyzed your operational query. Keep monitoring daily throughput and ensure statutory compliance logs are up to date.",
        },
      ]);
    } catch {
      setCoPilotMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "Advisor note: Maintain your daily supplier intake register and track the DTFC physical verification pass.",
        },
      ]);
    } finally {
      setIsCoPilotTyping(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  };

  const toggleGoalStatus = (goalId: string) => {
    if (!data) return;
    setData({
      ...data,
      goals: data.goals.map((g) => {
        if (g.goal_id === goalId) {
          const nextStatus = g.status === "completed" ? "in_progress" : g.status === "in_progress" ? "completed" : "in_progress";
          const nextProgress = nextStatus === "completed" ? 100 : 50;
          return { ...g, status: nextStatus, progress_percent: nextProgress };
        }
        return g;
      }),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#0A2540] animate-spin mb-4" />
        <p className="font-serif text-lg font-semibold text-[#0A2540]">
          Loading Your Personal Enterprise Dashboard...
        </p>
        <p className="font-sans text-xs text-neutral-500 mt-1">
          Generating live government loan pipeline, tailored operational goals & health checks
        </p>
      </div>
    );
  }

  const dash = data || {
    business_id: "BIZ-884210",
    business_name: enterpriseName || (currentUser?.full_name ? `${currentUser.full_name}'s Enterprise` : "Ganga Enterprise"),
    locality: locality,
    state: state,
    business_idea: businessIdea,
    capital: capital,
    project_cost: Math.round(capital / 0.10),
    health_score: 84,
    total_milestones_count: 24,
    completed_milestones_count: 10,
    running_goals_count: 12,
    pending_goals_count: 2,
    loan_progress: {
      application_ref: `PMEGP-${state.slice(0, 2).toUpperCase()}-2026-884210`,
      scheme_name: "Prime Minister's Employment Generation Programme (PMEGP)",
      portal_name: "KVIC Online DBT Portal",
      loan_amount: Math.round((capital / 0.10) - capital),
      subsidy_amount: Math.round((capital / 0.10) * 0.25),
      promoter_equity: capital,
      bank_branch: `State Bank of India (SBI), ${locality} Main Branch (IFSC: SBIN0031256)`,
      current_stage_index: 3,
      total_stages: 5,
      overall_progress_percent: 60,
      target_disbursement_date: "15 Oct 2026",
      stages: [] as LoanStage[],
    },
    goals: [] as AIBusinessGoal[],
    reminders: [] as DashboardReminder[],
    metrics: [],
    alerts: [],
    co_pilot_status: "Active & Monitoring Heartbeat",
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans text-neutral-800">
      {/* 1. TOP HEADER BAR: OFFICIAL SAHAAY LOGO (LEFT), NOTIFICATION BELL & USER PROFILE (RIGHT) */}
      <header className="h-18 bg-white/85 backdrop-blur-md border-b border-white/60 px-6 sm:px-10 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-subtle">
        {/* Left Topmost Corner: Official Logo Button that redirects to Home */}
        <button
          onClick={onBackToHome}
          className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity group cursor-pointer"
          title="Click to return to Sahaay Home"
        >
          <div className="relative w-12 h-12 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Image
              src="/sahaay-logo.png"
              alt="Sahaay Logo"
              width={48}
              height={48}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-lg text-[#0A2540] tracking-tight leading-tight">
                Sahaay
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                Dashboard
              </span>
            </div>
            <span className="font-sans text-[11px] text-emerald-700 font-medium block leading-tight">
              Enterprise Cockpit • Click to Home
            </span>
          </div>
        </button>

        {/* Right Corner: Notification Bell, User Profile, and Back to Home / Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 flex items-center justify-center text-neutral-600 transition-colors relative cursor-pointer"
              title="Operational Notifications"
              aria-label="Operational Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D96B27] absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#D96B27]" />
                      <h4 className="font-serif font-bold text-sm text-[#0A2540]">Active Notifications</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D96B27]/10 text-[#D96B27]">
                      3 New
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto">
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">DTFC Scrutiny</span>
                        <span className="text-[10px] text-neutral-400">Today</span>
                      </div>
                      <p className="text-xs font-medium text-neutral-800 mt-1">
                        DTFC physical scrutiny scheduled at District DIC. Ensure DPR hard copies are signed.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Operations</span>
                        <span className="text-[10px] text-neutral-400">Yesterday</span>
                      </div>
                      <p className="text-xs font-medium text-neutral-800 mt-1">
                        Daily operational volume verification pending. Upload milk collection logs.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Disbursement</span>
                        <span className="text-[10px] text-neutral-400">2 days ago</span>
                      </div>
                      <p className="text-xs font-medium text-neutral-800 mt-1">
                        Bank credit officer site inspection clearance is proceeding on schedule.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex justify-end">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
            <div className="w-9 h-9 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              {(currentUser?.full_name || dash.business_name).charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-sans text-xs font-bold text-[#0A2540] block leading-tight">
                {currentUser?.full_name || "Enterprise Promoter"}
              </span>
              <span className="font-sans text-[10px] text-neutral-500 block leading-tight max-w-[160px] truncate">
                {dash.business_name} • {dash.locality}
              </span>
            </div>
          </div>

          {/* Back to Home Button */}
          <button
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Return to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Home</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTAINER: SPACIOUS, PROPORTIONAL FULL-WIDTH LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Dashboard Title & Confirmed Enterprise Subtitle */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight">
                Dashboard
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/20">
                Live Confirmed Enterprise
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1">
              Plan, prioritize, and accomplish your enterprise milestones with AI guidance •{" "}
              <strong className="text-neutral-700 font-semibold">{dash.business_name}</strong> ({dash.business_idea}, {dash.locality}, {dash.state})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 font-semibold shadow-xs">
              Project Outlay: <strong className="text-[#0A2540]">₹{dash.project_cost.toLocaleString("en-IN")}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 font-semibold shadow-xs">
              Margin Money: <strong className="text-[#D96B27]">₹{dash.capital.toLocaleString("en-IN")}</strong>
            </span>
          </div>
        </div>

        {/* 3. TOP 4 STAT CARDS ROW (PROPORTIONAL 4-COL GRID) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Milestones (Deep Forest Green Accent Card) */}
          <div className="rounded-3xl bg-[#2D5A27] p-5 sm:p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-emerald-100">
                Total Milestones
              </span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="my-3">
              <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                {dash.total_milestones_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-emerald-100">
                +14%
              </span>
              <span className="text-[10px] text-emerald-200 truncate">
                Increased from last month
              </span>
            </div>
          </div>

          {/* Card 2: Completed Goals */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 border border-neutral-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-neutral-500">
                Completed Goals
              </span>
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-neutral-600" />
              </div>
            </div>
            <div className="my-3">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight">
                {dash.completed_milestones_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +8%
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                Increased from last month
              </span>
            </div>
          </div>

          {/* Card 3: Running Goals */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 border border-neutral-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-neutral-500">
                Running Goals
              </span>
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-neutral-600" />
              </div>
            </div>
            <div className="my-3">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight">
                {dash.running_goals_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                +5%
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                Active in progress
              </span>
            </div>
          </div>

          {/* Card 4: Pending Approvals */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 border border-neutral-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-neutral-500">
                Pending Approvals
              </span>
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-neutral-600" />
              </div>
            </div>
            <div className="my-3">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight">
                {dash.pending_goals_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                DTFC & Bank
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                On schedule
              </span>
            </div>
          </div>
        </div>

        {/* 4. MAIN 2-COLUMN BALANCED PROPORTIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (7 COLS): 5-STAGE LOAN PIPELINE & AI-DECIDED BUSINESS GOALS */}
          <div className="lg:col-span-7 space-y-6">
            {/* PANEL 1: GOVERNMENT LOAN APPLICATION PIPELINE */}
            <div className="rounded-3xl bg-white p-6 sm:p-7 border border-neutral-200/90 shadow-subtle">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0A2540]">
                      Government Loan Pipeline
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {dash.loan_progress.overall_progress_percent}% Sanctioned
                    </span>
                  </div>
                  <p className="font-sans text-xs text-neutral-500 mt-0.5">
                    {dash.loan_progress.scheme_name} • Ref:{" "}
                    <span className="font-semibold text-neutral-700 font-mono">
                      {dash.loan_progress.application_ref}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    Target Disbursement
                  </span>
                  <span className="font-sans text-xs font-bold text-[#2D5A27]">
                    {dash.loan_progress.target_disbursement_date}
                  </span>
                </div>
              </div>

              {/* Loan Amount Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 mb-5">
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Bank Loan (90%)
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-[#0A2540]">
                    ₹{dash.loan_progress.loan_amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                    Govt Subsidy (25%)
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-emerald-700">
                    ₹{dash.loan_progress.subsidy_amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Promoter Margin
                  </span>
                  <span className="font-sans text-sm sm:text-base font-bold text-[#D96B27]">
                    ₹{dash.loan_progress.promoter_equity.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* 5-Stage Stepper Pipeline */}
              <div className="space-y-3">
                {dash.loan_progress.stages.map((stage) => {
                  const isDone = stage.status === "completed";
                  const isCurrent = stage.status === "in_progress";

                  return (
                    <div
                      key={stage.stage_id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200"
                          : isDone
                          ? "bg-neutral-50/70 border-neutral-200"
                          : "bg-white border-neutral-100 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isDone
                              ? "bg-[#2D5A27] text-white"
                              : isCurrent
                              ? "bg-[#D96B27] text-white animate-pulse"
                              : "bg-neutral-200 text-neutral-500"
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : stage.stage_id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-sans text-xs sm:text-sm font-bold text-[#0A2540] truncate">
                              {stage.title}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isDone
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isCurrent
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              {isDone ? "Completed" : isCurrent ? "Active In Review" : "Pending"}
                            </span>
                          </div>
                          <p className="font-sans text-xs text-neutral-600 mt-1">
                            {stage.description}
                          </p>
                          {stage.action_required && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{stage.action_required}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#2D5A27]" />
                  {dash.loan_progress.bank_branch}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  100% CGFMU Guarantee Active
                </span>
              </div>
            </div>

            {/* PANEL 2: AI-DECIDED OPERATIONAL BUSINESS GOALS (Sequential Progress) */}
            <div className="rounded-3xl bg-white p-6 sm:p-7 border border-neutral-200/90 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0A2540]">
                    AI-Decided Business Goals
                  </h2>
                  <p className="font-sans text-xs text-neutral-500 mt-0.5">
                    Sequential milestones computed for {dash.business_idea} to achieve local break-even.
                  </p>
                </div>
                {/* + Ask AI Next Goal button placed contextually here! */}
                <button
                  onClick={handleAddGoal}
                  disabled={isAddingGoal}
                  className="px-3.5 py-2 rounded-full bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  title="Ask AI to generate next sequential goal"
                >
                  {isAddingGoal ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  <span>+ Ask AI Next Goal</span>
                </button>
              </div>

              {/* Goals List */}
              <div className="space-y-3.5">
                {dash.goals.map((goal) => {
                  const isDone = goal.status === "completed";
                  const isInProg = goal.status === "in_progress";

                  return (
                    <div
                      key={goal.goal_id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDone
                          ? "bg-emerald-50/30 border-neutral-200"
                          : isInProg
                          ? "bg-white border-neutral-200 shadow-xs"
                          : "bg-neutral-50/60 border-neutral-100 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold font-mono text-neutral-400">
                              {goal.goal_id}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                              {goal.category}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                goal.priority === "high"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {goal.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <h4 className="font-sans text-xs sm:text-sm font-bold text-[#0A2540]">
                            {goal.title}
                          </h4>
                          <p className="font-sans text-xs text-neutral-600 mt-1 leading-relaxed">
                            {goal.description}
                          </p>

                          {/* AI Rationale box */}
                          <div className="mt-2.5 text-[11px] text-[#2D5A27] bg-[#2D5A27]/5 px-3 py-1.5 rounded-xl border border-[#2D5A27]/10 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#D96B27]" />
                            <span>
                              <strong className="font-semibold">AI Rationale:</strong> {goal.ai_rationale}
                            </span>
                          </div>
                        </div>

                        {/* Progress toggle button */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={() => toggleGoalStatus(goal.goal_id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isDone
                                ? "bg-[#2D5A27] text-white border-[#2D5A27]"
                                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200"
                            }`}
                            title={isDone ? "Mark as in progress" : "Mark as completed"}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] font-bold text-neutral-500 font-mono">
                            {goal.progress_percent}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-3.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone ? "bg-[#2D5A27]" : isInProg ? "bg-[#D96B27]" : "bg-neutral-300"
                          }`}
                          style={{ width: `${goal.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS): PROACTIVE REMINDERS, 41% CURVED GAUGE, TASKS, AI CO-PILOT CHAT */}
          <div className="lg:col-span-5 space-y-6">
            {/* CARD 1: PROACTIVE OPERATIONAL REMINDERS */}
            <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-subtle">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Reminders
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D96B27]/10 text-[#D96B27]">
                  Proactive Health Check
                </span>
              </div>

              {dash.reminders.length > 0 && (
                <div>
                  <h3 className="font-serif text-base font-bold text-[#0A2540]">
                    {dash.reminders[0].title}
                  </h3>
                  <p className="font-sans text-xs text-neutral-600 mt-1.5 leading-snug">
                    {dash.reminders[0].question}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      Metric: {dash.reminders[0].target_metric}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {dash.reminders[0].created_at}
                    </span>
                  </div>

                  {/* Interactive Response Action Buttons */}
                  <div className="mt-4 flex flex-col gap-2">
                    {reminderResponses[dash.reminders[0].reminder_id] ? (
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                        <span className="font-bold block mb-0.5">Response Logged:</span>
                        {reminderResponses[dash.reminders[0].reminder_id].advice}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReminderAction(dash.reminders[0].reminder_id, "confirm")}
                          className="flex-1 py-2.5 px-4 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Target Met</span>
                        </button>
                        <button
                          onClick={() => handleReminderAction(dash.reminders[0].reminder_id, "help")}
                          className="py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all cursor-pointer"
                          title="Flag issue to AI advisor"
                        >
                          Need Help
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: PROJECT PROGRESS (41% CURVED SVG GAUGE EXACT MATCH TO MOCKUP) */}
            <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-subtle flex flex-col items-center justify-between text-center">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="font-serif text-sm font-bold text-[#0A2540]">
                  Project Progress
                </h3>
                <span className="text-[11px] font-semibold text-neutral-400">
                  Q4 2026
                </span>
              </div>

              {/* Curved Semi-Circle Donut Gauge */}
              <div className="relative w-52 h-30 my-2 flex items-end justify-center">
                <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                  <defs>
                    <pattern id="hatchPattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="2" />
                    </pattern>
                  </defs>

                  {/* Background track (Grey) */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />

                  {/* Pending hatched arc (right portion) */}
                  <path
                    d="M 130 35 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#hatchPattern)"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />

                  {/* In Progress Mid-Green arc */}
                  <path
                    d="M 90 22 A 80 80 0 0 1 130 35"
                    fill="none"
                    stroke="#87A96B"
                    strokeWidth="24"
                  />

                  {/* Completed Solid Dark Green Arc matching mockup 41% */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 90 22"
                    fill="none"
                    stroke="#144A29"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Centered Percentage Label matching mockup 41% Project Ended */}
                <div className="absolute bottom-0 flex flex-col items-center">
                  <span className="font-serif text-3xl font-bold text-[#0A2540] tracking-tight leading-none">
                    41%
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium mt-1">
                    Project Ended
                  </span>
                </div>
              </div>

              {/* Gauge Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-neutral-100 w-full text-[11px] text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#144A29]" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#87A96B]" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 border border-neutral-400" />
                  <span>Pending</span>
                </div>
              </div>
            </div>

            {/* CARD 3: OPERATIONAL TASKS CHECKLIST ("PROJECT") */}
            <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-subtle">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-sm font-bold text-[#0A2540]">
                  Operational Tasks
                </h3>
                <button
                  onClick={() => {
                    const newTaskTitle = prompt("Enter new operational task:");
                    if (newTaskTitle) {
                      setTasks((prev) => [
                        ...prev,
                        {
                          id: `task-${Date.now()}`,
                          title: newTaskTitle,
                          dueDate: "Day 35",
                          done: false,
                          color: "bg-emerald-500",
                        },
                      ]);
                    }
                  }}
                  className="text-xs font-bold text-[#2D5A27] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          task.done
                            ? "bg-[#2D5A27] border-[#2D5A27] text-white"
                            : "border-neutral-300 group-hover:border-neutral-400"
                        }`}
                      >
                        {task.done && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <span
                          className={`font-sans text-xs font-semibold block leading-tight ${
                            task.done ? "line-through text-neutral-400" : "text-neutral-800"
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 block leading-tight mt-0.5">
                          Target {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${task.color}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 4: AI BUSINESS CO-PILOT OPERATIONAL STATION (WITHOUT TIME TRACKER PER REQUEST) */}
            <div className="rounded-3xl bg-gradient-to-b from-[#0A2540] to-[#144A29] p-6 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    AI Business Co-Pilot
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full">
                  Heartbeat Active
                </span>
              </div>

              <p className="text-xs text-white/80 leading-relaxed mb-3">
                Ask any daily operational, bank scrutiny, or cash flow query for your {dash.business_idea}.
              </p>

              {/* Chat Thread */}
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-[11px] mb-3">
                {coPilotMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl leading-relaxed ${
                      m.sender === "user"
                        ? "bg-white/20 text-white ml-4 text-right"
                        : "bg-black/30 text-emerald-100 mr-4 border border-white/10"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {isCoPilotTyping && (
                  <div className="text-[10px] text-emerald-300 italic flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Co-Pilot is analyzing your query...</span>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={coPilotInput}
                  onChange={(e) => setCoPilotInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCoPilot()}
                  placeholder="Ask advisor about today's operations..."
                  className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-sans"
                />
                <button
                  onClick={handleSendCoPilot}
                  disabled={!coPilotInput.trim() || isCoPilotTyping}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
