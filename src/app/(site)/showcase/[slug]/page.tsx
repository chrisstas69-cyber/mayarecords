import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReleaseShowcaseFeature, SampleTracklist } from "@/components/site/ReleaseShowcase";
import { RELEASE_SHOWCASES } from "@/lib/release-showcase";
import { homeSerif, homeSans } from "@/lib/home-fonts";
import "../../new-releases/showcase.css";

export const metadata: Metadata = { title: "Sample Release — Design Preview", robots: { index: false, follow: false } };
export function generateStaticParams() { return RELEASE_SHOWCASES.map(s => ({ slug: s.slug })); }
export default async function SampleReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const showcase = RELEASE_SHOWCASES.find(s => s.slug === slug);
  if (!showcase) notFound();
  return <div className={`showcase-page ${homeSerif.variable} ${homeSans.variable}`}><div className="showcase-container">
    <div className="showcase-breadcrumb"><Link href="/new-releases">New from Maya</Link><span>/</span><Link href={showcase.labelHref}>{showcase.label}</Link><span>/</span><span>Design preview</span></div>
    <h1 className="showcase-demo-title">Sample release experience</h1>
    <ReleaseShowcaseFeature showcase={showcase} full />
    <SampleTracklist showcase={showcase} />
    <section className="showcase-original"><h2>The original record</h2><p>This demonstration uses {showcase.release.catalogNumber}, released in {showcase.release.year}. The original vinyl details remain in the historical archive.</p><a href={showcase.release.discogsUrl} target="_blank" rel="noopener noreferrer">View original pressing on Discogs</a><Link href={showcase.labelHref}>Explore {showcase.label}</Link></section>
  </div></div>;
}
