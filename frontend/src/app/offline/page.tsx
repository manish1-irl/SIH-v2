"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { WifiOff, RotateCcw, ArrowLeft, Database } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main className="min-h-screen bg-antigravity-cream flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-antigravity-navy/10 shadow-elevated">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-antigravity-orange/10 flex items-center justify-center text-antigravity-orange mx-auto">
              <WifiOff className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Image
            src="/sahaay-logo.png"
            alt="Sahaay Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-serif font-bold text-xl text-antigravity-navy">Sahaay</span>
        </div>

        <h1 className="font-serif text-2xl font-bold text-antigravity-navy mb-2">
          You are currently offline
        </h1>

        <p className="font-sans text-sm text-antigravity-charcoal/70 mb-6 leading-relaxed">
          No active internet connection was detected. Sahaay caches your core dashboard and offline data, but live AI advisory requires network access.
        </p>

        <div className="bg-antigravity-cream/60 rounded-xl p-4 border border-antigravity-navy/5 mb-6 text-left flex items-start gap-3">
          <Database className="w-5 h-5 text-antigravity-sage shrink-0 mt-0.5" />
          <div className="text-xs text-antigravity-charcoal/80 space-y-1">
            <span className="font-semibold block text-antigravity-navy">Offline Database Active</span>
            <span>Previously viewed schemes, local clusters, and offline records remain stored on your device.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-antigravity-navy text-white font-medium text-sm hover:bg-antigravity-navy/90 active:scale-[0.99] transition shadow-subtle"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Connection
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-antigravity-navy/15 text-antigravity-navy font-medium text-sm hover:bg-antigravity-cream transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home / Dashboard
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-antigravity-charcoal/40 font-sans">
        Sahaay Hyper-Local AI Business Advisor • Progressive Web App
      </p>
    </main>
  );
}
