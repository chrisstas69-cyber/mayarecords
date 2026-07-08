import type { Metadata } from "next";
import { Gilda_Display, Jost } from "next/font/google";
import "./globals.css";

const gilda = Gilda_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gilda",
  display: "swap",
});

const jost = Jost({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Joeski — DJ · Producer · Maya Records",
    template: "%s — Joeski / Maya Records",
  },
  description:
    "Joeski. Three decades of New York house lineage, Colombian roots. Latin/tribal house spearhead, founder of Maya Records, resident at Stereo Montréal. Perpetual Beatport Top 100.",
  openGraph: {
    siteName: "Joeski / Maya Records",
    type: "website",
    images: ["/images/live/hero-crowd-1.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gilda.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
