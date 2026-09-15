"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Network,
  Store,
  Truck,
  Package,
  Snowflake,
  Check,
  CheckCircle2,
  Plus,
  Star,
  MapPin,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Sliders,
  RefreshCw,
  Info,
  Layers,
  Users,
  Compass,
  Calculator,
  FileDown,
  Lock,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { ClusterNetworkResponse, ClusterNode } from "@/types";

interface ClusterNetworkFlowProps {
  onBackToHome: () => void;
  onProceedToSchemes?: () => void;
  onProceedToFeasibility?: () => void;
  onProceedToDpr?: () => void;
  initialLocality?: string;
  initialBusinessIdea?: string;
}

const LOCALITY_PRESETS = [
  { locality: "Bassi", idea: "Dairy", label: "Bassi (Dairy & Chilling Hub)" },
  { locality: "Bharatpur", idea: "Mustard", label: "Bharatpur (Agro-Oilseed Expeller)" },
  { locality: "Sanganer", idea: "Textile", label: "Sanganer (Handloom & Dyeing)" },
  { locality: "Pratapnagar", idea: "Retail Food", label: "Pratapnagar (Food & FMCG)" },
];

export default function ClusterNetworkFlow({
  onBackToHome,
  onProceedToSchemes,
  onProceedToFeasibility,
  onProceedToDpr,
  initialLocality = "Bassi",
  initialBusinessIdea = "Dairy",
}: ClusterNetworkFlowProps) {
  const [locality, setLocality] = useState(initialLocality);
  const [businessIdea, setBusinessIdea] = useState(initialBusinessIdea);
  const [enterpriseName, setEnterpriseName] = useState("Ganga Dairy Parlour");

  // Connected state: set of node IDs connected
  const [connectedNodeIds, setConnectedNodeIds] = useState<string[]>([]);
  const [isParamEditorOpen, setIsParamEditorOpen] = useState(false);
  const [showPactModal, setShowPactModal] = useState(false);
  const [allianceConfirmed, setAllianceConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Server cluster response
  const [clusterData, setClusterData] = useState<ClusterNetworkResponse | null>(null);

  const fetchClusterNetwork = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getClusterNetwork({
        locality: locality.trim() || "Bassi",
        business_idea: businessIdea.trim() || "Dairy",
        enterprise_name: enterpriseName.trim() || "Ganga Dairy Parlour",
      });
      setClusterData(res);
    } catch (err) {
      console.warn("Direct cluster network fetch notice:", err);
      // Fallback matching mockup
      setClusterData({
        locality: locality || "Bassi",
        business_idea: businessIdea || "Dairy",
        hub: {
          name: enterpriseName || "Ganga Dairy Parlour",
          sector: "Retail Dairy & Sweet Shop • 10% Concessional Credit",
          locality_node: `${locality || "Bassi"} Village Center (Core Node)`,
          seeking: "Seeking 150L daily raw milk supply",
          daily_processing_volume: "350 Liters",
          max_peers: 4,
        },
        nodes: [
          {
            id: "node-upstream-1",
            role: "UPSTREAM PRODUCER",
            title: `${locality || "Bassi"} Dairy Farm Node #14`,
            category: "Raw Milk Producer (Cow & Buffalo)",
            distance_km: 2.8,
            capacity_metric: "200L Daily Output",
            rating: 4.9,
            icon_type: "truck",
            synergy_benefit: "Can supply steady 120L evening yield at ₹4/L wholesale discount.",
            estimated_monthly_savings: 14400,
          },
          {
            id: "node-wholesale-2",
            role: "INPUT WHOLESALE",
            title: "Regional Mandi Feed & Mineral Depot #06",
            category: "Mandi Distributor (Mineral & Fodder)",
            distance_km: 3.5,
            capacity_metric: "Mandi Direct Stock",
            rating: 5.0,
            icon_type: "package",
            synergy_benefit: "Joint purchase of 20+ bags unlocks flat 12% cash discount on feed sacks.",
            estimated_monthly_savings: 6500,
          },
          {
            id: "node-peer-3",
            role: "PEER RETAILER",
            title: `${locality || "Bassi"} Paneer & Dairy Production Unit #22`,
            category: "Dairy & Paneer Production Unit",
            distance_km: 4.1,
            capacity_metric: "80L Daily Surplus",
            rating: 4.8,
            icon_type: "store",
            synergy_benefit: "Looking to offload evening raw milk surplus at cost to avoid wastage.",
            estimated_monthly_savings: 7200,
          },
          {
            id: "node-infra-4",
            role: "INFRASTRUCTURE SHARING",
            title: `${locality || "Bassi"} Community BMC Chiller Hub #03`,
            category: "Bulk Milk Chiller (1,000L Unit)",
            distance_km: 5.2,
            capacity_metric: "NABARD Cooperative",
            rating: 4.9,
            icon_type: "snowflake",
            synergy_benefit: "Offers 200L excess refrigerated slot capacity at ₹1.5/L/day shared fee.",
            estimated_monthly_savings: 9000,
          },
        ],
        collective_perks: [
          "₹4/Litre evening yield discount on direct village milk collection",
          "12% cash discount on bulk cattle mineral feed sacks",
          "Shared 200L refrigeration slot at ₹1.5/L/day preventing souring",
          "Zero-waste surplus re-routing during off-peak sweet sales",
        ],
        unlocked_synergy_note:
          "Connecting all 4 local peers unlocks up to ₹37,100/month in collective margin expansion and spoilage reduction.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterNetwork();
  }, [locality, businessIdea, enterpriseName]);

  const toggleConnectNode = (nodeId: string) => {
    setConnectedNodeIds((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  const nodes = clusterData?.nodes || [];
  const hub = clusterData?.hub || {
    name: enterpriseName,
    sector: "Retail Dairy & Sweet Shop • 10% Concessional Credit",
    locality_node: `${locality} Village Center (Core Node)`,
    seeking: "Seeking 150L daily raw milk supply",
    daily_processing_volume: "350 Liters",
    max_peers: 4,
  };

  // Node position slots matching the mockup:
  // Node 0: Top-Left (Upstream Producer)
  // Node 1: Bottom-Left (Input Wholesale)
  // Node 2: Top-Right (Peer Retailer)
  // Node 3: Bottom-Right (Infrastructure Sharing)
  const node0 = nodes[0];
  const node1 = nodes[1];
  const node2 = nodes[2];
  const node3 = nodes[3];

  const totalConnected = connectedNodeIds.length;

  // Calculated collective savings based on connected nodes
  const totalMonthlySavings = useMemo(() => {
    return nodes
      .filter((n) => connectedNodeIds.includes(n.id))
      .reduce((acc, curr) => acc + curr.estimated_monthly_savings, 0);
  }, [nodes, connectedNodeIds]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "truck":
        return <Truck className="w-4 h-4" />;
      case "package":
        return <Package className="w-4 h-4" />;
      case "store":
        return <Store className="w-4 h-4" />;
      case "snowflake":
        return <Snowflake className="w-4 h-4" />;
      default:
        return <Network className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans select-none text-antigravity-charcoal pb-8">
      {/* Cinematic Vibrant Rural Enterprise Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{ backgroundImage: "url('/rural-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-emerald-950/15 to-[#0A2540]/35 backdrop-brightness-[0.98]" />
      </div>
      {/* Header & Breadcrumbs */}
      <header className="border-b border-antigravity-navy/10 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
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
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold text-sm text-antigravity-navy tracking-tight block leading-tight">
                  Economic Cluster
                </span>
                <span className="text-[10px] text-antigravity-charcoal/60 block leading-tight">
                  Privacy-First Mutual Business Synergy Ring
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsParamEditorOpen(!isParamEditorOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isParamEditorOpen
                  ? "bg-antigravity-navy text-white border-antigravity-navy shadow-sm"
                  : "bg-white text-antigravity-charcoal border-antigravity-navy/15 hover:border-antigravity-orange"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isParamEditorOpen ? "Close Cluster Filter" : "Change Locality"}</span>
            </button>

            {onProceedToSchemes && (
              <button
                onClick={onProceedToSchemes}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5ECE1] text-[#8B2500] hover:bg-[#EBDDCF] text-xs font-semibold transition-all"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Scheme Calculator</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Locality & Business Idea Drawer */}
        {isParamEditorOpen && (
          <div className="bg-antigravity-cream/95 border-t border-antigravity-navy/10 px-4 py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-6xl mx-auto space-y-3">
              {/* Presets Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-antigravity-navy uppercase tracking-wider">
                  Select Regional Cluster:
                </span>
                {LOCALITY_PRESETS.map((preset) => (
                  <button
                    key={preset.locality}
                    onClick={() => {
                      setLocality(preset.locality);
                      setBusinessIdea(preset.idea);
                      if (preset.locality === "Bharatpur") {
                        setEnterpriseName("Kisan Mustard Oil Mills");
                      } else if (preset.locality === "Sanganer") {
                        setEnterpriseName("Jaipur Heritage Prints");
                      } else {
                        setEnterpriseName("Ganga Dairy Parlour");
                      }
                      setConnectedNodeIds([]);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      locality === preset.locality
                        ? "bg-[#8B2500] text-white shadow-sm"
                        : "bg-white text-antigravity-charcoal/80 border border-antigravity-navy/15 hover:border-antigravity-orange"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-antigravity-navy/70">
                    Locality / Block Name
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Bassi, Alwar, Dausa"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-antigravity-navy/20 text-xs font-semibold focus:outline-none focus:border-antigravity-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-antigravity-navy/70">
                    Business Idea / Sector
                  </label>
                  <input
                    type="text"
                    value={businessIdea}
                    onChange={(e) => setBusinessIdea(e.target.value)}
                    placeholder="e.g. Dairy, Mustard Expeller, Food Processing"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-antigravity-navy/20 text-xs font-semibold focus:outline-none focus:border-antigravity-orange"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-antigravity-navy/70">
                    Your Enterprise Label
                  </label>
                  <input
                    type="text"
                    value={enterpriseName}
                    onChange={(e) => setEnterpriseName(e.target.value)}
                    placeholder="e.g. Ganga Dairy Parlour"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-antigravity-navy/20 text-xs font-semibold focus:outline-none focus:border-antigravity-orange"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Cluster Network Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 flex flex-col justify-between">
        {/* Title & Privacy Badge */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Zero Personal Data Leakage • Verifiable Business Nodes</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-antigravity-navy tracking-tight">
              {locality} Local Business Cluster & Synergy Network
            </h1>
          </div>
          <p className="font-sans text-xs sm:text-sm text-antigravity-charcoal/70 max-w-md sm:text-right leading-relaxed">
            Connect with verified complementary local businesses to pool bulk orders, share logistics,
            and eliminate post-harvest wastage.
          </p>
        </div>

        {/* ========================================================= */}
        {/* NETWORK VISUALIZATION CANVAS (Matching Mockup) */}
        {/* ========================================================= */}
        <div className="relative w-full py-4">
          {/* Background SVG Animated Network Connecting Lines */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Flowing Linear Gradients */}
                <linearGradient id="connectedGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#87A96B" />
                  <stop offset="50%" stopColor="#D96B27" />
                  <stop offset="100%" stopColor="#8B2500" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Line 1: Top-Left Node -> Center Hub */}
              <path
                d="M 28% 22% C 38% 28%, 42% 40%, 48% 46%"
                fill="none"
                stroke={connectedNodeIds.includes(node0?.id) ? "#87A96B" : "#0A2540"}
                strokeWidth={connectedNodeIds.includes(node0?.id) ? "3.5" : "1.5"}
                strokeDasharray={connectedNodeIds.includes(node0?.id) ? "8 4" : "4 4"}
                strokeOpacity={connectedNodeIds.includes(node0?.id) ? "0.9" : "0.2"}
                className={connectedNodeIds.includes(node0?.id) ? "animate-dash-flow" : ""}
                filter={connectedNodeIds.includes(node0?.id) ? "url(#glowFilter)" : undefined}
              />

              {/* Line 2: Bottom-Left Node -> Center Hub */}
              <path
                d="M 28% 78% C 38% 72%, 42% 60%, 48% 54%"
                fill="none"
                stroke={connectedNodeIds.includes(node1?.id) ? "#87A96B" : "#0A2540"}
                strokeWidth={connectedNodeIds.includes(node1?.id) ? "3.5" : "1.5"}
                strokeDasharray={connectedNodeIds.includes(node1?.id) ? "8 4" : "4 4"}
                strokeOpacity={connectedNodeIds.includes(node1?.id) ? "0.9" : "0.2"}
                className={connectedNodeIds.includes(node1?.id) ? "animate-dash-flow" : ""}
                filter={connectedNodeIds.includes(node1?.id) ? "url(#glowFilter)" : undefined}
              />

              {/* Line 3: Top-Right Node -> Center Hub */}
              <path
                d="M 72% 22% C 62% 28%, 58% 40%, 52% 46%"
                fill="none"
                stroke={connectedNodeIds.includes(node2?.id) ? "#87A96B" : "#0A2540"}
                strokeWidth={connectedNodeIds.includes(node2?.id) ? "3.5" : "1.5"}
                strokeDasharray={connectedNodeIds.includes(node2?.id) ? "8 4" : "4 4"}
                strokeOpacity={connectedNodeIds.includes(node2?.id) ? "0.9" : "0.2"}
                className={connectedNodeIds.includes(node2?.id) ? "animate-dash-flow" : ""}
                filter={connectedNodeIds.includes(node2?.id) ? "url(#glowFilter)" : undefined}
              />

              {/* Line 4: Bottom-Right Node -> Center Hub */}
              <path
                d="M 72% 78% C 62% 72%, 58% 60%, 52% 54%"
                fill="none"
                stroke={connectedNodeIds.includes(node3?.id) ? "#87A96B" : "#0A2540"}
                strokeWidth={connectedNodeIds.includes(node3?.id) ? "3.5" : "1.5"}
                strokeDasharray={connectedNodeIds.includes(node3?.id) ? "8 4" : "4 4"}
                strokeOpacity={connectedNodeIds.includes(node3?.id) ? "0.9" : "0.2"}
                className={connectedNodeIds.includes(node3?.id) ? "animate-dash-flow" : ""}
                filter={connectedNodeIds.includes(node3?.id) ? "url(#glowFilter)" : undefined}
              />
            </svg>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* ===================================================== */}
            {/* LEFT COLUMN: Node 0 (Top-Left) & Node 1 (Bottom-Left) */}
            {/* ===================================================== */}
            <div className="lg:col-span-4 space-y-6">
              {/* Satellite 1: Upstream Producer */}
              {node0 && (
                <div
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-subtle flex flex-col justify-between space-y-4 relative ${
                    connectedNodeIds.includes(node0.id)
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-elevated bg-emerald-50/10"
                      : "border-antigravity-navy/10 hover:border-antigravity-orange/40"
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F5ECE1] flex items-center justify-center text-[#8B2500]">
                        {getNodeIcon(node0.icon_type)}
                      </div>
                      <span className="font-sans text-[10px] font-bold text-antigravity-navy/80 uppercase tracking-wider">
                        {node0.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{node0.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Title & Stats */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-antigravity-navy">
                      {node0.title}
                    </h3>
                    <p className="text-xs text-antigravity-charcoal/70 mb-1.5">{node0.category}</p>
                    <div className="flex items-center gap-2 text-[11px] text-antigravity-charcoal/60 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-antigravity-orange" />
                        <span>{node0.distance_km} km away</span>
                      </span>
                      <span>•</span>
                      <span>{node0.capacity_metric}</span>
                    </div>
                  </div>

                  {/* Synergy Benefit Box */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#DFC9B2]/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B2500] uppercase tracking-wider">
                      <Lightbulb className="w-3 h-3 text-[#D96B27]" />
                      <span>Synergy Benefit:</span>
                    </div>
                    <p className="text-xs text-antigravity-charcoal/85 leading-relaxed">
                      {node0.synergy_benefit}
                    </p>
                  </div>

                  {/* Connect Action Button */}
                  <button
                    onClick={() => toggleConnectNode(node0.id)}
                    className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                      connectedNodeIds.includes(node0.id)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        : "bg-[#8B2500] hover:bg-[#721F00] text-white"
                    }`}
                  >
                    {connectedNodeIds.includes(node0.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected to Cluster</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Connect to Group</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Satellite 2: Input Wholesale */}
              {node1 && (
                <div
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-subtle flex flex-col justify-between space-y-4 relative ${
                    connectedNodeIds.includes(node1.id)
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-elevated bg-emerald-50/10"
                      : "border-antigravity-navy/10 hover:border-antigravity-orange/40"
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F5ECE1] flex items-center justify-center text-[#8B2500]">
                        {getNodeIcon(node1.icon_type)}
                      </div>
                      <span className="font-sans text-[10px] font-bold text-antigravity-navy/80 uppercase tracking-wider">
                        {node1.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{node1.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Title & Stats */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-antigravity-navy">
                      {node1.title}
                    </h3>
                    <p className="text-xs text-antigravity-charcoal/70 mb-1.5">{node1.category}</p>
                    <div className="flex items-center gap-2 text-[11px] text-antigravity-charcoal/60 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-antigravity-orange" />
                        <span>{node1.distance_km} km away</span>
                      </span>
                      <span>•</span>
                      <span>{node1.capacity_metric}</span>
                    </div>
                  </div>

                  {/* Synergy Benefit Box */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#DFC9B2]/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B2500] uppercase tracking-wider">
                      <Lightbulb className="w-3 h-3 text-[#D96B27]" />
                      <span>Synergy Benefit:</span>
                    </div>
                    <p className="text-xs text-antigravity-charcoal/85 leading-relaxed">
                      {node1.synergy_benefit}
                    </p>
                  </div>

                  {/* Connect Action Button */}
                  <button
                    onClick={() => toggleConnectNode(node1.id)}
                    className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                      connectedNodeIds.includes(node1.id)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        : "bg-[#8B2500] hover:bg-[#721F00] text-white"
                    }`}
                  >
                    {connectedNodeIds.includes(node1.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected to Cluster</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Connect to Group</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* ===================================================== */}
            {/* CENTER COLUMN: Central Enterprise Hub (Your Business) */}
            {/* ===================================================== */}
            <div className="lg:col-span-4">
              <div className="bg-[#8B2500] text-white rounded-3xl p-6 sm:p-8 shadow-elevated border-2 border-white/20 flex flex-col items-center text-center space-y-5 relative overflow-hidden group">
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-black/20 rounded-full blur-3xl pointer-events-none" />

                {/* Top Badge */}
                <div className="px-3.5 py-1 rounded-full bg-white/15 text-white/90 text-[10px] font-bold uppercase tracking-wider">
                  Your Enterprise (Hub)
                </div>

                {/* Center Icon */}
                <div className="w-16 h-16 rounded-2xl bg-white text-[#8B2500] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
                  <Store className="w-8 h-8" />
                </div>

                {/* Enterprise Info */}
                <div className="space-y-1">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {hub.name}
                  </h2>
                  <p className="text-xs text-white/80 max-w-xs">{hub.sector}</p>
                </div>

                {/* Core Locality Node */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs text-white/90">
                  <MapPin className="w-3 h-3 text-white" />
                  <span>{hub.locality_node}</span>
                </div>

                {/* Seeking Pill */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#8B2500] font-sans text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#8B2500] animate-pulse" />
                  <span>{hub.seeking}</span>
                </div>

                {/* 2 Bottom Stat Boxes */}
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <div className="bg-black/20 rounded-2xl p-3 border border-white/10">
                    <span className="text-[10px] text-white/70 block uppercase font-semibold">
                      Daily Processing
                    </span>
                    <span className="font-serif text-base font-bold text-white block">
                      {hub.daily_processing_volume}
                    </span>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-3 border border-white/10">
                    <span className="text-[10px] text-white/70 block uppercase font-semibold">
                      Active Peers
                    </span>
                    <span className="font-serif text-base font-bold text-white block">
                      {totalConnected} / {hub.max_peers} Connected
                    </span>
                  </div>
                </div>

                {/* Tap to Connect Hint */}
                <div className="text-[11px] text-white/80 font-medium">
                  {totalConnected === 0 ? (
                    <span>👆 Tap &apos;+ Connect&apos; to form group purchase</span>
                  ) : (
                    <span className="text-emerald-200 font-semibold">
                      ✓ {totalConnected} node(s) linked into active cluster
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ===================================================== */}
            {/* RIGHT COLUMN: Node 2 (Top-Right) & Node 3 (Bottom-Right) */}
            {/* ===================================================== */}
            <div className="lg:col-span-4 space-y-6">
              {/* Satellite 3: Peer Retailer */}
              {node2 && (
                <div
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-subtle flex flex-col justify-between space-y-4 relative ${
                    connectedNodeIds.includes(node2.id)
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-elevated bg-emerald-50/10"
                      : "border-antigravity-navy/10 hover:border-antigravity-orange/40"
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F5ECE1] flex items-center justify-center text-[#8B2500]">
                        {getNodeIcon(node2.icon_type)}
                      </div>
                      <span className="font-sans text-[10px] font-bold text-antigravity-navy/80 uppercase tracking-wider">
                        {node2.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{node2.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Title & Stats */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-antigravity-navy">
                      {node2.title}
                    </h3>
                    <p className="text-xs text-antigravity-charcoal/70 mb-1.5">{node2.category}</p>
                    <div className="flex items-center gap-2 text-[11px] text-antigravity-charcoal/60 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-antigravity-orange" />
                        <span>{node2.distance_km} km away</span>
                      </span>
                      <span>•</span>
                      <span>{node2.capacity_metric}</span>
                    </div>
                  </div>

                  {/* Synergy Benefit Box */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#DFC9B2]/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B2500] uppercase tracking-wider">
                      <Lightbulb className="w-3 h-3 text-[#D96B27]" />
                      <span>Synergy Benefit:</span>
                    </div>
                    <p className="text-xs text-antigravity-charcoal/85 leading-relaxed">
                      {node2.synergy_benefit}
                    </p>
                  </div>

                  {/* Connect Action Button */}
                  <button
                    onClick={() => toggleConnectNode(node2.id)}
                    className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                      connectedNodeIds.includes(node2.id)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        : "bg-[#8B2500] hover:bg-[#721F00] text-white"
                    }`}
                  >
                    {connectedNodeIds.includes(node2.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected to Cluster</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Connect to Group</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Satellite 4: Infrastructure Sharing */}
              {node3 && (
                <div
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-subtle flex flex-col justify-between space-y-4 relative ${
                    connectedNodeIds.includes(node3.id)
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-elevated bg-emerald-50/10"
                      : "border-antigravity-navy/10 hover:border-antigravity-orange/40"
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F5ECE1] flex items-center justify-center text-[#8B2500]">
                        {getNodeIcon(node3.icon_type)}
                      </div>
                      <span className="font-sans text-[10px] font-bold text-antigravity-navy/80 uppercase tracking-wider">
                        {node3.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{node3.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Title & Stats */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-antigravity-navy">
                      {node3.title}
                    </h3>
                    <p className="text-xs text-antigravity-charcoal/70 mb-1.5">{node3.category}</p>
                    <div className="flex items-center gap-2 text-[11px] text-antigravity-charcoal/60 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-antigravity-orange" />
                        <span>{node3.distance_km} km away</span>
                      </span>
                      <span>•</span>
                      <span>{node3.capacity_metric}</span>
                    </div>
                  </div>

                  {/* Synergy Benefit Box */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-[#DFC9B2]/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B2500] uppercase tracking-wider">
                      <Lightbulb className="w-3 h-3 text-[#D96B27]" />
                      <span>Synergy Benefit:</span>
                    </div>
                    <p className="text-xs text-antigravity-charcoal/85 leading-relaxed">
                      {node3.synergy_benefit}
                    </p>
                  </div>

                  {/* Connect Action Button */}
                  <button
                    onClick={() => toggleConnectNode(node3.id)}
                    className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                      connectedNodeIds.includes(node3.id)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        : "bg-[#8B2500] hover:bg-[#721F00] text-white"
                    }`}
                  >
                    {connectedNodeIds.includes(node3.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected to Cluster</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Connect to Group</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* POOLED SYNERGY SUMMARY BAR (Activates as nodes are linked) */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-antigravity-navy/10 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-serif text-lg font-bold text-antigravity-navy">
                Cluster Synergy Economics
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {totalConnected} / 4 Connected
              </span>
            </div>
            <p className="font-sans text-xs text-antigravity-charcoal/70 max-w-xl">
              {totalConnected > 0
                ? `You have connected ${totalConnected} enterprise node(s). Mutual bulk procurement and logistics agreements are ready.`
                : "Connect with any of the 4 nodes above to calculate pooled cash discounts and shared cold chain margins."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="bg-[#FAF7F2] border border-[#DFC9B2] px-4 py-2.5 rounded-2xl text-center min-w-[170px]">
              <span className="text-[10px] uppercase font-bold text-antigravity-charcoal/60 block">
                Est. Monthly Synergy
              </span>
              <span className="font-serif text-lg font-bold text-[#8B2500]">
                {totalMonthlySavings > 0
                  ? `₹${totalMonthlySavings.toLocaleString("en-IN")}/Mo`
                  : "₹0 / Mo"}
              </span>
            </div>

            <button
              onClick={() => setShowPactModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-antigravity-navy hover:bg-[#081E33] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Review Collective Pact</span>
            </button>
          </div>
        </div>

        {/* Collective Pact Modal */}
        {showPactModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-elevated border border-antigravity-navy/10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-antigravity-navy/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-antigravity-navy">
                      {locality} Cluster Collective Pact
                    </h3>
                    <span className="text-[10px] text-antigravity-charcoal/60">
                      Standardized MSME/NABARD Cluster Framework
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPactModal(false)}
                  className="w-7 h-7 rounded-full bg-antigravity-navy/5 text-antigravity-navy/70 hover:bg-antigravity-navy/10 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-antigravity-charcoal/80 leading-relaxed">
                <div className="p-3 bg-[#FBF6ED] rounded-xl border border-[#EADECB] flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#8B2500] shrink-0 mt-0.5" />
                  <p>
                    <strong>Privacy-Safe Guarantee:</strong> Personal telephone numbers and private
                    residential addresses are never shared. All communications occur through verified
                    institutional trade identifiers.
                  </p>
                </div>

                <h4 className="font-bold text-antigravity-navy uppercase text-[11px] tracking-wider pt-1">
                  Active Collective Perks:
                </h4>
                <ul className="space-y-2">
                  {clusterData?.collective_perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-[11px] text-antigravity-charcoal/60 pt-2 border-t border-antigravity-navy/10">
                  {clusterData?.unlocked_synergy_note}
                </p>
              </div>

              {allianceConfirmed ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2 animate-in fade-in">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-emerald-900">
                    Cluster Alliance Active & Verified!
                  </h4>
                  <p className="text-xs text-emerald-800/80">
                    Supply chain synergies and 10% concessional credit parameters are registered for {locality}.
                  </p>
                  <button
                    onClick={() => {
                      setShowPactModal(false);
                      setAllianceConfirmed(false);
                    }}
                    className="mt-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowPactModal(false)}
                    className="px-4 py-2 rounded-xl bg-antigravity-navy/5 text-antigravity-charcoal text-xs font-semibold hover:bg-antigravity-navy/10 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setAllianceConfirmed(true)}
                    className="px-5 py-2 rounded-xl bg-[#8B2500] hover:bg-[#721F00] text-white text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Confirm Alliance
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Toolbar */}
        <div className="bg-white rounded-3xl p-6 border border-antigravity-navy/10 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-serif text-base font-bold text-antigravity-navy mb-0.5">
              Explore Next Strategic Advisor Steps
            </h4>
            <p className="font-sans text-xs text-antigravity-charcoal/70">
              Check concessional scheme subsidies or review the complete 5-section Feasibility Matrix.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {onProceedToSchemes && (
              <button
                onClick={onProceedToSchemes}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-antigravity-navy hover:bg-[#081E33] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Scheme Calculator</span>
              </button>
            )}

            {onProceedToFeasibility && (
              <button
                onClick={onProceedToFeasibility}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Feasibility Matrix</span>
              </button>
            )}

            {onProceedToDpr && (
              <button
                onClick={onProceedToDpr}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-[#8B2500] hover:bg-[#721F00] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
