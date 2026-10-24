import { NavBar } from "@/components/site/NavBar";
import { Footer } from "@/components/site/Footer";
import { PlayerProvider } from "@/components/site/AudioPlayer";
import { CartProvider } from "@/components/site/Cart";

import { InteriorFooter } from "@/components/site/HomeInteractions";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayerProvider>
      <CartProvider>
        <NavBar />
        <main className="min-h-screen">{children}</main>
        <InteriorFooter>
          <Footer />
        </InteriorFooter>
      </CartProvider>
    </PlayerProvider>
  );
}
