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
        {/* Global Rural Business Atmospheric Background Wallpaper */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-100"
            style={{
              backgroundImage: "url('/sahaay-business-bg.jpg')",
            }}
          />
          {/* Atmospheric gradient overlay: blends rural countryside with clean glassmorphic readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-[#FDFBF7]/55 to-[#FDFBF7]/80 backdrop-blur-[1px]" />
        </div>

        <PwaManager />
        {children}
      </body>
    </html>
  );
}
