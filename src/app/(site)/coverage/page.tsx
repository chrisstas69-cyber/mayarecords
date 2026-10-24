import type { Metadata } from "next";
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
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-10 border-b border-line pb-10">
        <p className="eyebrow mb-3">In the press</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="display-lg text-cream">Press</h1>
            <p className="mt-4 max-w-xl leading-relaxed text-sand">
              Two decades of interviews, reviews and chart history.
            </p>
          </div>
          <p className="text-sm text-sand">
            {stats.total} pieces · {stats.outlets} outlets
            {stats.years ? ` · ${stats.years}` : ""}
          </p>
        </div>
      </header>
      <PressBrowser items={JOESKI_PRESS} />
    </div>
  );
}
