import { Cormorant_Garamond, DM_Sans } from "next/font/google";
export const homeSerif = Cormorant_Garamond({
  weight: ["500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-home-serif",
  display: "swap",
});
export const homeSans = DM_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-home-sans",
  display: "swap",
});
