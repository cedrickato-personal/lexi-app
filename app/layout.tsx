import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Fraunces,
  Noto_Sans_SC,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_Devanagari,
  Noto_Sans_Bengali,
  Noto_Sans_Arabic,
  Noto_Sans_Hebrew,
  Noto_Sans_Thai,
  Noto_Naskh_Arabic,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { OnboardingGate } from "@/components/onboarding-gate";

const fontSans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const fontMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// Script-appropriate Noto fonts loaded once at the root and referenced via CSS vars
const fontCJK_SC = Noto_Sans_SC({ variable: "--font-cjk-sc", subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const fontCJK_JP = Noto_Sans_JP({ variable: "--font-cjk-jp", subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const fontCJK_KR = Noto_Sans_KR({ variable: "--font-cjk-kr", subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const fontDevanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["latin", "devanagari"], weight: ["400", "500", "700"], display: "swap" });
const fontBengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["latin", "bengali"], weight: ["400", "500", "700"], display: "swap" });
const fontArabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["latin", "arabic"], weight: ["400", "500", "700"], display: "swap" });
const fontNastaliq = Noto_Naskh_Arabic({ variable: "--font-nastaliq", subsets: ["latin", "arabic"], weight: ["400", "500", "700"], display: "swap" });
const fontHebrew = Noto_Sans_Hebrew({ variable: "--font-hebrew", subsets: ["latin", "hebrew"], weight: ["400", "500", "700"], display: "swap" });
const fontThai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["latin", "thai"], weight: ["400", "500", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Lexi — A multi-language curriculum generator",
  description:
    "Generate research-grounded weekly lessons across 31 languages — from A1 to C2 — powered by Claude.ai.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    fontSans.variable,
    fontMono.variable,
    fontDisplay.variable,
    fontCJK_SC.variable,
    fontCJK_JP.variable,
    fontCJK_KR.variable,
    fontDevanagari.variable,
    fontBengali.variable,
    fontArabic.variable,
    fontNastaliq.variable,
    fontHebrew.variable,
    fontThai.variable,
  ].join(" ");

  return (
    <html lang="en" className={fontVars}>
      <body className="font-sans antialiased text-stone-900 bg-[#FAF8F3] selection:bg-orange-200/60">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#FAF8F3] via-[#FAF8F3] to-[#F5F0E8] pointer-events-none" />
        <OnboardingGate>{children}</OnboardingGate>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
