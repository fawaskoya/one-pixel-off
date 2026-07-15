export const siteConfig = {
  name: "One Pixel Off",
  shortName: "Pixel Off",
  description:
    "A free visual puzzle game with code-generated boards, one tiny anomaly, and fifteen seconds to find it.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
