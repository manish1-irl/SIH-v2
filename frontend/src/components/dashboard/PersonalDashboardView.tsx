"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Search,
  Bell,
  ShieldCheck,
  Building2,
  Landmark,
  Compass,
  FileText,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Send,
  ChevronRight,
  Calendar,
  Layers,
  Activity,
  ArrowLeft,
  HelpCircle,
  LogOut,
  Settings,
  Briefcase,
  Check,
  FileDown,
  Loader2,
  CheckCheck,
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
  onOpenSchemes: () => void;
  onOpenFeasibility: () => void;
  onOpenExplore: () => void;
}

export default function PersonalDashboardView({
  currentUser,
  onBackToHome,
  onLogout,
  onOpenSchemes,
  onOpenFeasibility,
  onOpenExplore,
}: PersonalDashboardViewProps) {
  const [data, setData] = useState<PersonalDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "loan" | "goals" | "tasks" | "analytics">("dashboard");

  // Timer State for Time Tracker / AI Co-Pilot Station
  const [timerSeconds, setTimerSeconds] = useState(5048); // 01:24:08 matching mockup
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // AI Co-Pilot Quick Query state
  const [coPilotInput, setCoPilotInput] = useState("");
  const [coPilotMessages, setCoPilotMessages] = useState<Array<{ sender: "user" | "copilot"; text: string; time: string }>>([
    {
      sender: "copilot",
      text: "Namaste! I am your AI Business Co-Pilot monitoring your Bassi Dairy Unit. Your FSSAI license is active and morning milk collection is on track. How can I assist you right now?",
      time: "Just now",
    },
  ]);
  const [isCoPilotTyping, setIsCoPilotTyping] = useState(false);

  // Goal adding state
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [reminderResponses, setReminderResponses] = useState<Record<string, { action: string; advice: string }>>({});

  // Operational task checklist state
  const [tasks, setTasks] = useState([
    { id: "task-1", title: "Complete FSSAI Physical Inspection Dossier", dueDate: "Dec 24, 2026", done: true, color: "bg-blue-500" },
    { id: "task-2", title: "Bulk Milk Chiller (1,000L) Sensor Calibration", dueDate: "Dec 26, 2026", done: false, color: "bg-emerald-500" },
    { id: "task-3", title: "Sign Aggregator Agreements (15 Villages)", dueDate: "Dec 29, 2026", done: false, color: "bg-amber-500" },
    { id: "task-4", title: "Highway Dhaba Wholesale Supply Contract (NH-21)", dueDate: "Jan 03, 2027", done: false, color: "bg-orange-500" },
    { id: "task-5", title: "Cross-District Quality Fat Testing Verification", dueDate: "Jan 08, 2027", done: false, color: "bg-purple-500" },
  ]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getPersonalDashboard({
        locality: "Bassi",
        state: "Rajasthan",
        business_idea: "Commercial Mini Dairy & Bulk Chilling Unit",
        capital: 100000,
        enterprise_name: currentUser?.full_name ? `${currentUser.full_name}'s Dairy Parlour` : "Ganga Dairy Parlour",
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

    const userMsg = { sender: "user" as const, text, time: "Just now" };
    setCoPilotMessages((prev) => [...prev, userMsg]);
    setCoPilotInput("");
    setIsCoPilotTyping(true);

    try {
      const res = await apiClient.textChat(
        `[Personal Dashboard Context: Business: Ganga Dairy Parlour Bassi, Stage: DTFC Scrutiny, Capital: ₹1,00,000, Health Score: 84%] User operational query: ${text}`,
        "en"
      );
      setCoPilotMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: res.agent_response || "I have analyzed your operational query. Keep monitoring the 4°C chilling compressor and submit the DIC inspection papers.",
          time: "Just now",
        },
      ]);
    } catch {
      setCoPilotMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "Advisor update: For your Bassi milk collection, maintain morning intake logs before 9:00 AM. DTFC verification requires 3 signed hard copies.",
          time: "Just now",
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
          Syncing loan pipeline, AI business goals & live monitoring heartbeat
        </p>
      </div>
    );
  }

  const dash = data || {
    business_id: "BIZ-884210",
    business_name: currentUser?.full_name ? `${currentUser.full_name}'s Dairy Parlour` : "Ganga Dairy Parlour",
    locality: "Bassi",
    state: "Rajasthan",
    business_idea: "Commercial Mini Dairy & Bulk Chilling Unit",
    capital: 100000,
    project_cost: 1000000,
    health_score: 84,
    total_milestones_count: 24,
    completed_milestones_count: 10,
    running_goals_count: 12,
    pending_goals_count: 2,
    loan_progress: {
      application_ref: "PMEGP-RJ-2026-884210",
      scheme_name: "Prime Minister's Employment Generation Programme (PMEGP)",
      portal_name: "KVIC Online DBT Portal",
      loan_amount: 900000,
      subsidy_amount: 250000,
      promoter_equity: 100000,
      bank_branch: "State Bank of India (SBI), Bassi Main Branch (IFSC: SBIN0031256)",
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
    <div className="min-h-screen bg-[#F4F5F7] flex font-sans text-neutral-800">
      {/* 1. LEFT SIDEBAR MATCHING MOCKUP */}
      <aside className="w-64 bg-white border-r border-neutral-200/80 hidden lg:flex flex-col justify-between shrink-0 p-5 select-none">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 py-1 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#2D5A27] flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
              S
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#0A2540] tracking-tight block leading-tight">
                Sahaay
              </span>
              <span className="text-[10px] font-sans font-semibold text-neutral-400 tracking-wider uppercase">
                Enterprise Co-Pilot
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2 block">
                Menu
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "dashboard"
                      ? "bg-[#2D5A27] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  {activeTab === "dashboard" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("loan")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "loan"
                      ? "bg-[#2D5A27] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Landmark className="w-4 h-4" />
                    <span>Loan Pipeline</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "loan" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}>
                    Stage 3
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("goals")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "goals"
                      ? "bg-[#2D5A27] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Business Goals</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "goals" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}>
                    {dash.goals.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "tasks"
                      ? "bg-[#2D5A27] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <span>Operational Tasks</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "tasks" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}>
                    5
                  </span>
                </button>

                <button
                  onClick={onOpenExplore}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-4 h-4" />
                    <span>Cluster Network</span>
                  </div>
                </button>
              </nav>
            </div>

            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2 block">
                General
              </span>
              <nav className="space-y-1">
                <button
                  onClick={onOpenFeasibility}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <Activity className="w-4 h-4" />
                  <span>Feasibility Matrix</span>
                </button>
                <button
                  onClick={onOpenSchemes}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Scheme Calculator</span>
                </button>
                <button
                  onClick={onBackToHome}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Ambient Card matching mockup "Download our Mobile App" */}
        <div className="rounded-2xl bg-gradient-to-b from-[#0A2540] to-[#123E2A] p-4 text-white relative overflow-hidden shadow-md">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              AI Heartbeat Active
            </span>
          </div>
          <h4 className="font-serif font-bold text-xs leading-snug mb-1">
            Sahaay Mobile & Offline
          </h4>
          <p className="text-[11px] text-white/70 mb-3 leading-tight">
            Sync your dairy records and loan alerts directly via SMS or App.
          </p>
          <button
            onClick={() => alert("Offline sync package cached! You can work seamlessly without internet connection.")}
            className="w-full py-2 px-3 rounded-xl bg-[#2D5A27] hover:bg-[#386e30] text-white font-sans text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Sync Offline</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar matching mockup */}
        <header className="h-18 bg-white border-b border-neutral-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
          {/* Mobile Brand / Title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-neutral-100 text-neutral-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-serif font-bold text-base text-[#0A2540]">
              Dashboard
            </span>
          </div>

          {/* Search bar matching mockup Search in task ... ⌘K */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-100/80 border border-neutral-200 text-neutral-500 w-72 focus-within:w-88 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2D5A27]/20 transition-all">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Search in goals, loan pipeline..."
              className="bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none w-full font-sans"
            />
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 shrink-0">
              ⌘K
            </span>
          </div>

          {/* Right Header: Notification, User Profile, and Quick Action buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => alert("All 3 operational notifications are up to date.")}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200/80 flex items-center justify-center text-neutral-600 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#D96B27] absolute top-2 right-2 ring-2 ring-white" />
            </button>

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200">
              <div className="w-9 h-9 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
                {dash.business_name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <span className="font-sans text-xs font-bold text-[#0A2540] block leading-tight">
                  {currentUser?.full_name || "Ramesh Kumar"}
                </span>
                <span className="font-sans text-[10px] text-neutral-400 block leading-tight">
                  {dash.business_name} • {dash.locality}
                </span>
              </div>
            </div>

            {/* Primary Action Button: Add Project / Add Goal */}
            <button
              onClick={handleAddGoal}
              disabled={isAddingGoal}
              className="px-3.5 py-2 rounded-full bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isAddingGoal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Add AI Goal</span>
            </button>

            {/* Secondary Action Button: Import Data / DPR Report */}
            <button
              onClick={() => onOpenFeasibility()}
              className="px-3 py-2 rounded-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs font-semibold transition-all hidden md:flex items-center gap-1.5 shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5 text-neutral-500" />
              <span>DPR Report</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 3. MAIN DASHBOARD BODY */}
        <main className="p-5 sm:p-7 max-w-7xl w-full mx-auto space-y-6">
          {/* Dashboard Title & Subtitle matching mockup */}
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight">
              Dashboard
            </h1>
            <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-0.5">
              Plan, prioritize, and accomplish your enterprise milestones with AI guidance.
            </p>
          </div>

          {/* 4. TOP 4 STAT CARDS ROW MATCHING MOCKUP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Total Milestones (Dark Forest Green Highlight Card) */}
            <div className="rounded-3xl bg-[#2D5A27] p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-emerald-100">
                  Total Milestones
                </span>
                <button className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </button>
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
                <span className="text-[10px] text-emerald-200">
                  Increased from last month
                </span>
              </div>
            </div>

            {/* Card 2: Completed Goals */}
            <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-neutral-500">
                  Completed Goals
                </span>
                <button className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-neutral-600" />
                </button>
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
                <span className="text-[10px] text-neutral-400">
                  Increased from last month
                </span>
              </div>
            </div>

            {/* Card 3: Running Goals */}
            <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-neutral-500">
                  Running Goals
                </span>
                <button className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-neutral-600" />
                </button>
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
                <span className="text-[10px] text-neutral-400">
                  Active in progress
                </span>
              </div>
            </div>

            {/* Card 4: Pending Approvals */}
            <div className="rounded-3xl bg-white p-5 border border-neutral-200/90 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-neutral-500">
                  Pending Approvals
                </span>
                <button className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-neutral-600" />
                </button>
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
                <span className="text-[10px] text-neutral-400">
                  On schedule
                </span>
              </div>
            </div>
          </div>

          {/* 5. MAIN 3-PANEL GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT / CENTER-LEFT (7 COLS): LOAN PIPELINE & AI GOALS */}
            <div className="lg:col-span-7 space-y-5">
              {/* PANEL 1: GOVERNMENT LOAN APPLICATION PIPELINE */}
              <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-subtle">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg font-bold text-[#0A2540]">
                        Government Loan Pipeline
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {dash.loan_progress.overall_progress_percent}% Sanctioned
                      </span>
                    </div>
                    <p className="font-sans text-xs text-neutral-500 mt-0.5">
                      {dash.loan_progress.scheme_name} • Application Ref:{" "}
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
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 mb-5">
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Bank Term Loan (90%)
                    </span>
                    <span className="font-sans text-sm font-bold text-[#0A2540]">
                      ₹{dash.loan_progress.loan_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                      Govt Subsidy (25%)
                    </span>
                    <span className="font-sans text-sm font-bold text-emerald-700">
                      ₹{dash.loan_progress.subsidy_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      Promoter Margin
                    </span>
                    <span className="font-sans text-sm font-bold text-[#D96B27]">
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
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200"
                            : isDone
                            ? "bg-neutral-50/70 border-neutral-200"
                            : "bg-white border-neutral-100 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
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
                              <h4 className="font-sans text-xs font-bold text-[#0A2540] truncate">
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
                            <p className="font-sans text-[11px] text-neutral-500 mt-0.5">
                              {stage.description}
                            </p>
                            {stage.action_required && (
                              <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{stage.action_required}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#2D5A27]" />
                    {dash.loan_progress.bank_branch}
                  </span>
                  <button
                    onClick={() => alert("Connecting to DIC Jaipur Portal for DTFC hearing pass...")}
                    className="font-semibold text-[#2D5A27] hover:underline"
                  >
                    View DIC Portal &rarr;
                  </button>
                </div>
              </div>

              {/* PANEL 2: AI-DECIDED OPERATIONAL BUSINESS GOALS */}
              <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-subtle">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#0A2540]">
                      AI-Decided Business Goals
                    </h2>
                    <p className="font-sans text-xs text-neutral-500 mt-0.5">
                      Sequential milestones computed for local break-even and sustainable cash flow.
                    </p>
                  </div>
                  <button
                    onClick={handleAddGoal}
                    disabled={isAddingGoal}
                    className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-[#2D5A27] hover:text-white text-neutral-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {isAddingGoal ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-[#D96B27]" />
                    )}
                    <span>+ Ask AI Next Goal</span>
                  </button>
                </div>

                {/* Goals List */}
                <div className="space-y-3">
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
                            <div className="flex items-center gap-2 mb-1">
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
                            <div className="mt-2 text-[11px] text-[#2D5A27] bg-[#2D5A27]/5 px-2.5 py-1.5 rounded-xl border border-[#2D5A27]/10 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 shrink-0 text-[#D96B27]" />
                              <span>
                                <strong className="font-semibold">AI Rationale:</strong> {goal.ai_rationale}
                              </span>
                            </div>
                          </div>

                          {/* Progress toggle button */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <button
                              onClick={() => toggleGoalStatus(goal.goal_id)}
                              className={`p-2 rounded-xl border transition-all ${
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
                        <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-3 overflow-hidden">
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

            {/* RIGHT (5 COLS): REMINDERS, 41% PROGRESS GAUGE, OPERATIONAL TASKS, TIME TRACKER */}
            <div className="lg:col-span-5 space-y-5">
              {/* CARD C: PROACTIVE REMINDERS MATCHING MOCKUP */}
              <div className="rounded-3xl bg-white p-6 border border-neutral-200/90 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Reminders
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D96B27]/10 text-[#D96B27]">
                    Proactive Health Check
                  </span>
                </div>

                {dash.reminders.length > 0 && (
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#0A2540]">
                      {dash.reminders[0].title}
                    </h3>
                    <p className="font-sans text-xs text-neutral-600 mt-1 leading-snug">
                      {dash.reminders[0].question}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        Metric: {dash.reminders[0].target_metric}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {dash.reminders[0].created_at}
                      </span>
                    </div>

                    {/* Interactive Response Action Buttons matching mockup Start Meeting */}
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
                            className="flex-1 py-2.5 px-4 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm Target Met</span>
                          </button>
                          <button
                            onClick={() => handleReminderAction(dash.reminders[0].reminder_id, "help")}
                            className="py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all"
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

              {/* CARD D: PROJECT PROGRESS (41% CURVED SVG GAUGE EXACT MATCH TO MOCKUP) */}
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
                <div className="relative w-48 h-28 my-2 flex items-end justify-center">
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

                {/* Gauge Legend matching mockup */}
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

              {/* CARD E: OPERATIONAL TASK CHECKLIST MATCHING MOCKUP PROJECT */}
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
                            dueDate: "Jan 15, 2027",
                            done: false,
                            color: "bg-emerald-500",
                          },
                        ]);
                      }
                    }}
                    className="text-xs font-bold text-[#2D5A27] hover:underline flex items-center gap-1"
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
                            Due {task.dueDate}
                          </span>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${task.color}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD F: TIME TRACKER & AI CO-PILOT ACTIVE STATION MATCHING MOCKUP */}
              <div className="rounded-3xl bg-gradient-to-b from-[#144A29] to-[#0A2540] p-6 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                      Time Tracker & Co-Pilot
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300/80 bg-white/10 px-2 py-0.5 rounded-full">
                    Live Session
                  </span>
                </div>

                {/* Big Ticking Timer display matching mockup 01:24:08 */}
                <div className="text-center my-3">
                  <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                    {formatTimer(timerSeconds)}
                  </span>
                </div>

                {/* Controls matching mockup Pause / Stop */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shadow-sm"
                    title={isTimerRunning ? "Pause timer" : "Resume timer"}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => setTimerSeconds(0)}
                    className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-sm"
                    title="Reset Session Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Interactive AI Co-Pilot Chatbox */}
                <div className="pt-3 border-t border-white/15 space-y-2">
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                    {coPilotMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl leading-relaxed ${
                          m.sender === "user"
                            ? "bg-white/20 text-white ml-4 text-right"
                            : "bg-black/30 text-emerald-100 mr-4"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}
                    {isCoPilotTyping && (
                      <div className="text-[10px] text-emerald-300 italic flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI Co-Pilot is generating guidance...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <input
                      type="text"
                      value={coPilotInput}
                      onChange={(e) => setCoPilotInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCoPilot()}
                      placeholder="Ask Co-Pilot about today's operations..."
                      className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-sans"
                    />
                    <button
                      onClick={handleSendCoPilot}
                      disabled={!coPilotInput.trim() || isCoPilotTyping}
                      className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
