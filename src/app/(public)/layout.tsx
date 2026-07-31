import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChatProvider } from "@/providers";
import { PageTransition } from "@/components/page-transition";
import dynamic from "next/dynamic";

const MobileNav = dynamic(() =>
  import("@/components/mobile-nav").then((m) => ({ default: m.MobileNav })),
);

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 pb-[72px] md:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileNav />
        <Footer />
      </div>
    </ChatProvider>
  );
}
