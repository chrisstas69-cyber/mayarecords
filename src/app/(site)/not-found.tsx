import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="display-lg text-cream">This one never made the crate.</h1>
      <p className="mt-4 max-w-sm text-sand">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="mt-8 border border-gold/50 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-night"
      >
        Back to the floor
      </Link>
    </div>
  );
}
