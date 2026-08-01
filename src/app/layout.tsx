import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { getPublicSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

const Analytics = dynamic(() =>
  import("@/components/analytics").then((m) => ({ default: m.Analytics })),
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = SITE_URL;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

const FALLBACK_TITLE = "Azhar | Automate Anything — AI Automation Specialist";
const FALLBACK_DESCRIPTION =
  "AI Automation Specialist. I build intelligent AI automation systems using AI agents, n8n workflows, and API integrations that eliminate repetitive work, streamline operations, and help businesses scale faster.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteTitle = settings.site_title || FALLBACK_TITLE;
  const siteDescription = settings.site_description || FALLBACK_DESCRIPTION;
  const siteName = settings.site_name || "Azhar";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteTitle,
      template: `%s | ${siteName} | AI Automation Systems`,
    },
    description: siteDescription,
    keywords: [
      "AI automation specialist",
      "workflow automation",
      "n8n developer",
      "AI agents",
      "business automation",
      "process automation",
      "API integration",
      "Supabase",
      "automation consultant",
      "Bangladesh automation developer",
    ],
    authors: [{ name: "Azhar Mahmud Alif" }],
    creator: "Azhar Mahmud Alif",
    publisher: "Azhar Mahmud Alif",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: `${siteName} | AI Automation Systems`,
      title: siteTitle,
      description: siteDescription,
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      creator: "@azhar_m_alif",
    },
    alternates: { canonical: baseUrl },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSiteSettings();
  const ga4Id = settings.ga4_measurement_id?.trim();
  const gtmId = settings.gtm_id?.trim();
  const clarityId = settings.clarity_project_id?.trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${baseUrl}/#person`,
        name: "Azhar Mahmud Alif",
        jobTitle: "AI Automation Specialist",
        url: baseUrl,
        sameAs: [
          "https://linkedin.com/in/azharmahmudalif",
          "https://github.com/azharmahmudalif",
          "https://x.com/azhar_m_alif",
        ],
        knowsAbout: [
          "AI Agents",
          "Workflow Automation",
          "n8n",
          "API Integration",
          "Business Automation",
          "React",
          "TypeScript",
          "Supabase",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Azhar | AI Automation Systems",
        description:
          "AI Automation Specialist — building intelligent AI automation systems for businesses worldwide.",
        publisher: { "@id": `${baseUrl}/#person` },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="service-worker" href="/sw.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Azhar" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://mc.yandex.ru" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {ga4Id ? <GoogleAnalytics gaId={ga4Id} /> : null}
      </head>
      <body className="bg-background text-foreground min-h-full antialiased">
        <a
          href="#main-content"
          className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        {clarityId ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${clarityId}');`,
            }}
          />
        ) : null}
        <Suspense fallback={null}>
          <Analytics gaId={ga4Id ?? undefined} />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
