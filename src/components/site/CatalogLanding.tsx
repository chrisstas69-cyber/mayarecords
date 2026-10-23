import { CatalogBrowser } from "./CatalogBrowser";
import { PromotionCard } from "./PromotionCard";
import { DiscographyTabs } from "./DiscographyTabs";
import type { Release } from "@/lib/types";
import type { PromotionConfig } from "@/lib/promotion";
import { resolvePromotion } from "@/lib/promotion";

export function CatalogLanding({
  releases,
  promotion,
}: {
  releases: Release[];
  promotion: PromotionConfig;
}) {
  const spotlight = resolvePromotion(
    promotion,
    releases,
    new Date().toISOString().slice(0, 10),
  );
  return (
    <div className="catalog-shell mx-auto max-w-[1600px] px-5 pb-28 pt-24 sm:px-8 lg:px-10">
      <header
        className={`mb-7 grid items-center gap-8 ${spotlight ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}
      >
        <div>
          <p className="eyebrow mb-3">Maya Records</p>
          <h1 className="display-lg text-cream">The Catalog</h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-sand">
            Independent label history <span className="mx-2 text-gold">·</span>{" "}
            Est. 2001 <span className="mx-2 text-gold">·</span>{" "}
            {releases.length} releases
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-sand">
            Every release, from MAYA001 forward. Tribal, deep and tech house —
            released on its own terms since 2001.
          </p>
          <DiscographyTabs active="releases" compact />
        </div>
        {spotlight && <PromotionCard promotion={spotlight} />}
      </header>
      <CatalogBrowser releases={releases} />
    </div>
  );
}
