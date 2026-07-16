import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ServiceWorkerRegistration } from "@/components/site/service-worker-registration";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;
const adsensePublisherId = process.env.ADSENSE_PUBLISHER_ID?.trim();
const googleAdsenseAccount = /^pub-\d{10,20}$/.test(adsensePublisherId ?? "")
  ? `ca-${adsensePublisherId}`
  : undefined;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090c11",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "One Pixel Off — Free Spot-the-Difference Puzzle Game",
    template: "%s | One Pixel Off",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "One Pixel Off" }],
  creator: "One Pixel Off",
  publisher: "One Pixel Off",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: "One Pixel Off — Can you spot the anomaly?",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "One Pixel Off — Can you spot the anomaly?",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: googleSiteVerification
    ? { google: googleSiteVerification }
    : undefined,
  other: googleAdsenseAccount
    ? { "google-adsense-account": googleAdsenseAccount }
    : undefined,
  category: "games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
