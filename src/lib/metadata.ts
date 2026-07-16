import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

type PageMetadataOptions = Readonly<{
  title: string;
  description: string;
  path: `/${string}` | "/";
  absoluteTitle?: boolean;
  noIndex?: boolean;
}>;

function brandedTitle(title: string): string {
  return title.includes(siteConfig.name)
    ? title
    : `${title} | ${siteConfig.name}`;
}

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const socialTitle = brandedTitle(title);
  const shouldUseAbsoluteTitle = absoluteTitle || title.includes(siteConfig.name);

  return {
    title: shouldUseAbsoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      title: socialTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}
