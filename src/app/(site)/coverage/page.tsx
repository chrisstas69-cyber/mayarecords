import type { Metadata } from "next";
import { homeSerif, homeSans } from "@/lib/home-fonts";
import { PressHighlights } from "@/components/site/PressHighlights";
import "./coverage.css";
import { PressBrowser } from "@/components/site/PressBrowser";
import { JOESKI_PRESS } from "@/lib/data/coverage";
import { pressStats } from "@/lib/coverage";

const stats = pressStats(JOESKI_PRESS);
const description = `Joeski in the press — ${stats.total} pieces from ${stats.outlets} outlets${stats.years ? `, ${stats.years}` : ""}. Interviews, features, reviews and chart history.`;

export const metadata: Metadata = {
  title: "Press",
  description,
  alternates: { canonical: "/coverage" },
  openGraph: { title: "Joeski — Press", description, url: "/coverage" },
};

export default function CoveragePage() {
  return (
    <div className={`${homeSerif.variable} ${homeSans.variable} press-editorial`}>
      <header className="press-intro">
        <div><p className="press-kicker">In the press</p><h1>Press</h1></div>
        <p className="press-intro-copy">Selected features, interviews and broadcast moments from across the years.</p>
        <p className="press-intro-stats">{stats.total} pieces · {stats.outlets} outlets{stats.years ? ` · ${stats.years}` : ""}</p>
      </header>
      <PressHighlights items={JOESKI_PRESS} />
      <PressBrowser items={JOESKI_PRESS} />
    </div>
  );
}
