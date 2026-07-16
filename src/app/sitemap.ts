import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const indexableRoutes = [
  "",
  "/focus",
  "/play",
  "/how-to-play",
  "/categories",
  "/about",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes.map((route) => ({
    url: absoluteUrl(route || "/"),
  }));
}
