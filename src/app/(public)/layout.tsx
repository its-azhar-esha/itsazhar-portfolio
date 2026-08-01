import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChatProvider } from "@/providers";
import { PageTransition } from "@/components/page-transition";
import { ToastProvider } from "@/components/ui/toast";
import { CtaClickTracker, PageViewTracker } from "@/components/analytics/trackers";
import { getPublicSiteSettings } from "@/lib/settings";
import { resolveMediaValue } from "@/lib/media/repository";
import dynamic from "next/dynamic";

const MobileNav = dynamic(() =>
  import("@/components/mobile-nav").then((m) => ({ default: m.MobileNav })),
);

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSiteSettings();
  const logoUrl = settings.logo ? await resolveMediaValue(settings.logo) : null;

  if (settings.maintenance_mode) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="bg-primary flex h-14 w-14 items-center justify-center rounded-2xl">
          <span className="text-primary-foreground text-lg font-bold">
            {settings.site_name.charAt(0)}
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          {settings.site_name} — Under Maintenance
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md text-sm">
          The site is temporarily down for maintenance. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <ChatProvider enabled={settings.show_ai_chat}>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar
            logoUrl={logoUrl}
            bookingUrl={settings.booking_url}
            showBlog={settings.show_blog}
            showHub={settings.show_hub}
            showPlayground={settings.show_playground}
            navOrder={settings.nav_order}
          />
          <main id="main-content" className="flex-1 pb-[72px] md:pb-0">
            <PageTransition>{children}</PageTransition>
          </main>
          <MobileNav settings={settings} />
          <Footer settings={settings} logoUrl={logoUrl} />
          <PageViewTracker />
          <CtaClickTracker />
        </div>
      </ToastProvider>
    </ChatProvider>
  );
}
