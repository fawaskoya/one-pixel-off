import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const indexableRoutes = [
  "",
  "/play",
  "/how-to-play",
  "/categories",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes.map((route, index) => ({
    url: absoluteUrl(route || "/"),
    changeFrequency: index < 3 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : index < 3 ? 0.8 : 0.5,
  }));
}
