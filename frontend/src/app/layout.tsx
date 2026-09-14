import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antigravity | Hyper-Local AI Business Advisor",
  description: "Feasibility engine, real government schemes, deterministic financials, and business lifecycle companion for rural & semi-urban entrepreneurs.",
  manifest: "/manifest.json",
  themeColor: "#0A2540",
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
