"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X, WifiOff, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // A new update is available
                  console.info("[PWA] New version available, reloading on prompt");
                }
              });
            }
          });
        } catch (error) {
          console.error("[PWA] Service Worker registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    }

    // 2. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 3. Listen for Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Detect successful installation
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    // 5. iOS detection (non-standalone Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }

    // 6. Online / Offline network listeners
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineNotice(true);
    };

    setIsOffline(!navigator.onLine);
    setShowOfflineNotice(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosGuide(true);
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("[PWA] Prompt error:", err);
    }
  };

  return (
    <>
      {/* Offline Status Banner */}
      {showOfflineNotice && isOffline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-antigravity-orange text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span>
              <strong>Offline Mode:</strong> You are currently offline. Saved business data remains accessible.
            </span>
          </div>
          <button
            onClick={() => setShowOfflineNotice(false)}
            className="p-1 hover:bg-white/20 rounded transition ml-2"
            aria-label="Dismiss offline banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Install Prompt for Android & Desktop Chrome/Edge */}
      {isInstallable && !isInstalled && !dismissedPrompt && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm bg-white border border-antigravity-navy/15 rounded-2xl p-3.5 shadow-elevated flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative shrink-0">
            <Image
              src="/icon-192.png"
              alt="Sahaay App Icon"
              width={44}
              height={44}
              className="rounded-xl border border-antigravity-navy/10 shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 bg-antigravity-sage text-white p-0.5 rounded-full ring-2 ring-white">
              <Download className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-bold text-xs text-antigravity-navy leading-tight truncate">
              Install Sahaay App
            </h4>
            <p className="text-[11px] text-antigravity-charcoal/70 leading-tight mt-0.5">
              Instant offline access & home screen convenience
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-antigravity-navy text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-antigravity-navy/90 active:scale-95 transition shadow-sm"
            >
              Install
            </button>
            <button
              onClick={() => setDismissedPrompt(true)}
              className="p-1 text-antigravity-charcoal/40 hover:text-antigravity-charcoal rounded-md transition"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-antigravity-navy/10 shadow-elevated text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-antigravity-navy" />
                <h3 className="font-serif font-bold text-base text-antigravity-navy">
                  Install on iOS
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-antigravity-charcoal/40 hover:text-antigravity-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-antigravity-charcoal/75 mb-4 leading-relaxed">
              To install Sahaay on your iPhone or iPad, follow these simple steps in Safari:
            </p>

            <ol className="text-xs text-antigravity-charcoal/85 space-y-3 mb-5 pl-1">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-antigravity-cream border border-antigravity-navy/20 font-bold flex items-center justify-center text-[11px] text-antigravity-navy shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="inline-flex items-center gap-0.5"><Share className="w-3.5 h-3.5 inline text-antigravity-navy" /> Share</strong> button in Safari toolbar
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-antigravity-cream border border-antigravity-navy/20 font-bold flex items-center justify-center text-[11px] text-antigravity-navy shrink-0">
                  2
                </span>
                <span>Scroll down and select <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-antigravity-cream border border-antigravity-navy/20 font-bold flex items-center justify-center text-[11px] text-antigravity-navy shrink-0">
                  3
                </span>
                <span>Tap <strong>Add</strong> in top right corner</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 rounded-xl bg-antigravity-navy text-white text-xs font-semibold hover:bg-antigravity-navy/90 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
