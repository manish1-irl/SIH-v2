import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Antigravity | Voice-First AI Business Advisor",
  description: "Speak to get feasibility analysis, government schemes, and financial planning for rural Indian entrepreneurs. Voice-first, multilingual, zero hallucination.",
  manifest: "/manifest.json",
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
        {children}
      </body>
    </html>
  );
}
