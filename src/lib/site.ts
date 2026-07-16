const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const fallbackSiteUrl =
  process.env.NODE_ENV === "production"
    ? "https://one-pixel-off.vercel.app"
    : "http://localhost:3000";

function resolveSiteUrl(): string {
  const candidate =
    configuredSiteUrl ||
    (vercelProductionHost ? `https://${vercelProductionHost}` : fallbackSiteUrl);
  const parsed = new URL(candidate);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  return parsed.toString().replace(/\/$/, "");
}

export const siteConfig = {
  name: "One Pixel Off",
  shortName: "Pixel Off",
  description:
    "A free visual puzzle game with code-generated boards, one tiny anomaly, and fifteen seconds to find it.",
  url: resolveSiteUrl(),
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
