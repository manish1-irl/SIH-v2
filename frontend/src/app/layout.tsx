import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaManager from "@/components/pwa/PwaManager";

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Sahaay | Hyper-Local AI Business Advisor",
  description: "Hyper-Local AI Business Advisor for rural Indian entrepreneurs. Voice-first, multilingual, zero hallucination guidance connected with government schemes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sahaay",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-antigravity-charcoal font-sans antialiased selection:bg-antigravity-sage/30 relative">
        {/* Modern Vibrant Radiant Mesh & Subtle Geometric Drafting Canvas (Non-Generic, High-End) */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#FAF7F2]">
          {/* Subtle Geometric Topographic Dot Matrix Pattern */}
          <div
            className="absolute inset-0 opacity-[0.32]"
            style={{
              backgroundImage: "radial-gradient(rgba(10, 37, 64, 0.16) 1.25px, transparent 1.25px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Radiant Ambient Aurora Mesh Gradients using Antigravity Palette */}
          {/* 1. Golden Dawn / Solar Amber Aura (Hero center glow) */}
          <div
            className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[850px] sm:w-[1100px] h-[520px] rounded-full blur-[110px] opacity-80 animate-float-slow"
            style={{
              background: "radial-gradient(ellipse at center, rgba(217, 107, 39, 0.28) 0%, rgba(245, 158, 11, 0.16) 45%, transparent 75%)",
            }}
          />

          {/* 2. Earthy Sage & Agricultural Emerald Radiance (Left flank) */}
          <div
            className="absolute top-[22%] -left-[10%] w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] rounded-full blur-[120px] opacity-70 animate-float-reverse"
            style={{
              background: "radial-gradient(circle at center, rgba(135, 169, 107, 0.28) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 75%)",
            }}
          />

          {/* 3. Deep Sapphire & Navy Calming Anchor (Right flank) */}
          <div
            className="absolute top-[18%] -right-[12%] w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] rounded-full blur-[130px] opacity-60 animate-float-slow"
            style={{
              background: "radial-gradient(circle at center, rgba(10, 37, 64, 0.16) 0%, rgba(37, 99, 235, 0.09) 50%, transparent 75%)",
            }}
          />

          {/* 4. Warm Harvest Honey & Terracotta Base Glow (Bottom center) */}
          <div
            className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1100px] h-[450px] rounded-full blur-[120px] opacity-65"
            style={{
              background: "radial-gradient(ellipse at center, rgba(217, 107, 39, 0.20) 0%, rgba(135, 169, 107, 0.15) 40%, transparent 80%)",
            }}
          />

          {/* Soft atmospheric luminance overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30" />
        </div>

        <PwaManager />
        {children}
      </body>
    </html>
  );
}
