import Image from "next/image";
import type { PressItem } from "@/lib/coverage";
import { pressDateLabel } from "@/lib/coverage";
import { ArrowUpRight } from "lucide-react";
export function PressHighlights({ items }: {
    items: PressItem[];
}) {
    const live = items.filter(item => item.status === "Live" && item.url);
    const mixmag = live.find(item => item.url.endsWith("/press/joeski-mixmag-80-2024.pdf"));
    const bbc = live.find(item => item.outlet.startsWith("BBC Radio 1"));
    const maya = live.find(item => item.url.includes("thenightbazaar.co.uk/joeski-i-had"));
    if (!mixmag && !bbc && !maya)
        return null;
    const action = (item: PressItem) => <a className="press-read" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Read featured ${item.headline} (opens in a new tab)`}>Read <ArrowUpRight size={14} aria-hidden="true"/></a>;
    return <section className="press-highlights" aria-label="Selected press highlights">
    {mixmag && <>
      <div className="press-feature-cover"><Image src="/press/joeski-mixmag-80-2024-cover.webp" alt="Joeski on the full Mixmag Brazil Issue 80 cover" width={1280} height={1600} sizes="(max-width: 760px) 42vw, 28vw" priority/></div>
      <div className="press-feature-primary">
        <p className="press-kicker">Mixmag Brazil · Issue 80 · {mixmag.date}</p>
        <h2>Joeski. In his<br />own words.</h2>
        <p className="press-feature-description">An 11-page cover feature on the sound and story behind Maya Records.</p>
        {action(mixmag)}
      </div>
    </>}
    <div className="press-feature-secondary">
      {bbc && <div><p className="press-kicker">BBC Radio 1 · {pressDateLabel(bbc.date)}</p><h3>Pete Tong’s<br />Hall of Fame: Joeski</h3>{action(bbc)}</div>}
      {maya && <div><p className="press-kicker">The Night Bazaar · {pressDateLabel(maya.date)}</p><h3>Ten Maya Records<br />highlights</h3>{action(maya)}</div>}
    </div>
  </section>;
}
