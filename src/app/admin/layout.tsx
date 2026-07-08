import type { Metadata } from "next";
import { AdminShell } from "./shell";

export const metadata: Metadata = {
  title: { default: "Label Portal", template: "%s — Label Portal" },
  robots: { index: false, follow: false },
};

// The portal is session-based and reads live data — never prerender it.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
