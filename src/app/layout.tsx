import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { getPublicSiteSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site/urls";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

const FALLBACK_TITLE = "Azhar (ItsAzhar) | AI Automation Expert & n8n Developer";
const FALLBACK_DESCRIPTION =
  "AI Automation Expert. I build intelligent AI automation systems using AI agents, n8n workflows, and API integrations that eliminate repetitive work, streamline operations, and help businesses scale faster.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteTitle = settings.site_title || FALLBACK_TITLE;
  const siteDescription = settings.site_description || FALLBACK_DESCRIPTION;
  const siteName = settings.site_name || "Azhar";
  const baseUrl = await getSiteUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: siteTitle,
      template: `%s | ${siteName} | AI Automation Systems`,
    },
    description: siteDescription,
    keywords: [
      "AI automation",
      "AI automation expert",
      "automation expert",
      "automation specialist",
      "automation freelancer",
      "workflow automation",
      "business automation",
      "process automation",
      "n8n expert",
      "n8n developer",
      "AI agent developer",
      "AI consultant",
      "API integration",
      "custom automation",
      "AI agents",
      "ItsAzhar",
      "Azhar",
      "itsazhar.com",
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
  const baseUrl = await getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${baseUrl}/#person`,
        name: "Azhar Mahmud Alif",
        alternateName: "Azhar",
        jobTitle: "AI Automation Expert",
        url: baseUrl,
        email: "azhar@itsazhar.com",
        sameAs: [settings.social_linkedin, settings.social_github, settings.social_twitter].filter(
          (url): url is string => Boolean(url),
        ),
        knowsAbout: [
          "AI Automation",
          "AI Agents",
          "n8n",
          "Workflow Automation",
          "Business Automation",
          "Process Automation",
          "API Integration",
          "AI Consulting",
        ],
        worksFor: { "@id": `${baseUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "ItsAzhar",
        alternateName: "ItsAzhar — AI Automation by Azhar",
        url: baseUrl,
        email: "azhar@itsazhar.com",
        founder: { "@id": `${baseUrl}/#person` },
        knowsAbout: [
          "AI Automation",
          "n8n",
          "AI Agents",
          "Workflow Automation",
          "API Integration",
          "Business Automation",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "ItsAzhar | AI Automation Expert & n8n Developer",
        alternateName: "ItsAzhar",
        description:
          "AI Automation Expert — building intelligent AI automation systems with AI agents, n8n workflows and API integrations for businesses worldwide.",
        publisher: { "@id": `${baseUrl}/#person` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/hub?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
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
        <link rel="preconnect" href="https://www.googletagmanager.com" />
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
