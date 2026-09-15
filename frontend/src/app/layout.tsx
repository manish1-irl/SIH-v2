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
    <html lang="en" className="h-full bg-antigravity-cream">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-antigravity-cream text-antigravity-charcoal font-sans antialiased selection:bg-antigravity-sage/30">
        <PwaManager />
        {children}
      </body>
    </html>
  );
}
