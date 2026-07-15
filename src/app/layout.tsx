import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ServiceWorkerRegistration } from "@/components/site/service-worker-registration";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "One Pixel Off — Spot the tiny mistake",
    template: "%s | One Pixel Off",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "spot the difference game",
    "visual puzzle",
    "daily puzzle",
    "browser game",
    "observation game",
  ],
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
